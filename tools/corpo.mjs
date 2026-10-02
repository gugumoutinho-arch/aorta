// Prepara o conceito "corpo" (protótipo v4) a partir dos modelos do HuBMAP / Human Reference Atlas (CC BY 4.0):
//  - baixa o corpo completo (3D Reference Organ: United Male, v1.7 — pele e órgãos já posicionados) uma vez;
//  - junta as malhas por órgão (o encéfalo em telencéfalo, diencéfalo, tronco encefálico e cerebelo) e simplifica;
//  - grava public/modelos/corpo.glb, o centro de cada órgão (src/body/anatomy.json) e a silhueta frontal
//    para o mapa em linhas (src/body/silhouette.json).
// Uso (precisa de internet só na primeira vez):  node tools/corpo.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { root } from './harness.mjs';
import { parseGLB } from '../src/heart/glb.js';

const UNITED_URL = 'https://cdn.humanatlas.io/digital-objects/ref-organ/united-male/v1.7/assets/3d-vh-m-united.glb';
const cache = path.join(os.tmpdir(), 'aorta-united-male-v1.7.glb');
if (!fs.existsSync(cache)) {
  console.log('Baixando o corpo completo do HuBMAP (~150 MB, só na primeira vez)…');
  const r = await fetch(UNITED_URL); if (!r.ok) throw new Error('Download falhou: ' + r.status);
  fs.writeFileSync(cache, Buffer.from(await r.arrayBuffer()));
}
const ab = b => b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
const raw = fs.readFileSync(cache);
const united = parseGLB(ab(raw));
// Hierarquia (nomes dos nós) para juntar as malhas por órgão; o modelo já vem com tudo no lugar, no referencial do corpo.
const json = JSON.parse(new TextDecoder().decode(raw.subarray(20, 20 + raw.readUInt32LE(12))));
const byName = new Map(json.nodes.map((n, i) => [n.name, i]));
function meshesUnder(name, test = () => true) {
  const out = [], walk = i => { const n = json.nodes[i]; if (n.translation || n.rotation || n.scale || n.matrix) return; if (n.mesh !== undefined && test(n.name) && united[n.name]) out.push(united[n.name]); (n.children || []).forEach(walk); };
  if (byName.has(name)) walk(byName.get(name)); else console.warn('Sem o grupo', name);
  return out;
}

/* Agrupamento de vértices: cada célula de "cell" metros vira um vértice (média); triângulos degenerados saem. */
function cluster(meshes, cell) {
  const key = new Map(), sum = [], idx = [];
  for (const { pos, idx: tri } of meshes) {
    const local = new Int32Array(pos.length / 3);
    for (let i = 0; i < pos.length / 3; i++) {
      const x = pos[i * 3], y = pos[i * 3 + 1], z = pos[i * 3 + 2];
      const k = `${Math.floor(x / cell)},${Math.floor(y / cell)},${Math.floor(z / cell)}`;
      let id = key.get(k); if (id === undefined) { id = sum.length; key.set(k, id); sum.push([0, 0, 0, 0]); }
      const s = sum[id]; s[0] += x; s[1] += y; s[2] += z; s[3]++; local[i] = id;
    }
    for (let t = 0; t < tri.length; t += 3) {
      const a = local[tri[t]], b = local[tri[t + 1]], c = local[tri[t + 2]];
      if (a !== b && b !== c && a !== c) idx.push(a, b, c);
    }
  }
  const out = new Float32Array(sum.length * 3);
  sum.forEach((s, i) => { out[i * 3] = s[0] / s[3]; out[i * 3 + 1] = s[1] / s[3]; out[i * 3 + 2] = s[2] / s[3]; });
  return { pos: out, idx: sum.length < 65536 ? Uint16Array.from(idx) : Uint32Array.from(idx) };
}

