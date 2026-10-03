// Base dos testes: monta o site com o Vite (dist/) e o serve localmente, com um banco fictício injetado.
// O banco fictício imita window.claude.use("db"); nenhum teste toca no Supabase.
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const here = path.dirname(fileURLToPath(import.meta.url));
export const root = path.resolve(here, '..');
export const dist = path.join(root, 'dist');
export const reports = path.join(here, 'reports');

export function seed() { return JSON.parse(fs.readFileSync(path.join(here, 'seed.json'), 'utf8')); }

/* Roda "vite build" uma vez por processo. Devolve { ok, log }. */
let built = null;
export function buildSite() {
  if (built) return built;
  const vite = path.join(root, 'node_modules', 'vite', 'bin', 'vite.js');
  if (!fs.existsSync(vite)) return (built = { ok: false, log: 'Vite não instalado. Rode "npm install" na pasta do projeto.' });
  const r = spawnSync(process.execPath, [vite, 'build'], { cwd: root, encoding: 'utf8' });
  return (built = { ok: r.status === 0 && fs.existsSync(path.join(dist, 'index.html')), log: (r.stdout || '') + (r.stderr || '') });
}
export function pageHtml() {
  const b = buildSite(); if (!b.ok) throw new Error('Build falhou:\n' + b.log);
  return fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
}

// Código injetado antes da página: imita window.claude.use("db") com dados fictícios.
export function mockDbScript(data = seed()) {
  return `(() => {
    const store = {};
    const put = (col, arr) => arr.forEach(({ id, ...rest }) => { store[col + '/' + id] = rest; });
    put('areas', ${JSON.stringify(data.areas)}); put('collections', ${JSON.stringify(data.collections)}); put('materials', ${JSON.stringify(data.materials)});
    put('topics', ${JSON.stringify(data.topics || [])});
    put('material_topics', ${JSON.stringify((data.material_topics || []).map(l => ({ id: l.materialId + ':' + l.topicId, ...l })))});
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
    window.claude = { aortaTest: true, use: async name => name === 'db' ? { doc: docRef, collection: colRef } : null };
  })();`;
}
export const withDb = (data = seed()) => '<script>' + mockDbScript(data) + '</script>';
export const LOADING = '<script>window.claude={aortaTest:true,use:()=>new Promise(()=>{})}</script>';
export const FAILING = '<script>window.claude={aortaTest:true,use:()=>Promise.reject(new Error("banco fora do ar (teste)"))}</script>';

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.glb': 'model/gltf-binary', '.svg': 'image/svg+xml', '.json': 'application/json', '.png': 'image/png' };
/* Servidor estático do dist/; a página recebe "inject" logo depois de <head>. "block" devolve 404 para caminhos que casarem. */
export function startServer({ withDb: db = true, inject, block, port = 0 } = {}) {
  const html = pageHtml().replace('<head>', '<head>' + (inject ?? (db ? withDb() : '')));
  const server = http.createServer((req, res) => {
    const url = decodeURIComponent(req.url.split('?')[0]);
    if (url.startsWith('/favicon')) { res.writeHead(204); return res.end(); }
    if (url === '/' || url === '/index.html') { res.writeHead(200, { 'Content-Type': TYPES['.html'] }); return res.end(html); }
    if (block && block.test(url)) { res.writeHead(404); return res.end(); }
    const file = path.join(dist, url);
    if (!file.startsWith(dist) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end(); }
    const body = fs.readFileSync(file);
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Content-Length': body.length });
    res.end(body);
  });
  return new Promise(resolve => server.listen(port, '127.0.0.1', () => resolve({ server, url: `http://127.0.0.1:${server.address().port}/`, html })));
}

export function chromePath() {
  const c = [process.env.CHROME_PATH, 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'].filter(Boolean);
  const found = c.find(p => fs.existsSync(p));
  if (!found) throw new Error('Chrome não encontrado. Defina a variável CHROME_PATH.');
  return found;
}
/* Argumentos para o Chrome sem placa de vídeo desenhar WebGL (só nos testes do coração 3D). */
export const WEBGL_ARGS = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
