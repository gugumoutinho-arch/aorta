// JS carregado na primeira tela: entrada do index.html, modulepreload e imports estáticos (os dinâmicos ficam de fora).
import fs from 'node:fs';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
import { dist } from './harness.mjs';

const STATIC_IMPORT = /(?:import|export)\s*(?:[\w*{}\s,$]+?\s*from\s*)?["']([^"']+)["']/g;

export function initialBundle(distDir = dist) {
  const html = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8');
  const roots = [
    ...html.matchAll(/<script[^>]+type="module"[^>]+src="([^"]+\.js)"/g),
    ...html.matchAll(/<link[^>]+rel="modulepreload"[^>]+href="([^"]+\.js)"/g),
  ].map(m => m[1]);
  if (!roots.length) throw new Error('Nenhum script de módulo no index.html do build.');
  const files = new Set();
  const walk = file => {
    file = path.normalize(file);
    if (files.has(file)) return;
    files.add(file);
    for (const m of fs.readFileSync(file, 'utf8').matchAll(STATIC_IMPORT)) {
      if (m[1].startsWith('.')) walk(path.resolve(path.dirname(file), m[1]));
    }
  };
  roots.forEach(src => walk(path.join(distDir, src)));
  return {
    gzip: [...files].reduce((n, f) => n + gzipSync(fs.readFileSync(f)).length, 0),
    files: [...files].map(f => path.basename(f)),
  };
}
