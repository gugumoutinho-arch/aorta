// Monta o site próprio a partir do index.html (que é um fragmento, no formato do claude.ai):
// envolve o fragmento num documento HTML completo e grava em _site/index.html para o GitHub Pages.
// Uso: node tools/build-pages.mjs
import fs from 'node:fs';
import path from 'node:path';
import { pageHtml, here } from './harness.mjs';

const html = pageHtml();
const out = path.resolve(here, '..', '_site');
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, 'index.html'), html);
fs.writeFileSync(path.join(out, '.nojekyll'), '');
console.log('Site montado em _site/index.html (' + html.length + ' bytes).');
