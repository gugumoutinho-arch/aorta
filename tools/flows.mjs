// Fluxos principais do Aorta e capturas de revisão visual (dados fictícios de seed.json; não toca no Supabase).
// Uso:  cd tools && node flows.mjs      Saída: capturas em reports/flows/ e um resumo no console.
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';
import AxeBuilder from '@axe-core/playwright';
import { reports, chromePath, startServer, withDb, seed, LOADING, FAILING, WEBGL_ARGS, here } from './harness.mjs';
import { withTopics } from './fixtures-topics.mjs';

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
  cases: await startServer({ inject: withDb(withTopics(JSON.parse(fs.readFileSync(path.join(here, 'seed-v4.json'), 'utf8')))) }),
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

/* Linhas-guia sem cruzar entre si nem atravessar outro rótulo (mesma régua de acervos.mjs), lidas do atributo d. */
const guidesClean = page => page.evaluate(() => {
  const m = document.querySelector('#map').getBoundingClientRect();
  const segs = [...document.querySelectorAll('#guides path[d]')].map(g => { const n = g.getAttribute('d').match(/-?[\d.]+/g).map(Number); return { i: g.dataset.guide, pts: [[n[0], n[1]], [n[2], n[3]], [n[4], n[3]]] }; });
  const cross = (a, b, c, d) => { const o = (p, q, r) => Math.sign((q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0])); return o(a, b, c) * o(a, b, d) < 0 && o(c, d, a) * o(c, d, b) < 0; };
  const lines = s => [[s.pts[0], s.pts[1]], [s.pts[1], s.pts[2]]];
  for (const a of segs) for (const b of segs) if (a.i < b.i) for (const [p1, p2] of lines(a)) for (const [q1, q2] of lines(b)) if (cross(p1, p2, q1, q2)) return false;
  const boxes = [...document.querySelectorAll('#modules .mod')].filter(e => e.offsetWidth).map(e => { const r = e.getBoundingClientRect(); return { i: e.dataset.index, l: r.left - m.left + 1, t: r.top - m.top + 1, r: r.right - m.left - 1, b: r.bottom - m.top - 1 }; });
  const hits = (p, q, b) => { for (let k = 0; k <= 20; k++) { const x = p[0] + (q[0] - p[0]) * k / 20, y = p[1] + (q[1] - p[1]) * k / 20; if (x > b.l && x < b.r && y > b.t && y < b.b) return true; } return false; };
  return segs.every(s => boxes.every(b => b.i === s.i || lines(s).every(([p1, p2]) => !hits(p1, p2, b))));
});

