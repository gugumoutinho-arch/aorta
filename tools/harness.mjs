// Base dos testes: monta o site com o Vite (dist/) e o serve localmente, com um banco fictício injetado.
// O banco fictício imita window.claude.use("db"); nenhum teste toca no Supabase.
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { COLS, KEYS, RULES } from '../src/core/schema.js';
import { TOPIC_FROM, TOPIC_TO } from '../src/domain/topics.js';

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

// Código injetado antes da página: imita window.claude.use("db") com dados fictícios, com as MESMAS regras do banco
// (src/core/schema.js): só as colunas do esquema são gravadas, normalized_name é gerado, únicos e chaves estrangeiras
// recusam como o Postgres (códigos 23505 e 23503), apagar material apaga as ligações e assunto ligado não se apaga.
// persist: o banco sobrevive a recarregar a página e é compartilhado pelas abas do MESMO contexto do navegador
// (localStorage + evento "storage", para testar dois clientes); outro contexto começa do zero.
// Ganchos de teste na página: window.__mockDelay (ms antes de cada gravação), window.__mockFail (prefixo de caminho cuja
// próxima gravação falha ANTES de gravar) e window.__mockFailAfter (grava e depois falha: resposta incerta).
export function mockDbScript(data = seed(), { persist = false } = {}) {
  const schema = { cols: COLS, keys: KEYS, rules: RULES, from: TOPIC_FROM, to: TOPIC_TO };
  const links = (data.material_topics || []).map(l => ({ id: encodeURIComponent(l.materialId) + ':' + encodeURIComponent(l.topicId), ...l }));
  return `(() => {
    const SC = ${JSON.stringify(schema)}, KEY = 'aorta-mock-db', persist = ${persist};
    const MAP = new Map([...SC.from].map((c, i) => [c, SC.to[i]]));
    const norm = v => [...String(v ?? '').toLowerCase()].map(c => MAP.get(c) ?? c).join('').replace(/\\s+/g, ' ').trim();
    const copy = d => JSON.parse(JSON.stringify(d));
    let store = {};
    const put = (col, arr) => arr.forEach(({ id, ...rest }) => { store[col + '/' + id] = generate(col, rest); });
    const generate = (col, d) => { const g = SC.rules.generated[col] || {}; const o = { ...d }; for (const [k, from] of Object.entries(g)) o[k] = norm(o[from]); return o; };
    put('areas', ${JSON.stringify(data.areas)}); put('collections', ${JSON.stringify(data.collections)}); put('materials', ${JSON.stringify(data.materials)});
    put('topics', ${JSON.stringify(data.topics || [])}); put('material_topics', ${JSON.stringify(links)}); put('material_drafts', ${JSON.stringify(data.material_drafts || [])});
    if (persist) { try { const saved = localStorage.getItem(KEY); if (saved) store = JSON.parse(saved); else localStorage.setItem(KEY, JSON.stringify(store)); } catch (_) {} }
    const save = () => { if (persist) localStorage.setItem(KEY, JSON.stringify(store)); };
    // Com persistência, o localStorage do contexto é a fonte única (como um banco compartilhado): toda operação relê.
    const load = () => { if (persist) { try { const saved = localStorage.getItem(KEY); if (saved) store = JSON.parse(saved); } catch (_) {} } };
    const split = p => { const i = p.indexOf('/'); return [p.slice(0, i), p.slice(i + 1)]; };
    const rows = col => Object.entries(store).filter(([p]) => split(p)[0] === col).map(([p, d]) => [split(p)[1], d]);
    const fail = (code, message) => { throw { code, message }; };
    /* Só as colunas do esquema (como rowOut no adaptador) e a coluna gerada recalculada. */
    const clean = (col, d) => { const cols = SC.cols[col]; if (!cols) return copy(d); const o = {}; for (const k of cols) if (k in d) o[k] = d[k]; return copy(o); };
    function enforce(col, id, d) {
      for (const cols of SC.rules.unique[col] || []) {
        const part = SC.rules.partial[col], counts = x => !part || (x[part.notEmpty] && x.status !== part.notStatus);
        if (!counts(d)) continue;
        if (rows(col).some(([k, x]) => k !== id && counts(x) && cols.every(c => x[c] === d[c]))) fail('23505', 'duplicate key value violates unique constraint (' + col + ': ' + cols.join(', ') + ')');
      }
      for (const [field, table] of Object.entries(SC.rules.references[col] || {}))
        if (!store[table + '/' + d[field]]) fail('23503', 'insert or update violates foreign key constraint (' + col + '.' + field + ')');
    }
    const gate = async (p, after) => {
      if (!after && window.__mockDelay) await new Promise(r => setTimeout(r, window.__mockDelay));
      const k = after ? '__mockFailAfter' : '__mockFail';
      if (window[k] && p.startsWith(window[k])) { window[k] = null; fail('test', 'falha de teste' + (after ? ' depois de gravar' : '')); }
    };
    const subs = []; const emit = () => setTimeout(() => subs.forEach(f => f()), 0);
    // Ids como no Supabase (UUID): dois clientes nunca geram o mesmo, nem no mesmo milissegundo.
    const newId = () => globalThis.crypto?.randomUUID?.() || 't' + Date.now().toString(36) + Math.random().toString(36).slice(2);
    if (persist) addEventListener('storage', e => { if (e.key === KEY && e.newValue) { store = JSON.parse(e.newValue); emit(); } });
    const docOf = (p, d) => ({ id: split(p)[1], exists: !!d, data: () => d && copy(d), metadata: {} });
    const snap = col => { load(); const docs = rows(col).map(([id, d]) => docOf(col + '/' + id, d)); return { docs, size: docs.length, empty: !docs.length, docChanges: () => [], metadata: {} }; };
    async function write(p, d, mode) {
      await gate(p);
      load();
      const [col, id] = split(p);
      if (SC.keys[col] && mode === 'update') throw new Error('Uma ligação não se altera: apague e crie outra.');
      if (mode === 'update' && !store[p]) fail('invalid_argument', 'missing');
      if (store[p] && (mode === 'create' || SC.keys[col])) { await gate(p, true); return; } // já existe: nada muda
      // set = upsert do Postgres: numa linha que já existe, só as colunas enviadas mudam (as outras ficam).
      const next = generate(col, store[p] ? { ...store[p], ...clean(col, d) } : clean(col, d));
      enforce(col, id, next);
      store[p] = next; save(); emit();
      await gate(p, true);
    }
    const docRef = p => ({ id: split(p)[1], path: p,
      async get() { load(); return docOf(p, store[p]); },
      set: d => write(p, d, 'set'), create: d => write(p, d, 'create'), update: d => write(p, d, 'update'),
      async delete() {
        await gate(p);
        load();
        const [col, id] = split(p), cascade = SC.rules.cascade[col], restrict = SC.rules.restrict[col];
        const ref = r => k => split(k)[0] === r.table && store[k][r.field] === id;
        if (restrict && Object.keys(store).some(ref(restrict))) fail('23503', 'update or delete violates foreign key constraint (restrict)');
        if (cascade) Object.keys(store).filter(ref(cascade)).forEach(k => { delete store[k]; });
        delete store[p]; save(); emit();
        await gate(p, true); } });
    const colRef = c => ({ path: c, doc: id => docRef(c + '/' + (id || newId())),
      async list() { return snap(c).docs; },
      onSnapshot(next) { const f = () => next(snap(c)); subs.push(f); setTimeout(f, 30); return () => {}; } });
    window.claude = { aortaTest: true, use: async name => name === 'db' ? { doc: docRef, collection: colRef } : null };
  })();`;
}
export const withDb = (data = seed(), opts) => '<script>' + mockDbScript(data, opts) + '</script>';
/* Guarda injetada em TODA página de teste: nenhuma rede para *.supabase.co. A tentativa é recusada, fica registrada em
   window.__supabaseBlocked e vira erro de console (que reprova as suítes que conferem o console). */
