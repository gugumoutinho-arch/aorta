// Prancha: junta várias capturas numa ÚNICA imagem em grade, com o nome de cada uma embaixo. Olhar 1 prancha custa
// muito menos (para quem revisa com IA) do que abrir 8 imagens soltas. Sem dependências novas: monta a grade numa página
// e fotografa com o Chromium dos testes.
// Uso: cd tools && node prancha.mjs --saida=reports/ui/prancha.png [--colunas=4] [--largura=1600] arq1.png arq2.png …
//   (ou --dir=<pasta> --so=ficha,busca para pegar, na pasta, os arquivos cujo nome começa por esses prefixos)
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';
import { chromePath, here } from './harness.mjs';

const arg = (k, d) => process.argv.find(a => a.startsWith(`--${k}=`))?.slice(k.length + 3) ?? d;
const dir = arg('dir', ''), prefixes = arg('so', '').split(',').filter(Boolean);
let files = process.argv.slice(2).filter(a => !a.startsWith('--')).map(f => path.resolve(here, f));
if (dir) files = fs.readdirSync(path.resolve(here, dir)).filter(f => f.endsWith('.png') && (!prefixes.length || prefixes.some(p => f.startsWith(p)))).sort().map(f => path.resolve(here, dir, f));
if (!files.length) { console.error('Nenhuma imagem. Passe arquivos ou --dir.'); process.exit(1); }
const out = path.resolve(here, arg('saida', 'reports/ui/prancha.png'));
const width = Number(arg('largura', '1600'));
// Celular (estreitas) em 4 colunas; computador em 2.
const narrow = files.every(f => /@(3\d\d|4\d\d)-/.test(path.basename(f)));
const cols = Number(arg('colunas', narrow ? '4' : '2'));
const cells = files.map(f => `<figure><img src="data:image/png;base64,${fs.readFileSync(f).toString('base64')}"><figcaption>${path.basename(f)}</figcaption></figure>`).join('');
const html = `<!doctype html><meta charset="utf-8"><style>
body{margin:0;padding:8px;background:#777;font:12px system-ui,sans-serif;width:${width - 16}px}
main{display:grid;grid-template-columns:repeat(${cols},1fr);gap:8px}
figure{margin:0;background:#fff}img{display:block;width:100%;height:auto}
figcaption{padding:2px 6px;color:#222}</style><main>${cells}</main>`;
const browser = await chromium.launch({ executablePath: chromePath(), headless: true });
try {
  const p = await browser.newPage({ viewport: { width, height: 800 } });
  await p.setContent(html, { waitUntil: 'load' });
  fs.mkdirSync(path.dirname(out), { recursive: true });
  await p.screenshot({ path: out, fullPage: true });
} finally { await browser.close(); }
console.log(`Prancha: ${out} (${files.length} capturas, ${cols} colunas, ${width}px)`);