/* ---------- caminho principal, em 3 larguras e 2 temas ---------- */
for (const w of [320, 375, 1440]) for (const scheme of ['light', 'dark']) {
  const tag = `${w}-${scheme}`;
  const { ctx, page, errors } = await open(scheme, w);
  // início
  ok(`${tag} início: retomada com o último material aberto`, await page.locator('#resume:not([hidden]) [data-mid]').count() === 1);
  ok(`${tag} início: números reais do acervo`, /7\s+materiais/.test(await page.locator('#counts').innerText()) && /2 de 2/.test(await page.locator('#counts').innerText()));
  ok(`${tag} início: um rótulo por módulo no mapa`, await page.locator('#modules .mod').count() === 2);
  ok(`${tag} início: mapa em linhas sem WebGL, com aviso`, await page.locator('#map canvas').count() === 0 && /Mapa em linhas/.test(await page.locator('#model-state').innerText()));
  // Índice editorial (direção D): um grupo por módulo com material e uma linha numerada por matéria (01…08, na ordem do curso).
  ok(`${tag} início: índice dos módulos`, await page.locator('#course-index .index-group').count() === 2 && !/null|undefined/.test(await page.locator('#course-index').innerText())
    && JSON.stringify(await page.locator('#course-index .index-row .index-n').allInnerTexts()) === JSON.stringify(['01', '02', '03', '04', '05', '06', '07', '08']));
  // Uma linha-guia por rótulo à vista (no celular, só o do destaque), e cada uma termina na borda do seu rótulo.
  const guideOk = () => page.evaluate(() => { const vis = [...document.querySelectorAll('#modules .mod')].filter(e => e.offsetWidth), m = document.querySelector('#map').getBoundingClientRect();
    return vis.length > 0 && document.querySelectorAll('#guides path[d^="M"]').length === vis.length && vis.every(b => { const n = document.querySelector(`[data-guide="${b.dataset.index}"]`)?.getAttribute('d')?.match(/-?[\d.]+/g)?.map(Number); const r = b.getBoundingClientRect();
      return n && Math.abs(n[4] + m.left - (b.dataset.side === 'right' ? r.left : r.right)) < 2 && n[3] + m.top > r.top && n[3] + m.top < r.bottom; }); });
  ok(`${tag} início: linhas-guia ligam rótulo e artéria`, await guideOk());
  await noOverflow(page, `${tag} início`); await shot(page, `inicio@${tag}`);
  // teclado no mapa: setas andam entre as artérias
  await page.locator('#modules .mod').first().focus(); await page.keyboard.press('ArrowRight');
  // No celular o palco mostra um rótulo só: a seta não pode levar o foco a um rótulo escondido.
  ok(`${tag} mapa: seta move o foco para o próximo módulo`, await page.evaluate(() => { const vis = [...document.querySelectorAll('#modules .mod')].filter(e => e.offsetWidth); return document.activeElement === vis[vis.length > 1 ? 1 : 0]; }));
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
  // filtros (direção D: barra compacta em todas as larguras; tipo/situação/coleção/ordem ficam recolhidos em "Filtros")
  {
    ok(`${tag} filtros: recolhidos, folhas logo abaixo da busca`, await page.locator('#f-status').isHidden() && await page.getAttribute('#f-more', 'aria-expanded') === 'false');
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
  ok(`${tag} aviso com Desfazer não cobre o fim da lista (rolado até o fim)`, await page.evaluate(async () => {
    window.scrollTo(0, document.documentElement.scrollHeight); await new Promise(r => setTimeout(r, 120));
    const rows = [...document.querySelectorAll('#materials .material')], last = rows.at(-1), t = document.querySelector('.toast');
    return document.body.classList.contains('has-toast') && !!t && (!last || last.getBoundingClientRect().bottom <= t.getBoundingClientRect().top + 1);
  }));
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
  ok(`${tag} busca rápida: caminho curto (sem o acervo atual, no máximo 2 linhas) e tipo à direita; título inteiro`, await page.evaluate(() => {
    const o = document.querySelector('#results [aria-selected=true]'), sub = o?.querySelector('small'), ty = o?.querySelector('.ty');
    const lines = el => Math.round(el.getBoundingClientRect().height / parseFloat(getComputedStyle(el).lineHeight || '16'));
    const title = o?.querySelector('strong');
    return !!o && !/^IDOMED ·/.test(sub.textContent) && !sub.textContent.includes('M1 ›') && ty.textContent !== 'Ficha'
      && lines(sub) <= 2 && title.scrollHeight <= title.clientHeight + 1;
  }));
  // Digitar o mesmo texto com outro acento ou caixa não refaz a lista (o nó selecionado continua o mesmo).
  const sameNode = await page.evaluate(() => { window.__opt = document.querySelector('#results [aria-selected=true]'); return true; });
  await page.fill('#pq', 'PLACÊNTA'); await page.waitForTimeout(200);
  ok(`${tag} busca rápida: mesma busca com outro acento não refaz a lista`, sameNode && await page.evaluate(() => document.querySelector('#results [aria-selected=true]') === window.__opt));
  await page.fill('#pq', 'placenta'); await page.waitForTimeout(200);
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
  // Sem histórico, o mesmo lugar do "Continuar" convida a começar pelo primeiro módulo com material (sem salto de layout).
  ok(`375-${scheme} sem histórico: sem "Continuar", com "Comece por aqui" levando ao M1`, !/Continuar/.test(await page.locator('#resume').innerText()) && await page.locator('#resume.start a[href="#a-m1"]').count() >= 1 && await page.locator('#resume [data-mid]').count() === 0);
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
  ok(`${tag}: rótulos dentro do mapa`, await page.evaluate(() => { const m = document.querySelector('#map').getBoundingClientRect(); return [...document.querySelectorAll('#modules .mod')].filter(e => e.offsetWidth).every(e => { const r = e.getBoundingClientRect(); return r.left >= m.left - 1 && r.right <= m.right + 1 && r.top >= m.top - 1 && r.bottom <= m.bottom + 1; }); }));
  ok(`${tag}: índice separa os módulos em produção`, await page.locator('.production-index a').count() === 6);
  const v = await axeClean(page); ok(`${tag}: acessibilidade do início`, v.length === 0, v.map(x => x.id).join(', '));
  await noOverflow(page, tag); await shot(page, `em-producao-inicio@${tag.replace(' em produção', '')}`);
  // Celular (direção D): o palco compacto mostra um rótulo só; todos os módulos continuam a um toque, pelo índice.
  if (w < 641) {
    ok(`${tag}: palco compacto com um rótulo à vista (o do "Continuar" ou o primeiro com material)`, await page.evaluate(() => [...document.querySelectorAll('#modules .mod')].filter(e => e.offsetWidth).length === 1));
    ok(`${tag}: os oito módulos estão no índice (grupos e "em produção")`, await page.evaluate(() => new Set([...document.querySelectorAll('#course-index [data-module]')].map(a => a.dataset.module)).size === 8));
    await page.locator('.production-index a[href="#a-m3"]').click();
  } else await page.locator('#modules .mod[data-module="m3"]').click();
  await page.waitForTimeout(800);
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

/* ---------- ficha fixa à direita da lista (direção D, ≥ 1200 px) ---------- */
for (const scheme of ['light', 'dark']) {
  const { ctx, page, errors } = await open(scheme, 1440, 'cases');
  await page.evaluate(() => { location.hash = 'a-cis1-anat'; }); await page.waitForTimeout(700);
  const rows = page.locator('#materials [data-mid]');
  await rows.nth(0).click(); await page.waitForTimeout(500);
  const st = () => page.evaluate(() => { const d = document.querySelector('#dlg-detail'), l = document.querySelector('#materials').getBoundingClientRect(), r = d.getBoundingClientRect();
    return { open: d.open, modal: d.matches(':modal'), overlap: !(r.left >= l.right - 1 || r.right <= l.left + 1), title: document.querySelector('#d-title')?.textContent, current: document.querySelector('#materials .material[aria-current="true"] [data-mid]')?.dataset.mid, scroll: getComputedStyle(document.body).overflow }; });
  let a = await st();
  ok(`1440-${scheme} ficha fixa: aberta, não modal, sem cobrir a lista, sem travar a rolagem`, a.open && !a.modal && !a.overlap && a.scroll !== 'hidden', JSON.stringify(a));
  ok(`1440-${scheme} ficha fixa: a linha aberta fica marcada`, a.current === await rows.nth(0).getAttribute('data-mid'));
  const second = await rows.nth(1).getAttribute('data-mid');
  await rows.nth(1).click(); await page.waitForTimeout(500);
  const b = await st();
  ok(`1440-${scheme} ficha fixa: outro material troca o conteúdo sem fechar`, b.open && !b.modal && b.title !== a.title && b.current === second);
  await page.keyboard.press('Escape'); await page.waitForTimeout(400);
  ok(`1440-${scheme} ficha fixa: Esc fecha e devolve o foco à linha`, !(await dialogOpen(page, 'dlg-detail')) && await page.evaluate(x => document.activeElement?.dataset?.mid === x, second));
  ok(`1440-${scheme} ficha fixa: ao fechar, nenhuma linha fica marcada`, await page.locator('#materials .material[aria-current]').count() === 0);
  const v = await axeClean(page); ok(`1440-${scheme} ficha fixa: acessibilidade da página do módulo`, v.length === 0, v.map(x => x.id).join(', '));
  await page.setViewportSize({ width: 1199, height: 900 }); await page.waitForTimeout(300);
  await rows.nth(0).click(); await page.waitForTimeout(500);
  ok(`1199-${scheme} abaixo de 1200 px a ficha continua modal`, await page.evaluate(() => document.querySelector('#dlg-detail').matches(':modal')));
  await page.keyboard.press('Escape'); await page.waitForTimeout(300);
  ok(`ficha fixa ${scheme}: sem erros de console`, errors.length === 0, errors.slice(0, 2).join(' | '));
  await ctx.close();
}

/* ---------- folha da ficha no celular: alça, cancelamento, reabrir no meio e movimento reduzido no meio do gesto ---------- */
{
  const { ctx, page, errors } = await open('dark', 375, 'cases');
  await page.evaluate(() => { location.hash = 'a-cis1-anat'; }); await page.waitForTimeout(700);
  const row = page.locator('#materials [data-mid]').first();
  const tf = () => page.evaluate(() => document.querySelector('#dlg-detail').style.transform || '');
  const handle = async () => (await page.locator('#drag-handle').boundingBox());
  await row.click(); await page.waitForTimeout(500);
  let hb = await handle();
  await page.mouse.move(hb.x + hb.width / 2, hb.y + hb.height / 2); await page.mouse.down(); await page.mouse.move(hb.x + hb.width / 2, hb.y + 60, { steps: 4 });
  ok('375 folha: arrastar a alça acompanha o dedo', /translateY\((?!0px)/.test(await tf()));
  await page.evaluate(() => document.querySelector('#drag-handle').dispatchEvent(new PointerEvent('pointercancel', { bubbles: true })));
  await page.mouse.up(); await page.waitForTimeout(200);
  ok('375 folha: gesto cancelado volta ao lugar e a ficha continua aberta', await dialogOpen(page, 'dlg-detail') && await tf() === '');
  ok('375 folha: o conteúdo rola e o texto não depende da alça', await page.evaluate(() => getComputedStyle(document.querySelector('#dlg-detail')).overflowY !== 'hidden'));
  hb = await handle();
  await page.mouse.move(hb.x + hb.width / 2, hb.y + hb.height / 2); await page.mouse.down(); await page.mouse.move(hb.x + hb.width / 2, hb.y + 140, { steps: 5 }); await page.mouse.up(); await page.waitForTimeout(500);
  ok('375 folha: arrastar mais que 90 px fecha e devolve o foco à linha', !(await dialogOpen(page, 'dlg-detail')) && await page.evaluate(() => !!document.activeElement?.closest('#materials')));
  await row.click(); await page.waitForTimeout(450);
  await page.locator('#dlg-detail [data-close]').first().click(); await page.waitForTimeout(40);
  await row.click(); await page.waitForTimeout(600);
  ok('375 folha: reabrir durante o fechamento deixa a ficha aberta e inteira', await dialogOpen(page, 'dlg-detail') && await page.evaluate(() => getComputedStyle(document.querySelector('#dlg-detail')).opacity === '1'));
  hb = await handle();
  await page.mouse.move(hb.x + hb.width / 2, hb.y + hb.height / 2); await page.mouse.down(); await page.mouse.move(hb.x + hb.width / 2, hb.y + 50, { steps: 3 });
  await page.emulateMedia({ reducedMotion: 'reduce' }); await page.waitForTimeout(150);
  ok('375 folha: ligar "reduzir movimento" no meio do arraste devolve a folha ao lugar', await tf() === '' && await dialogOpen(page, 'dlg-detail'));
  await page.mouse.up(); await page.keyboard.press('Escape'); await page.waitForTimeout(200);
  ok('375 folha: Esc fecha', !(await dialogOpen(page, 'dlg-detail')));
  ok('375 folha: sem erros de console', errors.length === 0, errors.slice(0, 2).join(' | '));
  await ctx.close();
}

/* ---------- barra inferior do celular (direção D) e atalhos do índice ---------- */
for (const scheme of ['light', 'dark']) {
  const { ctx, page, errors } = await open(scheme, 375);
  const current = () => page.evaluate(() => document.querySelector('#tabbar [aria-current="page"]')?.dataset.tabNav || '');
  ok(`375-${scheme} barra inferior: visível, 4 itens de 44 px ou mais, Início ativo`, await page.locator('#tabbar').isVisible() && await page.evaluate(() => [...document.querySelectorAll('#tabbar a, #tabbar button')].every(e => e.offsetHeight >= 44 && e.offsetWidth >= 44)) && await current() === 'inicio');
  ok(`375-${scheme} barra inferior: não cobre o fim da página`, await page.evaluate(() => parseFloat(getComputedStyle(document.body).paddingBottom) >= document.querySelector('#tabbar').offsetHeight));
  await page.locator('#tabbar [data-tab-nav="mapa"]').click(); await page.waitForTimeout(900);
  ok(`375-${scheme} Mapa: leva ao índice, com foco nele, e fica ativo`, await page.evaluate(() => { const r = document.querySelector('#indice').getBoundingClientRect(); return r.top < innerHeight / 2 && document.activeElement?.id === 'indice'; }) && await current() === 'mapa');
  await page.locator('#tabbar [data-tab-nav="favoritos"]').click(); await page.waitForTimeout(700);
  const fav = await page.evaluate(() => ({ hash: location.hash, pressed: document.querySelector('#f-fav')?.getAttribute('aria-pressed'), n: document.querySelectorAll('#materials [data-fav]').length, on: document.querySelectorAll('#materials [data-fav][aria-pressed="true"]').length }));
  ok(`375-${scheme} Favoritos: só favoritos (${fav.on}/${fav.n}) com o filtro ligado`, fav.hash === '#todos' && fav.pressed === 'true' && fav.n > 0 && fav.n === fav.on && await current() === 'favoritos');
  await page.locator('#tabbar [data-tab-nav="buscar"]').click(); await page.waitForTimeout(400);
  ok(`375-${scheme} Buscar: abre a busca rápida e esconde a barra`, await dialogOpen(page, 'palette') && await page.locator('#tabbar').isHidden());
  await page.keyboard.press('Escape'); await page.waitForTimeout(300);
  await page.locator('#tabbar [data-tab-nav="inicio"]').click(); await page.waitForTimeout(700);
  ok(`375-${scheme} Início: volta ao início`, await page.locator('#view-home').isVisible() && await current() === 'inicio');
  ok(`375-${scheme} índice: "Ver todos os materiais" no fim`, await page.locator('#course-index .index-all[href="#todos"]').count() === 1);
  ok(`375-${scheme} barra inferior: sem erros de console`, errors.length === 0, errors.slice(0, 2).join(' | '));
  await ctx.close();
}
{
  const { ctx, page } = await open('dark', 1440);
  ok('1440 barra inferior: só no celular', await page.locator('#tabbar').isHidden());
  await ctx.close();
}
/* Prateleira de casos clínicos: só com caso; "Ver todos" abre todos os materiais filtrados por "Caso clínico". */
for (const w of [375, 1440]) {
  const { ctx, page, errors } = await open('light', w, 'cases');
  await page.evaluate(() => { location.hash = 'idomed'; }); await page.waitForTimeout(700);
  const cards = await page.locator('#cases .case-card').count();
  ok(`${w} casos: prateleira com os casos do acervo, cartões com nome completo para o leitor de tela`, cards === 2 && await page.evaluate(() => [...document.querySelectorAll('#cases [data-mid]')].every(b => /caso/i.test(b.getAttribute('aria-label')))));
  await page.locator('#cases-all').click(); await page.waitForTimeout(800);
  const st = await page.evaluate(() => ({ hash: location.hash, type: document.querySelector('#f-type')?.value, n: document.querySelectorAll('#materials [data-mid]').length }));
  ok(`${w} casos: "Ver todos" abre todos os materiais só com casos (${st.n})`, st.hash === '#todos' && st.type === 'Caso clínico' && st.n === 2);
  ok(`${w} casos: sem erros de console`, errors.length === 0, errors.slice(0, 2).join(' | '));
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
for (const w of [375, 768, 1440]) {
  const { ctx, page, errors } = await open('dark', w, 'main', { browser: gl });
  await page.waitForFunction(() => document.querySelector('#map')?.classList.contains('ready'), null, { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(1500);
  ok(`${w} 3D: o coração carrega por cima do mapa em linhas`, await page.locator('#map.ready canvas').count() === 1 && await page.locator('#loader').isHidden());
  ok(`${w} 3D: linhas-guia acompanham as artérias projetadas`, await page.evaluate(() => { const vis = [...document.querySelectorAll('#modules .mod')].filter(e => e.offsetWidth).length; return vis > 0 && document.querySelectorAll('#guides path[d^="M"]').length === vis; }));
  ok(`${w} 3D: linhas-guia sem cruzar nem atravessar rótulos (3D carregado)`, await guidesClean(page));
  { const r = await page.locator('#map').boundingBox(); await page.mouse.move(r.x + r.width - 4, r.y + 4, { steps: 6 }); await page.waitForTimeout(900); }
  ok(`${w} 3D: linhas-guia continuam limpas com o coração inclinado pelo ponteiro`, await guidesClean(page));
  await page.mouse.move(2, 2); await page.waitForTimeout(300);
  ok(`${w} 3D: botão de pausar visível e acessível`, await page.locator('#pause').isVisible() && await page.getAttribute('#pause', 'aria-pressed') === 'false');
  await page.click('#pause');
  ok(`${w} 3D: pausar muda estado e texto`, await page.getAttribute('#pause', 'aria-pressed') === 'true' && /Retomar/.test(await page.locator('#pause').innerText()));
  await page.click('#pause');
  await shot(page, `coracao-3d@${w}-dark`);
  // interrupções: cliques rápidos em artérias diferentes, abrir/fechar a ficha várias vezes
  // No celular só um rótulo fica no palco: a troca rápida vem pelos links do índice (mesmo destino, mesma corrida).
  // No celular só um rótulo fica no palco: o m1 vai pelo rótulo (mergulho) quando ele é o destacado; o m2, pelo índice.
  const modLink = async id => w < 641 && !(await page.locator(`#modules .mod[data-module="${id}"]`).isVisible()) ? page.locator(`#course-index [data-module="${id}"]`) : page.locator(`#modules .mod[data-module="${id}"]`);
  await (await modLink('m1')).click(); await page.waitForTimeout(60);
  await page.goBack().catch(() => {}); await page.waitForTimeout(60);
  await (await modLink('m2')).click(); await page.waitForTimeout(1200);
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
