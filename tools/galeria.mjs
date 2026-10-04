// Galeria pública antes|depois (docs/ui/): copia pares de capturas e escreve docs/ui/index.html lado a lado.
// Uso: cd tools && node galeria.mjs   (lê docs/ui/pares.json: [{ "titulo", "antes": "<fase>/<arquivo>", "depois": "<fase>/<arquivo>" }])
// Limites do prompt: no máximo 40 PNG e 10 MB no total. Revise cada imagem antes do commit (sem e-mail, URL real do
// Drive, token ou dado de aluno: as capturas usam só os dados fictícios de tools/seed-v4.json).
import fs from 'node:fs';
import path from 'node:path';
import { reports, root } from './harness.mjs';

const dir = path.join(root, 'docs', 'ui'), pairs = JSON.parse(fs.readFileSync(path.join(dir, 'pares.json'), 'utf8'));
const arg = (k, d) => process.argv.find(a => a.startsWith('--' + k + '='))?.slice(k.length + 3) ?? d;
const title = arg('titulo', 'rodada B (interface e movimento)'), intro = arg('nota', 'Pares antes|depois a 390 e 1440 px, com os dados fictícios dos testes. Capturas estáticas não mostram o movimento; ele está nos vídeos (artefato separado) e nas medidas em docs/ui-progresso.md');
for (const f of fs.readdirSync(dir)) if (f.endsWith('.png')) fs.rmSync(path.join(dir, f));
const name = rel => rel.replace(/[\\/]/g, '-');
let bytes = 0, count = 0;
for (const p of pairs) for (const rel of [p.antes, p.depois]) {
  const from = path.join(reports, 'ui', rel), to = path.join(dir, name(rel));
  if (!fs.existsSync(from)) throw new Error('Captura não encontrada: ' + rel);
  fs.copyFileSync(from, to); bytes += fs.statSync(to).size; count++;
}
if (count > 40 || bytes > 10 * 1024 * 1024) throw new Error(`Galeria acima do limite: ${count} PNG, ${(bytes / 1048576).toFixed(1)} MB (máx. 40 e 10 MB)`);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const rows = pairs.map(p => `<section><h2>${esc(p.titulo)}</h2><div class="pair">
<figure><img src="${name(p.antes)}" alt="Antes: ${esc(p.titulo)}" loading="lazy"><figcaption>Antes · ${esc(p.antes)}</figcaption></figure>
<figure><img src="${name(p.depois)}" alt="Depois: ${esc(p.titulo)}" loading="lazy"><figcaption>Depois · ${esc(p.depois)}</figcaption></figure></div></section>`).join('\n');
fs.writeFileSync(path.join(dir, 'index.html'), `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>Aorta · ${esc(title)} · antes e depois</title>
<style>
:root { color-scheme: dark light; --bg: Canvas; --text: CanvasText; --line: GrayText; }
body { margin: 0; padding: 24px 16px 64px; background: var(--bg); color: var(--text); font: 15px/1.5 system-ui, sans-serif; }
h1 { font-size: 24px; margin: 0 0 4px; } h2 { font-size: 16px; margin: 32px 0 8px; } p { margin: 0 0 16px; max-width: 70ch; }
.pair { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 320px), 1fr)); gap: 12px; align-items: start; }
figure { margin: 0; } img { display: block; width: 100%; height: auto; border: 1px solid var(--line); }
figcaption { font-size: 12px; opacity: .75; margin-top: 4px; overflow-wrap: anywhere; }
</style></head><body>
<h1>Aorta · ${esc(title)}</h1>
<p>${esc(intro)}</p>
${rows}
</body></html>
`);
console.log(`Galeria: ${count} PNG, ${(bytes / 1048576).toFixed(2)} MB → docs/ui/index.html`);
