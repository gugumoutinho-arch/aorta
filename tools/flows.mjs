// Fluxos principais e capturas de revisão visual (dados fictícios de seed.json; não toca no Supabase).
// Uso:  cd tools && node flows.mjs      Saída: capturas em reports/flows/ e um resumo no console.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { chromium } from 'playwright-core';
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
  if (w < 500) await page.click('#more summary');
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
  // grade e agrupamento
  if (w < 500 && !(await page.locator('#more').evaluate(d => d.open))) await page.click('#more summary');
  await page.click('[data-layout="grid"]'); await page.selectOption('#f-group', 'subject'); await page.waitForTimeout(200);
  await shot(page, `grade@${tag}`); await noOverflow(page, `${tag} grade`);
  ok(`${tag} agrupar por assunto`, await page.locator('.group-title').count() > 1);
  await page.click('[data-layout="list"]'); await page.selectOption('#f-group', 'none');
  // detalhes: foco, Escape, retorno
  const trig = page.locator('#lib-results .entry-title button').first();
  await trig.focus(); await page.keyboard.press('Enter'); await page.waitForTimeout(400);
  ok(`${tag} detalhe abre e contém o foco`, await page.evaluate(() => !!document.querySelector('#dlg-detail[open]') && document.querySelector('#dlg-detail').contains(document.activeElement)));
  ok(`${tag} detalhe sem "null"`, !/null|undefined/.test(await page.locator('#dlg-detail').innerText()));
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
  await page.locator('#home-directory').scrollIntoViewIfNeeded(); await shot(page, `inicio-modulos@375-${scheme}`);
  await hash(page, 'organizar'); await shot(page, `organizar@375-${scheme}`);
  await page.click('.tabbar [data-action="add"]'); await page.waitForTimeout(400); await shot(page, `formulario@375-${scheme}`);
  await ctx.close();
  ({ ctx, page } = await open(scheme, 375, 'load'));
  ok(`375-${scheme} carregando mostra esqueleto`, await page.locator('.skel').count() >= 1);
  await shot(page, `carregando@375-${scheme}`); await ctx.close();
  ({ ctx, page } = await open(scheme, 1440, 'none')); await shot(page, `inicio-sem-historico@1440-${scheme}`);
  await hash(page, 'a-cis1'); await shot(page, `unidade@1440-${scheme}`); await ctx.close();
}
await browser.close(); Object.values(srv).forEach(x => x.s.close());
console.log(log.join('\n') + `\n\n${log.length - fails} de ${log.length} verificações aprovadas, ${fails} falha(s). Capturas em tools/reports/flows/`);
process.exit(fails ? 1 : 0);
