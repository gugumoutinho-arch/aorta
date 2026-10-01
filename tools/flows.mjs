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
const loading = base.replace('<head>', '<head><script>window.claude={use:()=>new Promise(()=>{})}</script>');

const browser = await chromium.launch({ executablePath: chromePath(), headless: true });
const srv = { main: await serve(withDb(seed())), none: await serve(withDb(noHistory)), load: await serve(loading) };

async function open(scheme, w, which = 'main') {
  const ctx = await browser.newContext({ viewport: { width: w, height: w < 500 ? 812 : 900 }, colorScheme: scheme, reducedMotion: 'no-preference' });
  const page = await ctx.newPage(); const errors = [];
  page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error' && !/fonts\.g|net::ERR/.test(m.text())) errors.push(m.text()); });
  await page.goto(srv[which].url); await page.waitForTimeout(700);
  return { ctx, page, errors };
}
const shot = (page, name) => page.screenshot({ path: path.join(out, name + '.png') });
const hash = async (page, h) => { await page.evaluate(x => { location.hash = x; }, h); await page.waitForTimeout(350); };
const noOverflow = async (page, label) => ok(label + ': sem rolagem lateral', (await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 1);

for (const w of [375, 1440]) for (const scheme of ['light', 'dark']) {
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
await browser.close(); Object.values(srv).forEach(x => x.s.close());
console.log(log.join('\n') + `\n\n${log.length - fails} de ${log.length} verificações aprovadas, ${fails} falha(s). Capturas em tools/reports/flows/`);
process.exit(fails ? 1 : 0);
