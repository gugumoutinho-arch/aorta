// Gera a textura de grão do Aorta (src/assets/grao.png): ruído de filme determinístico, 128 × 128, em pontos claros e
// escuros quase transparentes. Fica ATRÁS do conteúdo (fundo do html), nos dois temas: no escuro dá profundidade, no claro
// vira papel. Sem dependências: PNG RGBA escrito à mão (zlib + CRC32). Uso: cd tools && node grao.mjs [--alfa=14]
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { root } from './harness.mjs';

const SIZE = 128, DENSITY = .38, ALPHA = Number(process.argv.find(a => a.startsWith('--alfa='))?.slice(7) ?? 14);
let seed = 0x5eed1e; // gerador fixo: a mesma imagem a cada execução (o build não muda à toa)
const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

const raw = Buffer.alloc((SIZE * 4 + 1) * SIZE);
for (let y = 0; y < SIZE; y++) {
  raw[y * (SIZE * 4 + 1)] = 0; // filtro "nenhum" em cada linha
  for (let x = 0; x < SIZE; x++) {
    const o = y * (SIZE * 4 + 1) + 1 + x * 4, on = rand() < DENSITY, light = rand() < .5 ? 255 : 0;
    raw[o] = raw[o + 1] = raw[o + 2] = light;
    raw[o + 3] = on ? (rand() < .5 ? ALPHA : Math.round(ALPHA / 2)) : 0; // pontos esparsos e 2 níveis: o PNG fica pequeno
  }
}
const table = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc = buf => { let c = 0xffffffff; for (const b of buf) c = table[(c ^ b) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (type, data) => {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]), sum = Buffer.alloc(4); sum.writeUInt32BE(crc(body));
  return Buffer.concat([len, body, sum]);
};
const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(SIZE, 0); ihdr.writeUInt32BE(SIZE, 4); ihdr[8] = 8; ihdr[9] = 6;
const png = Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
const out = path.join(root, 'src', 'assets', 'grao.png');
fs.mkdirSync(path.dirname(out), { recursive: true }); fs.writeFileSync(out, png);
console.log(`Grão: ${out} (${SIZE}×${SIZE}, alfa ≤ ${ALPHA}/255, ${(png.length / 1024).toFixed(1)} KB)`);
