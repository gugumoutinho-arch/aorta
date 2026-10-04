// U9 · Contraste AA (4,5:1) das cores de módulo --m1…--m8 sobre --bg, --paper e --surface, nos dois temas,
// medido direto do tokens.css (as cores de módulo aparecem como texto: "ART. 01", numeral, tipo do material).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const css = fs.readFileSync(new URL('../../src/styles/tokens.css', import.meta.url), 'utf8');
const block = sel => { const i = css.indexOf(sel); assert.ok(i >= 0, sel); const s = css.indexOf('{', i); let d = 0, j = s; for (; j < css.length; j++) { if (css[j] === '{') d++; else if (css[j] === '}' && --d === 0) break; } return css.slice(s, j); };
const vars = text => Object.fromEntries([...text.matchAll(/--([a-z0-9-]+):\s*(#[0-9a-f]{6})\b/gi)].map(m => [m[1], m[2]]));
const lum = hex => { const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(c => c <= .03928 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4); return .2126 * r + .7152 * g + .0722 * b; };
export const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + .05) / (y + .05); };

const dark = vars(block(':root'));
const light = { ...dark, ...vars(block('[data-theme="light"]')) };

for (const [name, theme] of [['escuro', dark], ['claro', light]]) {
  test(`tema ${name}: --m1…--m8 com contraste ≥ 4,5:1 sobre --bg, --paper e --surface`, () => {
    const fails = [];
    for (let i = 1; i <= 8; i++) for (const bg of ['bg', 'paper', 'surface']) {
      const r = ratio(theme['m' + i], theme[bg]);
      if (r < 4.5) fails.push(`--m${i} ${theme['m' + i]} sobre --${bg} ${theme[bg]}: ${r.toFixed(2)}`);
    }
    assert.deepEqual(fails, []);
  });
}
