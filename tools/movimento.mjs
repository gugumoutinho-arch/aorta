// Vídeos e medida das microinterações (rodada B): troca de acervo (pílula), unidades (sublinhado), abas de assunto,
// estrela, ficha (abrir/fechar), aviso com Desfazer e busca. Para cada cena: 5 sequências equivalentes; o p95 do quadro
// conta SÓ a janela de movimento ativo (700 ms depois de cada gesto), não o repouso.
// Uso: cd tools && node movimento.mjs [--fase=u1-antes] [--so=estrela,ficha] [--largura=1440] [--sem-video]
// Saída: reports/ui/videos/<fase>/<cena>@<largura>.webm e reports/ui/videos/<fase>/medidas.json.
// Ambiente da nuvem (SwiftShader, sem GPU): os números mostram tendência e regressão, não 60 fps em celular real.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { chromium } from 'playwright-core';
import { reports, chromePath, startServer, withDb, WEBGL_ARGS, here } from './harness.mjs';
import { withTopics } from './fixtures-topics.mjs';

const arg = (k, d) => process.argv.find(a => a.startsWith(`--${k}=`))?.slice(k.length + 3) ?? d;
const fase = arg('fase', 'atual'), only = arg('so', '').split(',').filter(Boolean), width = Number(arg('largura', '1440'));
const video = !process.argv.includes('--sem-video'), RUNS = 5, WINDOW = 700;
const out = path.join(reports, 'ui', 'videos', fase); fs.mkdirSync(out, { recursive: true });
const data = withTopics(JSON.parse(fs.readFileSync(path.join(here, 'seed-v4.json'), 'utf8')));
const { server, url } = await startServer({ inject: withDb(data) });

const mark = p => p.evaluate(() => window.__marks.push(performance.now()));
const tap = async (p, sel) => { await mark(p); await p.locator(sel).first().click(); await p.waitForTimeout(WINDOW + 150); };
/* Cada cena: endereço inicial e uma sequência de gestos (cada gesto marca o início de uma janela ativa). */
const SCENES = {
  'abas-acervo': { hash: 'idomed', run: async p => { await tap(p, '[data-acervo-tab="geral"]'); await tap(p, '[data-acervo-tab="idomed"]'); } },
  'unidades': { hash: 'a-m1', run: async p => { const n = await p.locator('#units [data-unit]').count(); for (let i = 1; i < Math.min(n, 4); i++) await tap(p, `#units [data-unit] >> nth=${i}`); await tap(p, '#units [data-unit] >> nth=0'); } },
  'abas-assunto': { hash: 'a-cis1-anat', run: async p => { const n = await p.locator('#topic-tabs [data-tab]').count(); for (let i = 1; i < Math.min(n, 4); i++) await tap(p, `#topic-tabs [data-tab] >> nth=${i}`); await tap(p, '#topic-tabs [data-tab] >> nth=0'); } },
  'estrela': { hash: 'a-cis1-anat', run: async p => { await tap(p, '#materials [data-fav]'); await tap(p, '#materials [data-fav]'); } },
  'ficha': { hash: 'a-cis1-anat', run: async p => {
    await tap(p, '#materials [data-mid]');
    await mark(p); await p.keyboard.press('Escape'); await p.waitForTimeout(WINDOW + 150);
    await tap(p, '#materials [data-mid] >> nth=1');
    await mark(p); await p.mouse.click(5, 300); await p.waitForTimeout(WINDOW + 150); } },
  'aviso': { hash: 'a-cis1-anat', run: async p => {
    await p.locator('#materials [data-mid]').first().click(); await p.waitForTimeout(600);
    await p.locator('#d-remove').click(); await tap(p, '#d-rm-yes'); await tap(p, '.toast button'); } },
  'busca': { hash: 'idomed', run: async p => {
    await tap(p, '.top-actions [data-search]');
    await mark(p); await p.keyboard.type('memb', { delay: 60 }); await p.waitForTimeout(WINDOW);
    await mark(p); await p.keyboard.press('Escape'); await p.waitForTimeout(WINDOW + 150); } },
};
const browser = await chromium.launch({ executablePath: chromePath(), headless: true, args: WEBGL_ARGS });
const result = { fase, commit: execFileSync('git', ['rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim(), navegador: 'Chromium ' + browser.version(),
  renderer: 'SwiftShader (sem GPU)', viewport: `${width}x${width < 500 ? 844 : 900}`, cpu: 'sem limitação', rede: 'local', sequencias: RUNS, janelaMs: WINDOW, seed: 'seed-v4 + fixtures-topics', cenas: {} };
const p95 = xs => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.floor(s.length * .95))] : 0; };
const median = xs => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : 0; };
try {
  for (const [name, sc] of Object.entries(SCENES)) {
    if (only.length && !only.includes(name)) continue;
    const runs = [];
    for (let r = 0; r < RUNS; r++) {
      const rec = video && r === 0;
      const ctx = await browser.newContext({ viewport: { width, height: width < 500 ? 844 : 900 }, colorScheme: 'dark', ...(rec ? { recordVideo: { dir: out, size: { width: width < 500 ? 390 : 960, height: width < 500 ? 844 : 600 } } } : {}) });
      await ctx.route(/supabase\.co/, q => q.abort());
      await ctx.addInitScript(() => {
        window.__marks = []; window.__frames = []; window.__tasks = [];
        let prev = 0; const loop = t => { if (prev) window.__frames.push([t, t - prev]); prev = t; requestAnimationFrame(loop); }; requestAnimationFrame(loop);
        new PerformanceObserver(l => l.getEntries().forEach(e => window.__tasks.push([e.startTime, e.duration]))).observe({ type: 'longtask', buffered: true });
      });
      const page = await ctx.newPage();
      await page.goto(url + '#' + sc.hash); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(1500);
      await sc.run(page);
      const m = await page.evaluate(w => {
        const inWin = t => window.__marks.some(s => t >= s && t <= s + w);
        return { frames: window.__frames.filter(([t]) => inWin(t)).map(([, d]) => d), tasks: window.__tasks.filter(([t]) => inWin(t)).map(([, d]) => d), gestures: window.__marks.length };
      }, WINDOW);
      runs.push({ p95: +p95(m.frames).toFixed(1), worstTask: +Math.max(0, ...m.tasks).toFixed(0), frames: m.frames.length, gestures: m.gestures });
      const v = rec ? page.video() : null;
      await ctx.close();
      if (v) fs.renameSync(await v.path(), path.join(out, `${name}@${width}.webm`));
    }
    result.cenas[name] = { p95Mediana: median(runs.map(x => x.p95)), p95Pior: Math.max(...runs.map(x => x.p95)), piorTarefa: Math.max(...runs.map(x => x.worstTask)), sequencias: runs };
    console.log(`${name}: p95 ativo mediana ${result.cenas[name].p95Mediana} ms (pior ${result.cenas[name].p95Pior}), pior tarefa ${result.cenas[name].piorTarefa} ms`);
  }
} finally { await browser.close(); server.close(); }
const file = path.join(out, `medidas@${width}.json`);
const prev = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : null;
if (prev && only.length) result.cenas = { ...prev.cenas, ...result.cenas };
fs.writeFileSync(file, JSON.stringify(result, null, 1));
