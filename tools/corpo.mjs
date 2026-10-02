// Prepara o conceito "corpo" (protótipo v4) a partir dos modelos do HuBMAP / Human Reference Atlas (CC BY 4.0):
//  - baixa a pele do corpo inteiro (3D Reference Organ: Skin, Male, v1.3) e usa o coração já no projeto;
//  - simplifica as malhas por agrupamento de vértices (de ~6 MB para algumas centenas de kB);
//  - põe o coração no peito, no referencial do corpo (src/body/routes.js: HEART_POS);
//  - grava public/modelos/corpo.glb e a silhueta frontal para o mapa em linhas (src/body/silhouette.json).
// Uso (precisa de internet só na primeira vez):  node tools/corpo.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { root } from './harness.mjs';
import { parseGLB } from '../src/heart/glb.js';
import { HEART_POS } from '../src/body/routes.js';

const SKIN_URL = 'https://cdn.humanatlas.io/digital-objects/ref-organ/skin-male/v1.3/assets/3d-vh-m-skin.glb';
const cache = path.join(os.tmpdir(), 'aorta-skin-v1.3.glb');
if (!fs.existsSync(cache)) {
  console.log('Baixando a pele do HuBMAP…');
  const r = await fetch(SKIN_URL); if (!r.ok) throw new Error('Download falhou: ' + r.status);
  fs.writeFileSync(cache, Buffer.from(await r.arrayBuffer()));
}
const ab = b => b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
const skin = parseGLB(ab(fs.readFileSync(cache)));
const heartGlb = parseGLB(ab(fs.readFileSync(path.join(root, 'public', 'modelos', 'heart-hra-v1.3.glb'))));

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

const skinMesh = cluster(Object.values(skin), 0.011);
// Coração: câmaras e valvas, recentradas no próprio modelo e levadas ao peito (escala real, em metros).
const HC = [.0187, .4761, .0376];
const chambers = ['VH_M_left_cardiac_atrium', 'VH_M_right_cardiac_atrium', 'VH_M_heart_left_ventricle', 'VH_M_heart_right_ventricle', 'VH_M_interventricular_septum']
  .filter(n => heartGlb[n]).map(n => { const d = heartGlb[n], p = d.pos.slice(); for (let i = 0; i < p.length; i += 3) { p[i] += HEART_POS[0] - HC[0]; p[i + 1] += HEART_POS[1] - HC[1]; p[i + 2] += HEART_POS[2] - HC[2]; } return { pos: p, idx: d.idx }; });
const heartMesh = cluster(chambers, 0.0045);

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
fs.writeFileSync(glbOut, writeGLB([{ name: 'skin', ...skinMesh }, { name: 'heart', ...heartMesh }]));

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
console.log(`corpo.glb: ${(fs.statSync(glbOut).size / 1024).toFixed(0)} kB (pele ${skinMesh.pos.length / 3} vértices, coração ${heartMesh.pos.length / 3}); silhueta com ${outline.length} pontos.`);