/* Divisões clássicas do encéfalo a partir das estruturas do atlas Allen. */
const DIEN = /thalam|hypothal|HTH|habenul|pineal|zona_incerta|subthalam|geniculate|third_ventricle|mammill|optic_tract|reuniens|pulvinar|centromedian|parafascicular|midline_nuclear/i;
const TRONCO = /substantia_nigra|colliculus|red_nucleus|cerebral_peduncle|midbrain|pretectal|aqueduct|pons|pontine|medulla|olive|fourth_ventricle|central_canal/i;
const CEREB = /cerebell|vermis|hindbrain/i;
const division = n => CEREB.test(n) && !/cerebral_peduncle/i.test(n) ? 'cerebelo' : TRONCO.test(n) ? 'tronco' : DIEN.test(n) ? 'dien' : 'tel';
const GROUPS = [
  ['skin', meshesUnder('VH_M_skin'), 0.013],
  ['heart', meshesUnder('VH_M_cardiac_chamber'), 0.0045],
  ['brain_tel', meshesUnder('Allen_brain', n => division(n) === 'tel'), 0.0058],
  ['brain_dien', meshesUnder('Allen_brain', n => division(n) === 'dien'), 0.0022],
  ['brain_tronco', meshesUnder('Allen_brain', n => division(n) === 'tronco'), 0.0024],
  ['brain_cerebelo', meshesUnder('Allen_brain', n => division(n) === 'cerebelo'), 0.0045],
  ['spinal_cord', meshesUnder('VH_M_spinal_cord'), 0.004],
  ['eyes', meshesUnder('VH_M_eyes'), 0.0025],
  ['lungs', meshesUnder('VH_M_lungs'), 0.008],
  ['liver', meshesUnder('VH_M_liver'), 0.007],
  ['kidneys', meshesUnder('VH_M_kidney'), 0.006],
  ['intestine', meshesUnder('VH_M_small_intestine'), 0.009],
  ['knees', [...meshesUnder('VH_M_knee_R'), ...meshesUnder('VH_M_knee_L')], 0.011],
  ['pelvis', meshesUnder('VH_M_pelvis'), 0.009],
];
const built = GROUPS.map(([name, list, cell]) => ({ name, ...cluster(list, cell) }));
const skinMesh = built[0];
/* Centro e caixa de cada órgão: as artérias de src/body/routes.js terminam nesses pontos. */
const anatomy = {};
for (const g of built) {
  let mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < g.pos.length; i += 3) for (let k = 0; k < 3; k++) { mn[k] = Math.min(mn[k], g.pos[i + k]); mx[k] = Math.max(mx[k], g.pos[i + k]); }
  anatomy[g.name] = { center: mn.map((v, k) => +((v + mx[k]) / 2).toFixed(4)), min: mn.map(v => +v.toFixed(4)), max: mx.map(v => +v.toFixed(4)), vertices: g.pos.length / 3 };
}
fs.writeFileSync(path.join(root, 'src', 'body', 'anatomy.json'), JSON.stringify(anatomy, null, 1) + '\n');

/* GLB mínimo: dois nós ("skin" e "heart"), só posições e índices; as normais são calculadas no navegador. */
function writeGLB(meshes) {
  const views = [], accessors = [], nodes = [], gltfMeshes = []; const chunks = []; let offset = 0;
  const push = (arr, target) => { const buf = Buffer.from(arr.buffer, arr.byteOffset, arr.byteLength); const pad = (4 - (buf.length % 4)) % 4; chunks.push(buf, Buffer.alloc(pad)); views.push({ buffer: 0, byteOffset: offset, byteLength: buf.length, target }); offset += buf.length + pad; return views.length - 1; };
  meshes.forEach(({ name, pos, idx }) => {
    let mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < pos.length; i += 3) for (let k = 0; k < 3; k++) { mn[k] = Math.min(mn[k], pos[i + k]); mx[k] = Math.max(mx[k], pos[i + k]); }
    accessors.push({ bufferView: push(pos, 34962), componentType: 5126, count: pos.length / 3, type: 'VEC3', min: mn, max: mx });
    accessors.push({ bufferView: push(idx, 34963), componentType: idx instanceof Uint16Array ? 5123 : 5125, count: idx.length, type: 'SCALAR' });
    gltfMeshes.push({ name, primitives: [{ attributes: { POSITION: accessors.length - 2 }, indices: accessors.length - 1 }] });
    nodes.push({ name, mesh: gltfMeshes.length - 1 });
  });
  const json = { asset: { version: '2.0', generator: 'Aorta tools/corpo.mjs', copyright: 'HuBMAP / Human Reference Atlas (Visible Human Male, NLM), CC BY 4.0; malhas simplificadas' },
    scene: 0, scenes: [{ nodes: nodes.map((_, i) => i) }], nodes, meshes: gltfMeshes, accessors, bufferViews: views, buffers: [{ byteLength: offset }] };
  let jb = Buffer.from(JSON.stringify(json)); jb = Buffer.concat([jb, Buffer.alloc((4 - (jb.length % 4)) % 4, 0x20)]);
  const bin = Buffer.concat(chunks), head = Buffer.alloc(12); head.writeUInt32LE(0x46546c67, 0); head.writeUInt32LE(2, 4); head.writeUInt32LE(12 + 8 + jb.length + 8 + bin.length, 8);
  const jh = Buffer.alloc(8); jh.writeUInt32LE(jb.length, 0); jh.writeUInt32LE(0x4e4f534a, 4);
  const bh = Buffer.alloc(8); bh.writeUInt32LE(bin.length, 0); bh.writeUInt32LE(0x004e4942, 4);
  return Buffer.concat([head, jh, jb, bh, bin]);
}
const glbOut = path.join(root, 'public', 'modelos', 'corpo.glb');
fs.writeFileSync(glbOut, writeGLB(built));

