// Fluxos principais e capturas de revisão visual (dados fictícios de seed.json; não toca no Supabase).
// Uso:  cd tools && node flows.mjs      Saída: capturas em reports/flows/ e um resumo no console.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { chromium } from 'playwright-core';
import AxeBuilder from '@axe-core/playwright';
import { reports, chromePath, pageHtml, mockDbScript, seed } from './harness.mjs';

const out = path.join(reports, 'flows'); fs.mkdirSync(out, { recursive: true });
const log = []; let fails = 0;
const ok = (name, cond, extra = '') => { log.push(`${cond ? 'OK  ' : 'FALHA'} ${name}${extra ? ' — ' + extra : ''}`); if (!cond) fails++; };

function serve(html) {
  const s = http.createServer((q, r) => { if (q.url.startsWith('/favicon')) { r.writeHead(204); return r.end(); } r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); r.end(html); });
  return new Promise(res => s.listen(0, '127.0.0.1', () => res({ s, url: `http://127.0.0.1:${s.address().port}/` })));
}
const base = pageHtml();
const withDb = data => base.replace('<head>', '<head><script>' + mockDbScript(data) + '</script>');
const noHistory = (() => { const d = seed(); d.materials.forEach(m => { delete m.lastOpenedAt; }); return d; })();
// M1 a M8 criados; só M1 e M2 têm material (os demais devem aparecer como "Em produção"). Dados só na memória do teste.
const eightModules = (d, withNewMaterial = false) => {
  const x = JSON.parse(JSON.stringify(d));
  for (let i = 3; i <= 8; i++) x.areas.push({ id: 'm' + i, name: 'M' + i, parentId: '', order: i, stain: '', short: null });
  if (withNewMaterial) x.materials.push({ ...x.materials[0], id: 'novo-m3', title: 'Primeiro material do M3 (teste)', areaId: 'm3' });
  return x;
};
const loading = base.replace('<head>', '<head><script>window.claude={use:()=>new Promise(()=>{})}</script>');

const browser = await chromium.launch({ executablePath: chromePath(), headless: true });
const srv = {
  main: await serve(withDb(seed())), none: await serve(withDb(noHistory)), load: await serve(loading),
  prod: await serve(withDb(eightModules(noHistory))), prodLive: await serve(withDb(eightModules(noHistory, true))),
};

