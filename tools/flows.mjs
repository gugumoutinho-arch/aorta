// Fluxos principais do Aorta e capturas de revisão visual (dados fictícios de seed.json; não toca no Supabase).
// Uso:  cd tools && node flows.mjs      Saída: capturas em reports/flows/ e um resumo no console.
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';
import AxeBuilder from '@axe-core/playwright';
import { reports, chromePath, startServer, withDb, seed, LOADING, FAILING, WEBGL_ARGS } from './harness.mjs';

const out = path.join(reports, 'flows'); fs.mkdirSync(out, { recursive: true });
const log = []; let fails = 0;
const ok = (name, cond, extra = '') => { log.push(`${cond ? 'OK  ' : 'FALHA'} ${name}${extra ? ' — ' + extra : ''}`); if (!cond) fails++; };

const noHistory = (() => { const d = seed(); d.materials.forEach(m => { delete m.lastOpenedAt; }); return d; })();
// M1 a M8 criados; só M1 e M2 têm material (os demais devem aparecer como "Em produção"). Dados só na memória do teste.
const eightModules = (d, withNewMaterial = false) => {
  const x = JSON.parse(JSON.stringify(d));
  for (let i = 3; i <= 8; i++) x.areas.push({ id: 'm' + i, name: 'M' + i, parentId: '', order: i, stain: '', short: null });
  if (withNewMaterial) x.materials.push({ ...x.materials[0], id: 'novo-m3', title: 'Primeiro material do M3 (teste)', areaId: 'm3' });
  return x;
};
const srv = {
  main: await startServer(), none: await startServer({ inject: withDb(noHistory) }),
  load: await startServer({ inject: LOADING }), fail: await startServer({ inject: FAILING }),
  prod: await startServer({ inject: withDb(eightModules(noHistory)) }), prodLive: await startServer({ inject: withDb(eightModules(noHistory, true)) }),
  noModel: await startServer({ block: /^\/modelos\// }),
};
const flat = await chromium.launch({ executablePath: chromePath(), headless: true, args: ['--disable-gpu', '--disable-webgl', '--disable-webgl2'] });
const gl = await chromium.launch({ executablePath: chromePath(), headless: true, args: WEBGL_ARGS });

async function open(scheme, w, which = 'main', { browser = flat, motion = 'no-preference', init } = {}) {
  const ctx = await browser.newContext({ viewport: { width: w, height: w < 500 ? 812 : 900 }, colorScheme: scheme, reducedMotion: motion });
  await ctx.route(/supabase\.co/, route => route.abort());
  if (init) await ctx.addInitScript(init.fn, init.arg);
  const page = await ctx.newPage(); const errors = [];
  page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error' && !/fonts\.g|net::ERR|404/.test(m.text())) errors.push(m.text()); });
  await page.goto(srv[which].url); await page.waitForTimeout(800);
  return { ctx, page, errors };
}
const shot = (page, name) => page.screenshot({ path: path.join(out, name + '.png') });
const hash = async (page, h, wait = 500) => { await page.evaluate(x => { location.hash = x; }, h); await page.waitForTimeout(wait); };
const noOverflow = async (page, label) => ok(label + ': sem rolagem lateral', (await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 1);
const axeClean = async page => (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations;
const dialogOpen = (page, id) => page.evaluate(x => !!document.querySelector(`#${x}[open]`), id);
const focusedIn = (page, sel) => page.evaluate(s => !!document.querySelector(s)?.contains(document.activeElement), sel);
const smallTargets = page => page.evaluate(() => [...document.querySelectorAll('button,a[href],summary,select,input:not([type=hidden]):not([type=radio]):not([type=checkbox])')].filter(e => {
  // Tamanho de layout (offset*): a mola de "afundar" muda só o desenho por um instante, não o alvo de toque.
  const r = e.getBoundingClientRect(), cs = getComputedStyle(e), w = e.offsetWidth || r.width, hh = e.offsetHeight || r.height;
  return r.width && r.height && cs.visibility !== 'hidden' && !e.closest('[hidden],dialog:not([open]),.sr,footer') && !e.matches('.material-title button,.mini-card h3 button,.resume-title') && (hh < 43.5 || w < 43.5);
}).map(e => `${e.tagName}.${e.className || e.id}:${e.offsetWidth}x${e.offsetHeight}`));

/* ---------- caminho principal, em 3 larguras e 2 temas ---------- */
for (const w of [320, 375, 1440]) for (const scheme of ['light', 'dark']) {
  const tag = `${w}-${scheme}`;
  const { ctx, page, errors } = await open(scheme, w);
  // início
  ok(`${tag} início: retomada com o último material aberto`, await page.locator('#resume:not([hidden]) [data-mid]').count() === 1);
  ok(`${tag} início: números reais do acervo`, /7\s+materiais/.test(await page.locator('#counts').innerText()) && /2 de 2/.test(await page.locator('#counts').innerText()));
  ok(`${tag} início: um rótulo por módulo no mapa`, await page.locator('#modules .mod').count() === 2);
  ok(`${tag} início: mapa em linhas sem WebGL, com aviso`, await page.locator('#map canvas').count() === 0 && /Mapa em linhas/.test(await page.locator('#model-state').innerText()));
  ok(`${tag} início: índice dos módulos`, await page.locator('#course-index .index-row').count() === 2 && !/null|undefined/.test(await page.locator('#course-index').innerText()));
  ok(`${tag} início: linhas-guia ligam rótulo e artéria`, await page.locator('#guides path[d^="M"]').count() === 2);
  await noOverflow(page, `${tag} início`); await shot(page, `inicio@${tag}`);
  // teclado no mapa: setas andam entre as artérias
  await page.locator('#modules .mod').first().focus(); await page.keyboard.press('ArrowRight');
  ok(`${tag} mapa: seta move o foco para o próximo módulo`, await page.evaluate(() => document.activeElement === document.querySelectorAll('#modules .mod')[1]));
  // abrir o módulo pelo rótulo
  await page.locator('#modules .mod[data-module="m1"]').click(); await page.waitForTimeout(900);
  ok(`${tag} módulo: abre pelo rótulo com o foco no título`, await page.locator('#view-module').isVisible() && await page.evaluate(() => document.activeElement?.id === 'module-title') && (await page.locator('#module-title').innerText()) === 'M1');
  ok(`${tag} módulo: artéria e resumo reais no cabeçalho`, /DESCENDENTE ANTERIOR/i.test(await page.locator('#artery-name').innerText()) && /4 materiais/.test(await page.locator('#module-summary').innerText()));
  ok(`${tag} módulo: unidades em abas, BBIO 1 em produção`, await page.locator('#units [data-unit]').count() === 3 && /Em produção/.test(await page.locator('#units [data-unit="bbio1"]').innerText()));
  ok(`${tag} módulo: quatro folhas`, await page.locator('#materials .material').count() === 4);
  const clipped = await page.evaluate(() => [...document.querySelectorAll('.material-title button')].filter(b => b.scrollWidth > b.clientWidth + 1).length);
  ok(`${tag} módulo: títulos longos sem corte`, clipped === 0);
  ok(`${tag} módulo: nenhuma animação presa no voo`, await page.locator('.flight').count() === 0);
  await noOverflow(page, `${tag} módulo`); await shot(page, `modulo@${tag}`);
  await page.locator('#units [data-unit="bbio1"]').click(); await page.waitForTimeout(250);
  ok(`${tag} unidade sem material: "Em produção" e não lista vazia`, /Em produção/.test(await page.locator('#materials .empty').innerText()));
  ok(`${tag} unidade: endereço guarda a escolha`, await page.evaluate(() => location.hash === '#a-bbio1'));
  await page.locator('#units [data-unit=""]').click(); await page.waitForTimeout(200);
  await page.locator('#subjects [data-subject="cis1-anat"]').click(); await page.waitForTimeout(200);
  ok(`${tag} matéria: filtra as folhas`, await page.locator('#materials .material').count() === 2);
  await page.locator('#subjects [data-subject=""]').click(); await page.waitForTimeout(200);
  // filtros (no celular, tipo/situação/coleção/ordem ficam recolhidos em "Filtros")
  if (w < 641) {
    ok(`${tag} filtros: recolhidos no celular, folhas logo abaixo da busca`, await page.locator('#f-status').isHidden() && await page.getAttribute('#f-more', 'aria-expanded') === 'false');
    await page.click('#f-more'); await page.waitForTimeout(100);
    ok(`${tag} filtros: "Filtros" abre e informa expansão`, await page.locator('#f-status').isVisible() && await page.getAttribute('#f-more', 'aria-expanded') === 'true');
  }
  await page.selectOption('#f-status', 'em-estudo'); await page.waitForTimeout(150);
  await page.click('#f-fav'); await page.waitForTimeout(150);
  ok(`${tag} filtros: chips dos filtros ativos`, await page.locator('#active-filters .af:not(.clear)').count() === 2);
  const smallF = await smallTargets(page); ok(`${tag} filtros: chips e controles ≥ 44 px`, smallF.length === 0, smallF.slice(0, 6).join(' | '));
  await shot(page, `filtros@${tag}`); await noOverflow(page, `${tag} filtros`);
  await page.locator('#active-filters .af').first().click(); await page.waitForTimeout(150);
  ok(`${tag} filtros: remover chip`, await page.locator('#active-filters .af:not(.clear)').count() === 1);
  await page.locator('#active-filters .af').first().click(); await page.waitForTimeout(150);
  await page.fill('#lib-q', 'zzzxyz'); await page.waitForTimeout(350);
  ok(`${tag} busca da página: estado vazio explica o que a busca procura`, /não no texto dos arquivos/.test(await page.locator('#materials .empty').innerText()));
  await page.locator('#materials .empty button').click(); await page.waitForTimeout(200);
  ok(`${tag} busca da página: limpar volta às folhas`, await page.locator('#materials .material').count() === 4);
  // ficha: foco, conteúdo, favorito, situação, Escape e retorno
  const trig = page.locator('#materials [data-mid]').first();
  await trig.focus(); await page.keyboard.press('Enter'); await page.waitForTimeout(500);
  ok(`${tag} ficha: abre e contém o foco`, await dialogOpen(page, 'dlg-detail') && await focusedIn(page, '#dlg-detail'));
  ok(`${tag} ficha: sem "null"/"undefined"`, !/null|undefined/.test(await page.locator('#dlg-detail').innerText()));
  ok(`${tag} ficha: diz que o site guarda o link`, /guarda o link/.test(await page.locator('#dlg-detail').innerText()));
  const dv = await axeClean(page); ok(`${tag} ficha: acessibilidade`, dv.length === 0, dv.map(v => v.id).join(', '));
  await shot(page, `ficha@${tag}`);
  const fav0 = await page.getAttribute('#d-fav', 'aria-pressed'); await page.click('#d-fav'); await page.waitForTimeout(300);
  ok(`${tag} ficha: favorito alterna`, (await page.getAttribute('#d-fav', 'aria-pressed')) !== fav0);
  await page.click('#d-body .segments label:has(input[value="revisado"])'); await page.waitForTimeout(300);
  ok(`${tag} ficha: situação muda`, await page.locator('#d-body input[value="revisado"]').isChecked());
  await page.keyboard.press('Escape'); await page.waitForTimeout(400);
  ok(`${tag} ficha: Escape fecha e devolve o foco à folha`, !(await dialogOpen(page, 'dlg-detail')) && await page.evaluate(() => document.activeElement?.matches('#materials [data-mid]')));
  // remover + desfazer
  const before = await page.locator('#materials .material').count();
  await page.locator('#materials [data-mid]').first().click(); await page.waitForTimeout(500);
  await page.click('#d-remove'); await page.waitForTimeout(200);
  ok(`${tag} remover: aviso cita o arquivo original`, /arquivo original/.test(await page.locator('#dlg-detail .confirm-inline').innerText()));
  await page.click('#d-rm-yes'); await page.waitForTimeout(600);
  ok(`${tag} remover: sai do catálogo`, await page.locator('#materials .material').count() === before - 1);
  await page.locator('.toast button').click(); await page.waitForTimeout(500);
  ok(`${tag} remover: Desfazer restaura`, await page.locator('#materials .material').count() === before);
  // alvos de toque
  const small = await smallTargets(page); ok(`${tag} módulo: controles ≥ 44 px`, small.length === 0, small.slice(0, 6).join(' | '));
  // voltar ao coração: foco no rótulo de onde veio
  await page.click('#back-home'); await page.waitForTimeout(600);
  ok(`${tag} voltar: início com o foco no rótulo do módulo`, await page.locator('#view-home').isVisible() && await page.evaluate(() => document.activeElement?.dataset?.module === 'm1'));
  const smallHome = await smallTargets(page); ok(`${tag} início: controles ≥ 44 px`, smallHome.length === 0, smallHome.slice(0, 6).join(' | '));
  // busca rápida
  await page.keyboard.press('Control+k'); await page.waitForTimeout(400);
  ok(`${tag} busca rápida: Ctrl+K abre com o foco no campo`, await dialogOpen(page, 'palette') && await page.evaluate(() => document.activeElement?.id === 'pq'));
  await page.keyboard.type('placenta'); await page.waitForTimeout(250);
  ok(`${tag} busca rápida: acha o material por parte do título, sem acento`, await page.locator('#results [role=option]').count() >= 1 && /placenta/i.test(await page.locator('#results [aria-selected=true]').innerText()));
  await shot(page, `busca@${tag}`);
  await page.keyboard.press('Enter'); await page.waitForTimeout(500);
  ok(`${tag} busca rápida: Enter abre a ficha`, await dialogOpen(page, 'dlg-detail') && !(await dialogOpen(page, 'palette')));
  await page.keyboard.press('Escape'); await page.waitForTimeout(300);
  await page.keyboard.press('Control+k'); await page.waitForTimeout(300); await page.keyboard.type('zzqq'); await page.waitForTimeout(200);
  ok(`${tag} busca rápida: sem resultado sugere caminhos reais`, /Nenhum resultado/i.test(await page.locator('#results').innerText()) && await page.locator('#results [role=option]').count() === 2);
  await page.keyboard.press('Escape'); await page.waitForTimeout(250);
  ok(`${tag} sem erros de console`, errors.length === 0, errors.slice(0, 2).join(' | '));
  await ctx.close();
}

/* ---------- endereço malformado e foco ao favoritar pelo cartão ---------- */
{
  const ctx = await flat.newContext({ viewport: { width: 375, height: 812 } });
  const page = await ctx.newPage(); const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(srv.main.url + '#a-%E0%A4%A'); await page.waitForTimeout(900);
  ok('endereço malformado: abre o início e carrega o acervo', await page.locator('#view-home').isVisible() && /7\s+materiais/.test(await page.locator('#counts').innerText()) && errors.length === 0, errors.join(' | '));
  await page.evaluate(() => { location.hash = 'a-m1'; }); await page.waitForTimeout(500);
  const star = page.locator('#materials [data-fav]').first(); const id = await star.getAttribute('data-fav');
  await star.focus(); await page.keyboard.press('Enter'); await page.waitForTimeout(600);
  ok('favoritar pelo cartão (teclado): o foco continua na mesma estrela', await page.evaluate(x => document.activeElement?.dataset?.fav === x, id));
  await ctx.close();
}

/* ---------- estados: sem histórico, carregando, banco fora do ar ---------- */
for (const scheme of ['light', 'dark']) {
  let { ctx, page } = await open(scheme, 375, 'none');
  ok(`375-${scheme} sem histórico: sem "Continuar"`, await page.locator('#resume').isHidden());
  ok(`375-${scheme} sem histórico: mesa de estudo e recentes aparecem`, await page.locator('#reading .mini-card').count() > 0 && await page.locator('#recent .mini-card').count() === 3);
  await shot(page, `inicio-sem-historico@375-${scheme}`); await ctx.close();
  ({ ctx, page } = await open(scheme, 375, 'load'));
  ok(`375-${scheme} carregando: avisa no início`, /Carregando/.test(await page.locator('#counts').innerText()));
  await hash(page, 'a-m1');
  ok(`375-${scheme} carregando: esqueleto na página do módulo`, await page.locator('#materials .skel').count() === 1);
  await shot(page, `carregando@375-${scheme}`); await ctx.close();
  ({ ctx, page } = await open(scheme, 375, 'fail'));
  ok(`375-${scheme} banco fora do ar: aviso com "Tentar de novo"`, /não chegou/.test(await page.locator('#state-banner').innerText()) && await page.locator('#state-banner button').count() === 1);
  ok(`375-${scheme} banco fora do ar: sem mapa vazio`, await page.locator('#atlas').isHidden());
  await shot(page, `falha-banco@375-${scheme}`); await ctx.close();
}

/* ---------- oito módulos, seis em produção ---------- */
for (const scheme of ['light', 'dark']) for (const w of [375, 1440]) {
  const tag = `${w}-${scheme} em produção`;
  const { ctx, page, errors } = await open(scheme, w, 'prod');
  ok(`${tag}: oito rótulos, seis tracejados`, await page.locator('#modules .mod').count() === 8 && await page.locator('#modules .mod.off').count() === 6);
  ok(`${tag}: rótulos não se sobrepõem`, await page.evaluate(() => { const r = [...document.querySelectorAll('#modules .mod')].map(e => e.getBoundingClientRect()); return r.every((a, i) => r.every((b, j) => i === j || a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top)); }));
  ok(`${tag}: rótulos dentro do mapa`, await page.evaluate(() => { const m = document.querySelector('#map').getBoundingClientRect(); return [...document.querySelectorAll('#modules .mod')].every(e => { const r = e.getBoundingClientRect(); return r.left >= m.left - 1 && r.right <= m.right + 1 && r.top >= m.top - 1 && r.bottom <= m.bottom + 1; }); }));
  ok(`${tag}: índice separa os módulos em produção`, await page.locator('.production-index a').count() === 6);
  const v = await axeClean(page); ok(`${tag}: acessibilidade do início`, v.length === 0, v.map(x => x.id).join(', '));
  await noOverflow(page, tag); await shot(page, `em-producao-inicio@${tag.replace(' em produção', '')}`);
  await page.locator('#modules .mod[data-module="m3"]').click(); await page.waitForTimeout(800);
  ok(`${tag}: módulo em produção explica e leva ao que tem material`, /ainda não foi irrigado/.test(await page.locator('#materials').innerText()) && await page.locator('#materials .empty a[href="#a-m1"]').count() === 1);
  ok(`${tag}: cabeçalho diz "Em produção"`, /Em produção/.test(await page.locator('#module-summary').innerText()));
  await shot(page, `em-producao-modulo@${tag.replace(' em produção', '')}`);
  ok(`${tag}: sem erros de console`, errors.length === 0, errors.slice(0, 2).join(' | '));
  await ctx.close();
}
{
  const { ctx, page } = await open('light', 375, 'prodLive');
  ok('em produção: M3 deixa de ser tracejado ao receber o primeiro material', await page.locator('#modules .mod.off').count() === 5 && await page.locator('#modules .mod.off[data-module="m3"]').count() === 0);
  await ctx.close();
}

/* ---------- tema: controles nativos, persistência e primeira pintura ---------- */
for (const w of [375, 1440]) {
  const { ctx, page } = await open('light', w);
  await page.click('#theme-open'); await page.waitForTimeout(300);
  await page.locator('input[name="theme"][value="dark"]').check();
  ok(`${w} tema: escolha escura e meta acompanham`, await page.evaluate(() => document.documentElement.dataset.theme === 'dark' && document.querySelector('meta[name="theme-color"]').content === getComputedStyle(document.documentElement).getPropertyValue('--bg').trim()));
  ok(`${w} tema: preferência salva`, await page.evaluate(() => localStorage.getItem('bm-theme') === 'dark'));
  ok(`${w} tema: acessibilidade`, !(await axeClean(page)).length);
  ok(`${w} tema: alvos de 44 px`, (await page.locator('.theme-options label').evaluateAll(ls => ls.map(x => x.getBoundingClientRect().height))).every(n => n >= 44));
  await page.keyboard.press('ArrowUp');
  ok(`${w} tema: teclado seleciona Claro`, await page.evaluate(() => document.documentElement.dataset.theme === 'light'));
  await page.keyboard.press('ArrowUp');
  ok(`${w} tema: teclado seleciona Sistema`, await page.evaluate(() => !document.documentElement.hasAttribute('data-theme')));
  await page.emulateMedia({ colorScheme: 'dark' });
  ok(`${w} tema: Sistema reage ao aparelho`, await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme === 'dark'));
  await page.keyboard.press('Escape'); await page.waitForTimeout(250);
  ok(`${w} tema: Escape devolve o foco`, await page.locator('#theme-open').evaluate(x => x === document.activeElement));
  await ctx.close();
}
for (const preference of ['dark', 'light']) {
  const init = { arg: preference, fn: value => {
    localStorage.setItem('bm-theme', value); window.themeFrames = []; window.themePaints = [];
    const snapshot = () => ({ theme: document.documentElement.dataset.theme, scheme: getComputedStyle(document.documentElement).colorScheme });
    new PerformanceObserver(list => { for (const entry of list.getEntries()) window.themePaints.push({ name: entry.name, ...snapshot() }); }).observe({ type: 'paint', buffered: true });
    const sample = () => { if (document.querySelector('.top')) window.themeFrames.push(snapshot()); if (window.themeFrames.length < 30) requestAnimationFrame(sample); };
    requestAnimationFrame(sample);
  } };
  const { ctx, page } = await open(preference === 'dark' ? 'light' : 'dark', 375, 'main', { init });
  for (const stage of ['entrada', 'reload']) {
    if (stage === 'reload') { await page.reload(); await page.waitForTimeout(900); }
    const ev = await page.evaluate(() => ({ frames: window.themeFrames, paints: window.themePaints }));
    ok(`tema ${preference} ${stage}: nenhum quadro no tema oposto`, ev.frames.length > 0 && ev.paints.some(p => p.name === 'first-contentful-paint') && [...ev.frames, ...ev.paints].every(f => f.theme === preference && f.scheme === preference));
  }
  await ctx.close();
}
for (const block of ['get', 'set']) {
  const { ctx, page } = await open('dark', 375, 'main', { init: { arg: block, fn: mode => { Storage.prototype[mode === 'get' ? 'getItem' : 'setItem'] = () => { throw new DOMException('Bloqueado para teste', 'SecurityError'); }; } } });
  if (block === 'set') { await page.click('#theme-open'); await page.waitForTimeout(200); await page.locator('.theme-options label').filter({ hasText: 'Claro' }).click(); await page.waitForTimeout(60); }
  ok(`tema: armazenamento bloqueado (${block}) cai para Sistema`, await page.evaluate(() => !document.documentElement.hasAttribute('data-theme') && document.documentElement.dataset.themePreference === 'system' && getComputedStyle(document.documentElement).colorScheme === 'dark'));
  await ctx.close();
}

/* ---------- movimento reduzido ---------- */
{
  const { ctx, page, errors } = await open('dark', 375, 'main', { browser: gl, motion: 'reduce' });
  await page.waitForTimeout(1500);
  ok('reduzido: sem coração 3D, mapa em linhas com aviso', await page.locator('#map canvas').count() === 0 && /movimento reduzido/.test(await page.locator('#model-state').innerText()));
  ok('reduzido: botão de pausar escondido (nada bate)', await page.locator('#pause').isHidden());
  await page.locator('#modules .mod').first().click(); await page.waitForTimeout(100);
  ok('reduzido: módulo abre sem voo', await page.locator('.flight').count() === 0 && await page.locator('#view-module').isVisible());
  await page.locator('#materials [data-mid]').first().click(); await page.waitForTimeout(80);
  ok('reduzido: ficha aparece inteira, sem deslocamento', await page.evaluate(() => { const d = document.querySelector('#dlg-detail'); return d.open && getComputedStyle(d).opacity === '1' && (d.style.transform || 'none').match(/none|^$/) !== null; }));
  ok('reduzido: sem erros de console', errors.length === 0, errors.slice(0, 2).join(' | '));
  await ctx.close();
}

/* ---------- coração 3D (WebGL por software) ---------- */
for (const w of [375, 1440]) {
  const { ctx, page, errors } = await open('dark', w, 'main', { browser: gl });
  await page.waitForFunction(() => document.querySelector('#map')?.classList.contains('ready'), null, { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(1500);
  ok(`${w} 3D: o coração carrega por cima do mapa em linhas`, await page.locator('#map.ready canvas').count() === 1 && await page.locator('#loader').isHidden());
  ok(`${w} 3D: linhas-guia acompanham as artérias projetadas`, await page.locator('#guides path[d^="M"]').count() === 2);
  ok(`${w} 3D: botão de pausar visível e acessível`, await page.locator('#pause').isVisible() && await page.getAttribute('#pause', 'aria-pressed') === 'false');
  await page.click('#pause');
  ok(`${w} 3D: pausar muda estado e texto`, await page.getAttribute('#pause', 'aria-pressed') === 'true' && /Retomar/.test(await page.locator('#pause').innerText()));
  await page.click('#pause');
  await shot(page, `coracao-3d@${w}-dark`);
  // interrupções: cliques rápidos em artérias diferentes, abrir/fechar a ficha várias vezes
  await page.locator('#modules .mod[data-module="m1"]').click(); await page.waitForTimeout(60);
  await page.goBack().catch(() => {}); await page.waitForTimeout(60);
  await page.locator('#modules .mod[data-module="m2"]').click(); await page.waitForTimeout(1200);
  ok(`${w} interrupção: troca rápida termina no último módulo, sem voo preso`, (await page.locator('#module-title').innerText()) === 'M2' && await page.locator('.flight').count() === 0 && await page.evaluate(() => getComputedStyle(document.querySelector('#module-title')).opacity === '1'));
  for (let i = 0; i < 8; i++) { await page.locator('#materials [data-mid]').first().click(); await page.waitForTimeout(40); await page.keyboard.press('Escape'); await page.waitForTimeout(40); }
  await page.waitForTimeout(500);
  ok(`${w} interrupção: abrir e fechar a ficha 8 vezes não deixa diálogo preso`, !(await dialogOpen(page, 'dlg-detail')) && await page.evaluate(() => getComputedStyle(document.querySelector('#dlg-detail')).display === 'none'));
  ok(`${w} 3D: sem erros de console`, errors.length === 0, errors.slice(0, 2).join(' | '));
  await ctx.close();
}
{
  const { ctx, page, errors } = await open('dark', 1440, 'noModel', { browser: gl });
  await page.waitForTimeout(2500);
  ok('modelo indisponível: aviso e mapa em linhas continuam', /indisponível/.test(await page.locator('#model-state').innerText()) && await page.locator('#modules .mod').count() === 2 && await page.locator('#map canvas').count() === 0);
  await shot(page, 'modelo-indisponivel@1440-dark');
  ok('modelo indisponível: sem erro de página', errors.filter(e => !/Coração 3D/.test(e)).length === 0, errors.slice(0, 2).join(' | '));
  await ctx.close();
}

/* ---------- edição: marcadores, formulário e Organizar ---------- */
{
  const { ctx, page, errors } = await open('light', 1440);
  ok('edição: Adicionar e Organizar marcados no cabeçalho', await page.locator('.top [data-edit]').count() === 2);
  await hash(page, 'a-m1'); await page.locator('#materials [data-mid]').first().click(); await page.waitForTimeout(400);
  ok('edição: Editar e Remover da ficha marcados', await page.locator('#dlg-detail [data-edit]').count() === 2);
  await page.keyboard.press('Escape'); await page.waitForTimeout(300);
  await page.click('.top [data-action="add"]'); await page.waitForTimeout(400);
  ok('formulário: tipo "Monitoria" disponível', await page.locator('#m-type option[value="Monitoria"]').count() === 1);
  ok('formulário: já sugere o módulo aberto', await page.inputValue('#m-area') === 'm1');
  await page.click('#m-save'); await page.waitForTimeout(200);
  ok('formulário: título e link obrigatórios', await page.locator('#m-title-err').isVisible() && await page.evaluate(() => document.activeElement?.id === 'm-title'));
  await page.fill('#m-title', 'Exemplo — material novo do teste'); await page.fill('#m-url', 'nao-e-link'); await page.click('#m-save'); await page.waitForTimeout(200);
  ok('formulário: link inválido explicado', /https:\/\//.test(await page.locator('#m-url-err').innerText()));
  await page.fill('#m-url', 'https://example.com/novo'); await page.selectOption('#m-area', 'cis1-pm'); await page.click('#m-save'); await page.waitForTimeout(700);
  ok('formulário: salvar fecha e o material aparece', !(await dialogOpen(page, 'dlg-form')) && await page.locator('#materials .material').count() === 5);
  await shot(page, 'modulo-depois-de-adicionar@1440-light');
  await hash(page, 'organizar');
  ok('organizar: árvore com os módulos e aviso do material sem área', await page.locator('#tree > li:has(.row)').count() === 2 && /sem área definida/.test(await page.locator('#tree').innerText()) && await page.locator('#coll-rows .row').count() === 2);
  ok('organizar: acessibilidade', !(await axeClean(page)).length);
  await shot(page, 'organizar@1440-light');
  ok('edição: sem erros de console', errors.length === 0, errors.slice(0, 2).join(' | '));
  await ctx.close();
}

await flat.close(); await gl.close(); Object.values(srv).forEach(x => x.server.close());
console.log(log.join('\n') + `\n\n${log.length - fails} de ${log.length} verificações aprovadas, ${fails} falha(s). Capturas em tools/reports/flows/`);
process.exit(fails ? 1 : 0);
