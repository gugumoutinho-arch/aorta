// Pré-calcula o traçado das artérias sobre o modelo 3D e grava src/heart/arteries.json.
// Rode de novo só quando mudar um caminho em src/core/arteries.js ou o modelo:  node tools/arterias.mjs
import fs from 'node:fs';
import path from 'node:path';
import { Mesh, MeshBasicMaterial, Group } from 'three';
import { root } from './harness.mjs';
import { parseGLB } from '../src/heart/glb.js';
import { ATRIA, VENTRICLES, chamberGeometry, traceArtery } from '../src/heart/geometry.js';
import { ARTERIES, pathKey } from '../src/core/arteries.js';

const file = path.join(root, 'public', 'modelos', 'heart-hra-v1.3.glb');
const bytes = fs.readFileSync(file);
const glb = parseGLB(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
const heart = new Group(), material = new MeshBasicMaterial();
const surfaces = [...ATRIA, ...VENTRICLES].filter(n => glb[n]).map(n => { const { geometry, center } = chamberGeometry(glb[n]); const m = new Mesh(geometry, material); m.position.copy(center); heart.add(m); return m; });
heart.updateMatrixWorld(true);
const out = {};
for (const { art, path: p } of ARTERIES) {
  const pts = await traceArtery(p, surfaces);
  out[pathKey(p)] = pts.map(v => [+v.x.toFixed(4), +v.y.toFixed(4), +v.z.toFixed(4)]);
  console.log(`${art}: ${pts.length} pontos`);
}
fs.writeFileSync(path.join(root, 'src', 'heart', 'arteries.json'), JSON.stringify(out) + '\n');
console.log('Gravado src/heart/arteries.json');