async function open(scheme, w, which = 'main') {
  const ctx = await browser.newContext({ viewport: { width: w, height: w < 500 ? 812 : 900 }, colorScheme: scheme, reducedMotion: 'no-preference' });
  const page = await ctx.newPage(); const errors = [];
  await ctx.route(/supabase\.co/, route => route.abort());
  page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error' && !/fonts\.g|net::ERR/.test(m.text())) errors.push(m.text()); });
  await page.goto(srv[which].url); await page.waitForTimeout(700);
  return { ctx, page, errors };
}
const shot = (page, name) => page.screenshot({ path: path.join(out, name + '.png') });
const hash = async (page, h) => { await page.evaluate(x => { location.hash = x; }, h); await page.waitForTimeout(350); };
const noOverflow = async (page, label) => ok(label + ': sem rolagem lateral', (await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 1);

for (const w of [320, 375, 1440]) for (const scheme of ['light', 'dark']) {
  const tag = `${w}-${scheme}`;
  const { ctx, page, errors } = await open(scheme, w);
  // início
  ok(`${tag} início: "Aberto por último" com histórico válido`, await page.locator('#h-feature').count() === 1);
  await shot(page, `inicio@${tag}`); await noOverflow(page, `${tag} início`);
  // catálogo
  await hash(page, 'todos'); await shot(page, `todos@${tag}`); await noOverflow(page, `${tag} todos`);
  const rows = await page.locator('#lib-results .entry').count(); ok(`${tag} catálogo lista materiais`, rows >= 5, `${rows} linhas`);
  // altura acompanha o conteúdo: nenhum título cortado
  const clipped = await page.evaluate(() => [...document.querySelectorAll('.entry-title button')].filter(b => b.scrollWidth > b.clientWidth + 1 || b.parentElement.scrollHeight > b.parentElement.clientHeight + 1).length);
  ok(`${tag} títulos longos sem corte`, clipped === 0);
  // filtros ativos
  if (!(await page.locator('#more').evaluate(d => d.open))) await page.click('#more summary');
  await page.selectOption('#f-status', 'em-estudo'); await page.waitForTimeout(150);
  await page.click('#f-fav'); await page.waitForTimeout(150);
  ok(`${tag} chips de filtros ativos`, await page.locator('#active-filters .af').count() === 2);
  await shot(page, `filtros@${tag}`); await noOverflow(page, `${tag} filtros`);
  await page.locator('#active-filters .af').first().click(); await page.waitForTimeout(150);
  ok(`${tag} remover chip atualiza lista`, await page.locator('#active-filters .af').count() === 1);
  await page.click('#clear-filters'); await page.waitForTimeout(150);
  ok(`${tag} limpar filtros`, await page.locator('#active-filters .af').count() === 0);
  // vazio
  await page.fill('#lib-q', 'zzzxyz'); await page.waitForTimeout(300);
  ok(`${tag} estado vazio da busca`, await page.locator('#lib-results .empty').count() === 1);
  await shot(page, `vazio@${tag}`); await page.click('#clear-filters');
  // divisão das matérias (assunto, período, nenhuma)
  if (!(await page.locator('#more').evaluate(d => d.open))) await page.click('#more summary');
  await page.selectOption('#f-group', 'none'); await page.waitForTimeout(200);
  ok(`${tag} sem divisão: nenhuma subseção`, await page.locator('#lib-results .sub-h').count() === 0);
  await page.selectOption('#f-group', 'subject'); await page.waitForTimeout(200);
  ok(`${tag} dividir por assunto`, await page.locator('#lib-results .sub-h').count() > 1);
  await page.click('#more summary'); await page.waitForTimeout(100);
  if (w < 1000) {
    ok(`${tag} leitura usa toda a largura sem índice permanente`, !(await page.locator('#thumbs').isVisible()) && await page.locator('#main').evaluate(el => el.getBoundingClientRect().width === innerWidth));
    await page.click('.tabbar [data-action="toc"]');
    ok(`${tag} explorar abre índice e informa expansão`, await page.locator('#thumbs').isVisible() && await page.getAttribute('.tabbar [data-action="toc"]', 'aria-expanded') === 'true');
  }
  const tabs = await page.locator('#thumbs .thumb').count();
  ok(`${tag} índice de dedo com abas`, tabs >= 2, String(tabs));
  const hs = await page.evaluate(() => [...document.querySelectorAll('#thumbs .thumb')].map(t => Math.round(t.getBoundingClientRect().height)));
  ok(`${tag} abas com altura ≥ 44 px`, hs.every(x => x >= 44), hs.join(','));
  const last = page.locator('#thumbs .thumb').last(); const lastName = await last.getAttribute('data-name');
  await last.click(); await page.waitForTimeout(500);
  ok(`${tag} tocar na aba leva à matéria e marca a posição`, await last.getAttribute('aria-current') === 'location' && (await page.locator('#rh-title').textContent()).includes(lastName), lastName);
  if (w < 1000) {
    ok(`${tag} escolher matéria fecha explorador`, !(await page.locator('#dlg-toc').evaluate(dialog => dialog.open)));
    await page.click('.tabbar [data-action="toc"]');
  }
  const tb = await page.locator('#thumbs .thumb').first().boundingBox();
  await page.mouse.move(tb.x + tb.width / 2, tb.y + 6); await page.mouse.down(); await page.mouse.move(tb.x + tb.width / 2, tb.y + tb.height * .6, { steps: 6 }); await page.waitForTimeout(150);
  ok(`${tag} folhear pela borda mostra o balão`, await page.locator('#bubble').isVisible(), await page.locator('#bubble').innerText().catch(() => ''));
  await shot(page, `folhear@${tag}`); await page.mouse.up(); await page.waitForTimeout(100);
  ok(`${tag} balão some ao soltar`, !(await page.locator('#bubble').isVisible()));
  await hash(page, 'todos');
  // detalhes: foco, Escape, retorno
  const trig = page.locator('#lib-results .entry-title button').first();
  await trig.focus(); await page.keyboard.press('Enter'); await page.waitForTimeout(400);
  ok(`${tag} detalhe abre e contém o foco`, await page.evaluate(() => !!document.querySelector('#dlg-detail[open]') && document.querySelector('#dlg-detail').contains(document.activeElement)));
  ok(`${tag} detalhe sem "null"`, !/null|undefined/.test(await page.locator('#dlg-detail').innerText()));
  const detailViolations = (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations;
  ok(`${tag} detalhe sem violações de acessibilidade`, detailViolations.length === 0, detailViolations.map(v => v.id).join(', '));
  await shot(page, `detalhe@${tag}`);
  const fav0 = await page.getAttribute('#d-fav', 'aria-pressed'); await page.click('#d-fav'); await page.waitForTimeout(250);
  ok(`${tag} favorito alterna`, (await page.getAttribute('#d-fav', 'aria-pressed')) !== fav0);
  await page.click(`#dlg-detail .statusset label:has(input[value="revisado"])`); await page.waitForTimeout(250);
  ok(`${tag} situação muda`, await page.locator('#dlg-detail .statusset input[value="revisado"]').isChecked());
  await page.keyboard.press('Escape'); await page.waitForTimeout(300);
  ok(`${tag} Escape fecha e devolve o foco`, await page.evaluate(() => !document.querySelector('#dlg-detail[open]')) && await trig.evaluate(el => el === document.activeElement));
  // remover + desfazer
  const before = await page.locator('#lib-results .entry').count();
  await trig.click({ position: { x: 5, y: 5 } }).catch(() => {}); await page.waitForTimeout(300);
  if (!(await page.evaluate(() => !!document.querySelector('#dlg-detail[open]')))) await page.locator('#lib-results .entry-title button').first().click();
  await page.waitForTimeout(300);
  await page.click('#d-foot .btn.ghost'); await page.waitForTimeout(200);
  ok(`${tag} aviso de remoção cita o arquivo original`, /arquivo original/.test(await page.locator('#dlg-detail .confirm-inline').innerText()));
  await page.click('#d-rm-yes'); await page.waitForTimeout(400);
  ok(`${tag} remover tira do catálogo`, await page.locator('#lib-results .entry').count() === before - 1);
  await page.click('.toast button'); await page.waitForTimeout(400);
  ok(`${tag} Desfazer restaura`, await page.locator('#lib-results .entry').count() === before);
  // alvos de toque
  const small = await page.evaluate(() => [...document.querySelectorAll('button,a[href],summary,select,input:not([type=hidden]):not([type=radio]):not([type=checkbox]),.af')].filter(e => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width && r.height && cs.visibility !== 'hidden' && !e.closest('[hidden],dialog:not([open])') && !e.closest('.sr') && !e.classList.contains('sr') && !e.matches('.entry-title button,.feature-title button') && (r.height < 43.5 || r.width < 43.5) && !(e.classList.contains('af')); }).map(e => `${e.tagName}.${e.className || e.id}:${Math.round(e.getBoundingClientRect().width)}x${Math.round(e.getBoundingClientRect().height)}`));
  ok(`${tag} controles ≥ 44 px`, small.length === 0, small.slice(0, 6).join(' | '));
  ok(`${tag} sem erros de console`, errors.length === 0, errors.slice(0, 2).join(' | '));
  await ctx.close();
}

// sem histórico, carregando, organizar, formulário
for (const scheme of ['light', 'dark']) {
  let { ctx, page } = await open(scheme, 375, 'none');
  ok(`375-${scheme} sem histórico: não mostra "Aberto por último"`, await page.locator('#h-feature').count() === 0);
  ok(`375-${scheme} sem histórico: mostra materiais em estudo/recentes`, (await page.locator('#home-focus .entry').count()) > 0);
  await shot(page, `inicio-sem-historico@375-${scheme}`);
  await page.click('.tabbar [data-action="toc"]'); await page.waitForTimeout(400);
  ok(`375-${scheme} sumário abre em folha`, await page.locator('#dlg-toc[open] .t-mat').count() > 0);
  await shot(page, `sumario@375-${scheme}`); await page.keyboard.press('Escape'); await page.waitForTimeout(200);
  await hash(page, 'organizar'); await shot(page, `organizar@375-${scheme}`);
  await page.click('.tabbar [data-action="add"]'); await page.waitForTimeout(400); await shot(page, `formulario@375-${scheme}`);
  await ctx.close();
  ({ ctx, page } = await open(scheme, 375, 'load'));
  ok(`375-${scheme} carregando mostra esqueleto`, await page.locator('.skel').count() >= 1);
  await shot(page, `carregando@375-${scheme}`); await ctx.close();
  ({ ctx, page } = await open(scheme, 1440, 'none')); await shot(page, `inicio-sem-historico@1440-${scheme}`);
  await hash(page, 'a-cis1'); await page.waitForTimeout(200);
  ok(`1440-${scheme} rota de unidade abre o capítulo no topo`, Math.abs(await page.evaluate(() => document.querySelector('#c-cis1').getBoundingClientRect().top - document.querySelector('.rh').offsetHeight)) < 4);
  await shot(page, `unidade@1440-${scheme}`); await ctx.close();
}
// Tema: controles nativos, persistência e primeira pintura em oposição ao sistema.
for (const w of [375, 1440]) {
  const { ctx, page } = await open('light', w);
  await page.click('#theme-open');
  await page.locator('input[name="theme"][value="dark"]').check();
  ok(`${w} tema: escolha escura e meta acompanham`, await page.evaluate(() =>
    document.documentElement.dataset.theme === 'dark' && document.querySelector('meta[name="theme-color"]').content === getComputedStyle(document.documentElement).getPropertyValue('--page').trim()));
  ok(`${w} tema: armazenamento salvo`, await page.evaluate(() => localStorage.getItem('bm-theme') === 'dark'));
  ok(`${w} tema: acessibilidade`, !(await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations.length);
  const sizes = await page.locator('.theme-options label').evaluateAll(labels => labels.map(x=>x.getBoundingClientRect().height));
  ok(`${w} tema: alvos de 44 px`, sizes.every(n=>n>=44));
  await shot(page, `tema@${w}-dark`);
  await page.keyboard.press('ArrowUp');
  ok(`${w} tema: teclado seleciona Claro`, await page.evaluate(() => document.documentElement.dataset.theme === 'light'));
  await page.keyboard.press('ArrowUp');
  ok(`${w} tema: teclado seleciona Sistema`, await page.evaluate(() => !document.documentElement.hasAttribute('data-theme')));
  await page.emulateMedia({ colorScheme:'dark' });
  ok(`${w} tema: Sistema reage ao dispositivo`, await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme === 'dark'));
  await page.keyboard.press('Escape');
  ok(`${w} tema: Escape devolve foco`, await page.locator('#theme-open').evaluate(x=>x===document.activeElement));
  await ctx.close();
}

for (const preference of ['dark','light']) {
  const ctx = await browser.newContext({ viewport:{width:375,height:812}, colorScheme:preference==='dark'?'light':'dark' });
  await ctx.route(/supabase\.co/, route=>route.abort());
  // Registra todos os frames com conteúdo e os eventos de pintura, também após reload.
  await ctx.addInitScript(value => {
    localStorage.setItem('bm-theme',value);
    window.themeFrames=[]; window.themePaints=[];
    const snapshot=()=>({theme:document.documentElement.dataset.theme,scheme:getComputedStyle(document.documentElement).colorScheme});
    new PerformanceObserver(list=>{for(const entry of list.getEntries()) window.themePaints.push({name:entry.name,...snapshot()});}).observe({type:'paint',buffered:true});
    const sample=()=>{if(document.querySelector('.spread')) window.themeFrames.push(snapshot());if(window.themeFrames.length<30) requestAnimationFrame(sample);};
    requestAnimationFrame(sample);
  }, preference);
  const page=await ctx.newPage();
  const cdp=await ctx.newCDPSession(page); await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
  await page.goto(srv.main.url); await page.waitForTimeout(900);
  for (const stage of ['entrada','reload']) {
    if(stage==='reload'){await page.reload();await page.waitForTimeout(900);}
    const evidence=await page.evaluate(()=>({frames:window.themeFrames,paints:window.themePaints}));
    ok(`tema ${preference} ${stage}: sem frame do tema oposto`, evidence.frames.length>0 && evidence.paints.some(p=>p.name==='first-contentful-paint') && [...evidence.frames,...evidence.paints].every(f=>f.theme===preference && f.scheme===preference));
    fs.writeFileSync(path.join(out,`primeira-pintura-${preference}-${stage}.json`),JSON.stringify(evidence,null,2));
  }
  await ctx.close();
}

// Persistência real: nenhum init script regrava o valor durante reload.
{
  const {ctx,page}=await open('light',375);
  await page.click('#theme-open');await page.locator('input[value="dark"][name="theme"]').check();
  await page.reload();await page.waitForTimeout(500);
  ok('tema: recarregar mantém escolha',await page.evaluate(()=>document.documentElement.dataset.theme==='dark'));
  await ctx.close();
}
for(const block of ['get','set']){
  const ctx=await browser.newContext({viewport:{width:375,height:812},colorScheme:'dark'});
  await ctx.route(/supabase\.co/,route=>route.abort());
  await ctx.addInitScript(mode=>{
    Storage.prototype[mode==='get'?'getItem':'setItem']=()=>{throw new DOMException('Bloqueado para teste','SecurityError');};
  },block);
  const page=await ctx.newPage();await page.goto(srv.main.url);await page.waitForTimeout(500);
  if(block==='set'){await page.click('#theme-open');await page.locator('label').filter({hasText:'Claro'}).click(); await page.waitForTimeout(40);}
  ok(`tema: falha em ${block} cai para Sistema`,await page.evaluate(()=>!document.documentElement.hasAttribute('data-theme') && document.documentElement.dataset.themePreference==='system' && getComputedStyle(document.documentElement).colorScheme==='dark'));
  await ctx.close();
}
// Movimento reduzido: pressione, não apenas clique. Cor/borda devem responder sem deslocamento.
{
  const {ctx,page}=await open('light',375);
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.click('.tabbar [data-action="toc"]');
  const thumb=page.locator('#thumbs .thumb').last();await thumb.hover();await page.mouse.down();
  ok('redução: índice pressionado sem deslocamento',await thumb.evaluate(x=>getComputedStyle(x).transform==='none'));
  await page.mouse.up();await page.keyboard.press('Escape');
  await hash(page,'todos');await page.locator('#lib-results .entry-title button').first().click();
  const edit=page.locator('#dlg-detail .d-secondary .btn').first();
  const before=await edit.evaluate(x=>getComputedStyle(x).boxShadow);
  await edit.hover();await page.mouse.down();
  ok('redução: Editar responde por borda sem escala',await edit.evaluate((x,old)=>getComputedStyle(x).transform==='none' && getComputedStyle(x).boxShadow!==old,before));
  await page.mouse.move(1,1);await page.mouse.up();await ctx.close();
}
// Recém-chegado e módulos "Em produção": M1 a M8 criados, só M1 e M2 com material.
for (const scheme of ['light', 'dark']) {
  for (const w of [375, 1440]) {
    const tag = `${w}-${scheme} em produção`;
    let { ctx, page, errors } = await open(scheme, w, 'prod');
    ok(`${tag}: início mostra "Por onde começar" sem histórico`, await page.locator('#h-start').count() === 1 && await page.locator('#h-feature').count() === 0);
    ok(`${tag}: capas por tipo (4) e lombadas de módulo (8)`, await page.locator('.type-shelf .type-door').count() === 4 && await page.locator('.spines .spine').count() === 8);
    ok(`${tag}: tipos sem material dizem "Em produção"`, await page.locator('.type-door.is-empty').count() === 2, String(await page.locator('.type-door.is-empty').count()));
    ok(`${tag}: lombadas na ordem do curso, M3 a M8 em produção`, await page.locator('.spines .spine.is-empty').count() === 6 && await page.evaluate(() => [...document.querySelectorAll('.spines .spine')].map(a => a.getAttribute('href')).join() === '#a-m1,#a-m2,#a-m3,#a-m4,#a-m5,#a-m6,#a-m7,#a-m8'));
    ok(`${tag}: capas e lombadas com alvo ≥ 44 px`, (await page.locator('.start .type-door, .start .spine').evaluateAll(els => els.map(e => { const r = e.getBoundingClientRect(); return Math.min(r.width, r.height); }))).every(n => n >= 44));
    ok(`${tag}: texto da lombada não invade o nome do módulo`, await page.evaluate(() => [...document.querySelectorAll('.spines .spine')].every(s => s.querySelector('.spine-n').getBoundingClientRect().top >= s.querySelector('.spine-name').getBoundingClientRect().bottom - 1)));
    ok(`${tag}: início sem acessibilidade quebrada`, !(await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations.length);
    await noOverflow(page, tag + ' início'); await shot(page, `em-producao-inicio@${tag.replace(' em produção', '')}`);
    await page.locator('.spines .spine[href="#a-m3"]').click(); await page.waitForTimeout(450);
    ok(`${tag}: tocar em módulo em produção mostra aviso claro`, await page.locator('#p-m3.is-production').isVisible() && /em produção/i.test(await page.locator('#p-m3 + .part-note').innerText()));
    ok(`${tag}: cabeça corrente acompanha o módulo em produção`, /M3.*Em produção/.test(await page.locator('#rh-title').innerText()), await page.locator('#rh-title').innerText());
    ok(`${tag}: aviso oferece voltar ao que tem conteúdo`, await page.locator('#p-m3 + .part-note a').getAttribute('href') === '#a-m1');
    await shot(page, `em-producao-modulo@${tag.replace(' em produção', '')}`);
    await hash(page, 'a-m8'); await page.waitForTimeout(250);
    ok(`${tag}: último módulo em produção (fim do livro) também nomeia a cabeça corrente`, /M8.*Em produção/.test(await page.locator('#rh-title').innerText()), await page.locator('#rh-title').innerText());
    await hash(page, 'todos');
    ok(`${tag}: seis módulos marcados, M1 e M2 sem marca`, await page.locator('#lib-results .part.is-production').count() === 6 && await page.locator('#p-m1.is-production, #p-m2.is-production').count() === 0);
    ok(`${tag}: módulos com conteúdo vêm primeiro no livro`, await page.evaluate(() => { const o = id => document.getElementById(id).compareDocumentPosition(document.getElementById('p-m3')) & Node.DOCUMENT_POSITION_FOLLOWING; return !!o('p-m1') && !!o('p-m2'); }));
    await noOverflow(page, tag + ' livro');
    if (w === 375) { await page.click('.tabbar [data-action="toc"]'); await page.waitForTimeout(400); } else await page.waitForTimeout(100);
    const flags = await page.locator((w === 375 ? '#dlg-toc ' : '#toc-tree ') + '.t-mod .t-flag').count();
    ok(`${tag}: Explorar marca os seis módulos em produção`, flags === 6, String(flags));
    if (w === 375) { await shot(page, `em-producao-explorar@${tag.replace(' em produção', '')}`); await page.keyboard.press('Escape'); await page.waitForTimeout(200); }
    ok(`${tag}: sem erros de console`, errors.length === 0, errors.slice(0, 2).join(' | '));
    await ctx.close();
  }
}
{
  const { ctx, page } = await open('light', 375, 'prodLive');
  ok('em produção: módulo some da lista ao receber o primeiro material', await page.locator('.spines .spine.is-empty[href="#a-m3"]').count() === 0 && await page.locator('.spines .spine.is-empty').count() === 5 && await page.locator('.spines .spine').count() === 8);
  await hash(page, 'todos');
  ok('em produção: marca do M3 some, os outros cinco continuam', await page.locator('#p-m3.is-production').count() === 0 && await page.locator('#lib-results .part.is-production').count() === 5);
  await ctx.close();
}
// Estante visual: capas em todos os materiais, grade/lista com escolha lembrada neste aparelho.
for (const scheme of ['light', 'dark']) {
  const { ctx, page, errors } = await open(scheme, 375);
  await hash(page, 'todos');
  const entries = await page.locator('#lib-results .entry').count();
  ok(`375-${scheme} estante: padrão em grade, uma capa por material`, await page.locator('#lib-results[data-layout="shelf"]').count() === 1 && await page.locator('#lib-results .entry > .cover').count() === entries && entries >= 5);
  ok(`375-${scheme} estante: capas ocultas para leitor de tela e com tipo visível`, await page.locator('#lib-results .entry > .cover[aria-hidden="true"] .cover-type').count() === entries);
  const colX = await page.locator('#lib-results .sub-entries').first().evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length);
  ok(`375-${scheme} estante: o tipo continua no texto para leitor de tela`, await page.evaluate(() => [...document.querySelectorAll('#lib-results .entry .e-line > span:first-child')].every(s => s.textContent.trim().length > 0 && getComputedStyle(s).display !== 'none' && getComputedStyle(s).visibility !== 'hidden')));
  ok(`375-${scheme} estante: duas colunas no celular`, colX === 2, String(colX));
  await noOverflow(page, `375-${scheme} estante`);
  await shot(page, `estante@375-${scheme}`);
  const btn = page.locator('#layout-toggle');
  ok(`375-${scheme} estante: botão com alvo de 44 px e estado`, (await btn.evaluate(e => { const r = e.getBoundingClientRect(); return Math.min(r.width, r.height); })) >= 44 && await btn.getAttribute('aria-pressed') === 'true');
  await btn.click(); await page.waitForTimeout(250);
  ok(`375-${scheme} lista: botão troca para lista e guarda a escolha`, await page.locator('#lib-results[data-layout="list"]').count() === 1 && await btn.getAttribute('aria-pressed') === 'false' && await page.evaluate(() => localStorage.getItem('bm-layout') === 'list'));
  ok(`375-${scheme} lista: capa ao lado do título`, await page.evaluate(() => { const e = document.querySelector('#lib-results .entry'); const c = e.querySelector('.cover').getBoundingClientRect(), t = e.querySelector('.entry-title').getBoundingClientRect(); return c.right <= t.left + 1 && Math.abs(c.top - t.top) < 24; }));
  await noOverflow(page, `375-${scheme} lista`); await shot(page, `lista@375-${scheme}`);
  await page.reload(); await page.waitForTimeout(600); await hash(page, 'todos');
  ok(`375-${scheme} lista: recarregar mantém a escolha`, await page.locator('#lib-results[data-layout="list"]').count() === 1);
  await btn.click(); await page.waitForTimeout(200);
  ok(`375-${scheme} estante: voltar para grade`, await page.locator('#lib-results[data-layout="shelf"]').count() === 1);
  ok(`375-${scheme} estante: sem erros de console`, errors.length === 0, errors.slice(0, 2).join(' | '));
  await ctx.close();
}
{
  // retomada com capa, trilho horizontal de capas na seleção e capa na ficha
  const { ctx, page } = await open('light', 375);
  ok('retomada: o botão Lista/Estante só aparece no catálogo', await page.locator('#layout-toggle').isHidden());
  ok('seleção: área e assunto continuam no texto dos itens do trilho', await page.evaluate(() => [...document.querySelectorAll('#home-focus .rail .entry .e-where')].every(e => e.textContent.trim().length > 0 && getComputedStyle(e).display !== 'none')));
  ok('retomada: capa do material ao lado do título', await page.evaluate(() => { const f = document.querySelector('.feature'); const c = f.querySelector('.cover').getBoundingClientRect(), t = f.querySelector('.entry-title').getBoundingClientRect(); return c.right <= t.left + 1; }));
  ok('seleção: trilho de capas sem rolagem lateral na página', await page.locator('#home-focus .rail .entry > .cover').count() >= 1 && (await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 1);
  await hash(page, 'todos'); await page.locator('#lib-results .entry-title button').first().click(); await page.waitForTimeout(400);
  ok('ficha: capa do material no topo', await page.locator('#d-reading .cover').count() === 1);
  if (await page.getAttribute('#d-fav', 'aria-pressed') === 'true') { await page.locator('#d-fav').click(); await page.waitForTimeout(1000); }
  ok('favorito: ficha começa sem estrela e sem salto', await page.getAttribute('#d-fav', 'aria-pressed') === 'false' && await page.locator('#d-fav.pop').count() === 0);
  await page.locator('#d-fav').click(); await page.waitForTimeout(150);
  ok('favorito: a estrela da ficha salta ao marcar', await page.getAttribute('#d-fav', 'aria-pressed') === 'true' && await page.locator('#d-fav.pop').count() === 1);
  await ctx.close();
}
// Leitura e edição separadas na interface: toda ação de edição leva [data-edit]; nada é escondido nesta rodada.
{
  const { ctx, page } = await open('light', 1440);
  ok('edição: Adicionar link e Organizar marcados e visíveis (computador)', await page.locator('.acts [data-edit]').count() === 2 && await page.locator('.acts [data-edit]').first().isVisible());
  ok('edição: barra do celular também marcada', await page.locator('.tabbar [data-edit]').count() === 2);
  ok('edição: Adicionar link deixou de ser o botão primário', await page.locator('.acts [data-edit].primary').count() === 0);
  await hash(page, 'todos'); await page.locator('#lib-results .entry-title button').first().click(); await page.waitForTimeout(400);
  ok('edição: Editar e Remover da ficha marcados', await page.locator('#dlg-detail [data-edit]').count() === 2);
  ok('edição: tipo "Monitoria" disponível no formulário e no filtro', await page.locator('#f-type option[value="Monitoria"]').count() === 1);
  await ctx.close();
}
await browser.close(); Object.values(srv).forEach(x => x.s.close());
console.log(log.join('\n') + `\n\n${log.length - fails} de ${log.length} verificações aprovadas, ${fails} falha(s). Capturas em tools/reports/flows/`);
process.exit(fails ? 1 : 0);
