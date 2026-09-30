// Monta o site próprio a partir do index.html (que é um fragmento, no formato do claude.ai):
// envolve o fragmento num documento HTML completo e grava em _site/index.html para o GitHub Pages.
// Uso: node tools/build-pages.mjs
import fs from 'node:fs';
import path from 'node:path';
import { readSite, here } from './harness.mjs';

const src = readSite();
const title = (src.match(/<title>[\s\S]*?<\/title>/) || ['<title>Biblioteca de Medicina</title>'])[0];
const body = src.replace(title, '').trimStart();
const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="color-scheme" content="light dark">
<meta name="theme-color" media="(prefers-color-scheme: light)" content="#f4f3ef">
<meta name="theme-color" media="(prefers-color-scheme: dark)" content="#121314">
<meta name="robots" content="noindex, nofollow">
<meta name="description" content="Biblioteca pessoal de materiais de medicina.">
${title}
</head>
<body>
${body}
</body>
</html>
`;
const out = path.resolve(here, '..', '_site');
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, 'index.html'), html);
fs.writeFileSync(path.join(out, '.nojekyll'), '');
console.log('Site montado em _site/index.html (' + html.length + ' bytes).');