export const SUPABASE_GUARD = `<script>(() => {
  const banned = u => { try { return /(^|\\.)supabase\\.co$/i.test(new URL(String(u), location.href).hostname); } catch (_) { return false; } };
  const log = window.__supabaseBlocked = [];
  const stop = (kind, u) => { log.push(kind + ' ' + u); console.error('Teste bloqueou rede para o Supabase: ' + kind + ' ' + u); return new Error('rede para o Supabase bloqueada no teste'); };
  const f = window.fetch; window.fetch = (u, o) => banned(u && u.url || u) ? Promise.reject(stop('fetch', u && u.url || u)) : f.call(window, u, o);
  const open = XMLHttpRequest.prototype.open; XMLHttpRequest.prototype.open = function (m, u, ...r) { if (banned(u)) throw stop('xhr', u); return open.call(this, m, u, ...r); };
  const WS = window.WebSocket; window.WebSocket = function (u, p) { if (banned(u)) throw stop('websocket', u); return new WS(u, p); }; window.WebSocket.prototype = WS.prototype;
  const beacon = navigator.sendBeacon && navigator.sendBeacon.bind(navigator); if (beacon) navigator.sendBeacon = (u, d) => banned(u) ? (stop('beacon', u), false) : beacon(u, d);
})();</script>`;
export const LOADING = '<script>window.claude={aortaTest:true,use:()=>new Promise(()=>{})}</script>';
export const FAILING = '<script>window.claude={aortaTest:true,use:()=>Promise.reject(new Error("banco fora do ar (teste)"))}</script>';

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.glb': 'model/gltf-binary', '.svg': 'image/svg+xml', '.json': 'application/json', '.png': 'image/png' };
/* Servidor estático do dist/; a página recebe "inject" logo depois de <head>. "block" devolve 404 para caminhos que casarem. */
export function startServer({ withDb: db = true, inject, block, port = 0 } = {}) {
  const html = pageHtml().replace('<head>', '<head>' + SUPABASE_GUARD + (inject ?? (db ? withDb() : '')));
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
