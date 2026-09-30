// Monta a página de teste: envolve o index.html no mesmo esqueleto que o claude.ai usa ao publicar
// e injeta um banco de dados FICTÍCIO (seed.json) no lugar do banco real do Artifact.
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const here = path.dirname(fileURLToPath(import.meta.url));
export const siteFile = path.resolve(here, '..', 'index.html');
export const reports = path.join(here, 'reports');

export const SKELETON_HEAD =
  '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">' +
  '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">' +
  '<style>:root{color-scheme:light;box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}' +
  'html{scroll-padding-top:env(safe-area-inset-top,0px)}body{margin:0;padding:0;font:14px -apple-system,BlinkMacSystemFont,sans-serif;background:#faf9f5;color:#141413}' +
  'img{max-width:100%}[hidden]:not([hidden=until-found i]){display:none!important}</style></head><body>';
export const SKELETON_TAIL = '</body></html>';

export function readSite() { return fs.readFileSync(siteFile, 'utf8').replace(/\r\n/g, '\n'); }

export function seed() { return JSON.parse(fs.readFileSync(path.join(here, 'seed.json'), 'utf8')); }

// Código injetado antes da página: imita window.claude.use("db") com dados fictícios.
export function mockDbScript(data = seed()) {
  return `(() => {
    const store = {};
    const put = (col, arr) => arr.forEach(({ id, ...rest }) => { store[col + '/' + id] = rest; });
    put('areas', ${JSON.stringify(data.areas)}); put('collections', ${JSON.stringify(data.collections)}); put('materials', ${JSON.stringify(data.materials)});
    const subs = []; const emit = () => setTimeout(() => subs.forEach(f => f()), 0); let n = 0;
    const snap = col => { const docs = Object.entries(store).filter(([p]) => p.startsWith(col + '/') && p.split('/').length === 2)
      .map(([p, d]) => ({ id: p.split('/')[1], exists: true, data: () => JSON.parse(JSON.stringify(d)), metadata: {} }));
      return { docs, size: docs.length, empty: !docs.length, docChanges: () => [], metadata: {} }; };
    const docRef = p => ({ id: p.split('/').pop(), path: p,
      async get() { const d = store[p]; return { id: this.id, exists: !!d, data: () => d && JSON.parse(JSON.stringify(d)), metadata: {} }; },
      async set(d) { store[p] = JSON.parse(JSON.stringify(d)); emit(); },
      async update(d) { if (!store[p]) throw { code: 'invalid_argument', message: 'missing' }; Object.assign(store[p], JSON.parse(JSON.stringify(d))); emit(); },
      async delete() { delete store[p]; emit(); } });
    const colRef = c => ({ path: c, doc: id => docRef(c + '/' + (id || 't' + Date.now().toString(36) + (n++))),
      onSnapshot(next) { const f = () => next(snap(c)); subs.push(f); setTimeout(f, 30); return () => {}; } });
    window.claude = { use: async name => name === 'db' ? { doc: docRef, collection: colRef } : null };
  })();`;
}

export function pageHtml() {
  return SKELETON_HEAD + readSite() + SKELETON_TAIL;
}

// Servidor local mínimo para o Lighthouse e o Playwright abrirem a página por http.
export function startServer({ withDb = true } = {}) {
  const html = pageHtml().replace('<head>', '<head>' + (withDb ? '<script>' + mockDbScript() + '</script>' : ''));
  const server = http.createServer((req, res) => {
    if (req.url.startsWith('/favicon')) { res.writeHead(204); return res.end(); }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); res.end(html);
  });
  return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve({ server, url: `http://127.0.0.1:${server.address().port}/`, html })));
}

export function chromePath() {
  const c = [process.env.CHROME_PATH, 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'].filter(Boolean);
  const found = c.find(p => fs.existsSync(p));
  if (!found) throw new Error('Chrome não encontrado. Defina a variável CHROME_PATH.');
  return found;
}