/* Silhueta frontal: projeta os triângulos da pele em (x, y), pinta uma grade e contorna a borda externa. */
const CELL = 0.004, X0 = -0.56, Y0 = -0.95, W = Math.ceil(1.12 / CELL), H = Math.ceil(1.9 / CELL);
const grid = new Uint8Array(W * H), { pos: sp, idx: si } = skinMesh;
const gx = x => (x - X0) / CELL, gy = y => (y - Y0) / CELL;
for (let t = 0; t < si.length; t += 3) {
  const P = [0, 1, 2].map(k => [gx(sp[si[t + k] * 3]), gy(sp[si[t + k] * 3 + 1])]);
  const minX = Math.max(0, Math.floor(Math.min(...P.map(p => p[0])))), maxX = Math.min(W - 1, Math.ceil(Math.max(...P.map(p => p[0]))));
  const minY = Math.max(0, Math.floor(Math.min(...P.map(p => p[1])))), maxY = Math.min(H - 1, Math.ceil(Math.max(...P.map(p => p[1]))));
  const [[ax, ay], [bx, by], [cx, cy]] = P, area = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
  for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) {
    const px = x + .5, py = y + .5;
    const w0 = (bx - px) * (cy - py) - (by - py) * (cx - px), w1 = (cx - px) * (ay - py) - (cy - py) * (ax - px), w2 = (ax - px) * (by - py) - (ay - py) * (bx - px);
    if (area === 0) continue;
    if ((w0 >= 0 && w1 >= 0 && w2 >= 0) || (w0 <= 0 && w1 <= 0 && w2 <= 0)) grid[y * W + x] = 1;
  }
}
// Contorno externo (vizinhança de Moore): começa no primeiro pixel cheio da linha mais alta e anda pela borda.
const at = (x, y) => x >= 0 && y >= 0 && x < W && y < H && grid[y * W + x] === 1;
let start = null; for (let y = H - 1; y >= 0 && !start; y--) for (let x = 0; x < W; x++) if (at(x, y)) { start = [x, y]; break; }
const DIRS = [[-1, 0], [-1, 1], [0, 1], [1, 1], [1, 0], [1, -1], [0, -1], [-1, -1]]; // ordem cíclica (horária com y para cima)
const dirOf = (from, to) => DIRS.findIndex(([dx, dy]) => from[0] + dx === to[0] && from[1] + dy === to[1]);
const contour = [start]; let p = start, back = [start[0] - 1, start[1]], guard = 0;
while (guard++ < 400000) {
  const b0 = dirOf(p, back); let next = null, nb = null;
  for (let k = 1; k <= 8; k++) { const d = (b0 + k) % 8, c = [p[0] + DIRS[d][0], p[1] + DIRS[d][1]]; if (at(c[0], c[1])) { next = c; const pd = (d + 7) % 8; nb = [p[0] + DIRS[pd][0], p[1] + DIRS[pd][1]]; break; } }
  if (!next) break;
  back = nb; p = next;
  if (p[0] === start[0] && p[1] === start[1]) break;
  contour.push(p);
}
// Douglas–Peucker para um traço limpo.
function simplify(pts, eps) {
  if (pts.length < 3) return pts;
  const [a, b] = [pts[0], pts.at(-1)]; let best = 0, at2 = 0;
  for (let i = 1; i < pts.length - 1; i++) { const p = pts[i], num = Math.abs((b[1] - a[1]) * p[0] - (b[0] - a[0]) * p[1] + b[0] * a[1] - b[1] * a[0]), den = Math.hypot(b[1] - a[1], b[0] - a[0]) || 1, d = num / den; if (d > best) { best = d; at2 = i; } }
  return best > eps ? [...simplify(pts.slice(0, at2 + 1), eps).slice(0, -1), ...simplify(pts.slice(at2), eps)] : [a, b];
}
const outline = simplify(contour, 1.2).map(([x, y]) => [+(X0 + x * CELL).toFixed(4), +(Y0 + y * CELL).toFixed(4)]);
fs.writeFileSync(path.join(root, 'src', 'body', 'silhouette.json'), JSON.stringify({ outline }) + '\n');
console.log(`corpo.glb: ${(fs.statSync(glbOut).size / 1024).toFixed(0)} kB; ` + built.map(g => `${g.name} ${g.pos.length / 3}`).join(', ') + `; silhueta com ${outline.length} pontos.`);
for (const [k, v] of Object.entries(anatomy)) console.log(k.padEnd(15), 'centro', v.center.join(', '), ' min', v.min.join(', '), ' max', v.max.join(', '));
