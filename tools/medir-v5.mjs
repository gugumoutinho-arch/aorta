// Medição de fluidez (CPU 4×, SwiftShader: tendência, não GPU física): entrada, troca de acervo e mergulho.
// Uso: cd tools && node medir-v5.mjs [--fase=nome]   (o baseline-v5.json só nasce com --antes --gravar-baseline)
import fs from 'node:fs';
import path from 'node:path';
import { initialBundle } from './bundle-v5.mjs';
import { execFileSync } from 'node:child_process';
import { chromium } from 'playwright-core';
import { startServer, withDb, chromePath, WEBGL_ARGS } from './harness.mjs';
import { sessionCls, p95, v5ReportsDir, assertBaselineWritable } from './gates.mjs';
import { abundantSeed } from './seed-abundante.mjs';
const argv = process.argv.slice(2);
const phase = argv.includes('--antes') ? 'antes' : (argv.find(a => a.startsWith('--fase='))?.slice(7) || 'depois');
const baselineFile = new URL('./baseline-v5.json', import.meta.url);
if (phase === 'antes') assertBaselineWritable(baselineFile, argv);
const folder = v5ReportsDir(); fs.mkdirSync(folder, { recursive: true });
const data = JSON.parse(fs.readFileSync(new URL('./seed-v4.json', import.meta.url), 'utf8'));
const srv = await startServer({ inject: withDb(data) });
const bundle = initialBundle();
const browser = await chromium.launch({ executablePath: chromePath(), headless: true, args: WEBGL_ARGS });
const metrics = [];
try {
  for (const acervo of ['idomed', 'geral']) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: 'dark' });
    const page = await context.newPage(), cdp = await context.newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await page.addInitScript(() => {
      window.measureV5 = { tasks: [], shifts: [], frames: [] };
      new PerformanceObserver(l => l.getEntries().forEach(e => window.measureV5.tasks.push({ at: e.startTime, duration: e.duration }))).observe({ type: 'longtask', buffered: true });
      new PerformanceObserver(l => l.getEntries().forEach(e => { if (!e.hadRecentInput) window.measureV5.shifts.push({ at: e.startTime, value: e.value }); })).observe({ type: 'layout-shift', buffered: true });
      let prev = 0; function frame(t) { if (prev) window.measureV5.frames.push({ at: t, duration: t - prev }); prev = t; requestAnimationFrame(frame); } requestAnimationFrame(frame);
    });
    await page.goto(srv.url + '#' + acervo); await page.waitForTimeout(4500);
    const loaded = await page.evaluate(() => performance.now());
    await page.locator('[data-acervo-tab="' + (acervo === 'geral' ? 'idomed' : 'geral') + '"]').click(); await page.waitForTimeout(2500);
    const switched = await page.evaluate(() => performance.now());
    await page.locator('#modules .mod').first().click(); await page.waitForTimeout(1800);
    const measurement = await page.evaluate(({ loaded, switched }) => {
      const m = window.measureV5;
      const summarize = (start, end) => { const f = m.frames.filter(x => x.at >= start && x.at < end), tasks = m.tasks.filter(x => x.at >= start && x.at < end);
        return { fps: f.length ? +(1000 / (f.reduce((n,x)=>n+x.duration,0)/f.length)).toFixed(1) : 0, frames: f.map(x => x.duration), longTasks: tasks.length, maximumTask: Math.max(0,...tasks.map(x=>x.duration)) }; };
      return { shifts: m.shifts, entrance: summarize(0,loaded), switch: summarize(loaded,switched), dive: summarize(switched,performance.now()) };
    }, { loaded, switched });
    const stage = s => { const { frames, ...rest } = s; return { ...rest, p95Frame: +p95(frames).toFixed(1) }; };
    metrics.push({ acervo, cls: sessionCls(measurement.shifts), entrance: stage(measurement.entrance), switch: stage(measurement.switch), dive: stage(measurement.dive) });
    await context.close();
  }
  for (const scenario of ['v4', 'abundante']) {
    const server = scenario === 'v4' ? srv : await startServer({ inject: withDb(abundantSeed()) });
    for (const width of [320,375,1440]) for (const theme of ['dark','light']) for(const acervo of ['idomed','geral']) {
      const page = await browser.newPage({viewport:{width,height:width<500?844:1000},colorScheme:theme,reducedMotion:'reduce'});
      await page.goto(server.url+'#'+acervo);await page.waitForSelector('#modules .mod');await page.evaluate(()=>document.fonts.ready);
      await page.screenshot({path:path.join(folder,`${phase}-${scenario}-${acervo}-${theme}-${width}.png`)});await page.close();
    }
    if(server!==srv)server.server.close();
  }
} finally { await browser.close(); srv.server.close(); }
const result = { phase, commit: execFileSync('git',['rev-parse','--short','HEAD'],{encoding:'utf8'}).trim(), cpu: 4, renderer: 'SwiftShader (correção/tendência; não GPU física)', bundle, metrics };
fs.writeFileSync(path.join(folder,phase+'.json'),JSON.stringify(result,null,2));
if (phase === 'antes') fs.writeFileSync(baselineFile, JSON.stringify(result, null, 2));
console.log(JSON.stringify(result,null,2));
