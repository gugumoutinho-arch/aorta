// Preflight do ambiente para trabalho visual: Chromium, WebGL, captura PNG, vídeo finalizado e fontes.
// Uso: cd tools && node ambiente.mjs   (grava reports/ambiente/ e imprime um resumo; não reprova: só registra)
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';
import { startServer, withDb, chromePath, WEBGL_ARGS, reports, here } from './harness.mjs';
import { withTopics } from './fixtures-topics.mjs';

const out = path.join(reports, 'ambiente'); fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
const data = withTopics(JSON.parse(fs.readFileSync(path.join(here, 'seed-v4.json'), 'utf8')));
const { server, url } = await startServer({ inject: withDb(data) });
const browser = await chromium.launch({ executablePath: chromePath(), headless: true, args: WEBGL_ARGS });
const r = { node: process.version, chromium: browser.version(), executable: chromePath() };
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, recordVideo: { dir: out, size: { width: 720, height: 450 } } });
  const page = await context.newPage(), fontRequests = [];
  page.on('requestfinished', q => { if (/fonts\.(googleapis|gstatic)\.com/.test(q.url())) fontRequests.push('ok ' + q.url().slice(0, 60)); });
  page.on('requestfailed', q => { if (/fonts\.(googleapis|gstatic)\.com/.test(q.url())) fontRequests.push('falhou ' + q.failure()?.errorText); });
  await page.goto(url + '#idomed'); await page.waitForTimeout(3000);
  r.webgl = await page.evaluate(() => {
    const gl = document.createElement('canvas').getContext('webgl2') || document.createElement('canvas').getContext('webgl');
    if (!gl) return null;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
  });
  r.fonts = await page.evaluate(async () => {
    await document.fonts.ready;
    const faces = [...document.fonts].map(f => f.family + ':' + f.status);
    return { literata: document.fonts.check('16px Literata'), schibsted: document.fonts.check('16px "Schibsted Grotesk"'), loaded: faces.filter(f => f.endsWith(':loaded')).length, faces: faces.length };
  });
  r.fontRequests = fontRequests;
  await page.screenshot({ path: path.join(out, 'captura.png') });
  r.png = fs.statSync(path.join(out, 'captura.png')).size;
  await page.locator('#modules .mod').first().hover(); await page.waitForTimeout(600);
  const video = page.video(); await context.close();
  const file = await video.path();
  r.video = { file: path.basename(file), bytes: fs.statSync(file).size };
} finally { await browser.close(); server.close(); }
fs.writeFileSync(path.join(out, 'ambiente.json'), JSON.stringify(r, null, 2));
console.log(JSON.stringify(r, null, 2));
