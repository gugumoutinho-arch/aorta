// Cálculos e limites compartilhados pelas medições (orcamento, medir-v5, lighthouse).
import fs from 'node:fs';
import path from 'node:path';
import { reports } from './harness.mjs';

/* Limites que reprovam. Desempenho sobe para 90/95 na F4; SEO fica de fora (noindex intencional). */
export const LH_LIMITS = {
  mobile: { performance: 85, accessibility: 100, 'best-practices': 100 },
  desktop: { performance: 90, accessibility: 100, 'best-practices': 100 },
};
const LH_NAMES = { performance: 'desempenho', accessibility: 'acessibilidade', 'best-practices': 'boas práticas' };

export function lighthouseFailures(mode, scores) {
  return Object.entries(LH_LIMITS[mode])
    .filter(([k, min]) => !(scores[k] >= min))
    .map(([k, min]) => `${mode} ${LH_NAMES[k]} ${scores[k]} < ${min}`);
}

/* CLS como o navegador calcula: janelas de sessão (nova após 1 s sem deslocamento, no máximo 5 s); vale a maior. */
export function sessionCls(shifts) {
  let cls = 0, sum = 0, first = 0, prev = -Infinity;
  for (const s of shifts) {
    if (s.at - prev > 1000 || s.at - first > 5000) { sum = 0; first = s.at; }
    sum += s.value; cls = Math.max(cls, sum); prev = s.at;
  }
  return cls;
}

export function median(values) {
  const s = [...values].sort((a, b) => a - b), mid = s.length >> 1;
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/* Nota de cada categoria pela mediana das execuções (o Lighthouse varia alguns pontos entre execuções). */
export const medianScores = runs => Object.fromEntries(Object.keys(runs[0]).map(k => [k, median(runs.map(r => r[k]))]));

export function p95(values) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.ceil(sorted.length * .95) - 1];
}

/* Sempre em tools/reports/v5, de qualquer diretório em que o script rode. */
export const v5ReportsDir = () => path.join(reports, 'v5');

/* O baseline é evidência histórica: só nasce com pedido explícito e nunca é sobrescrito. */
export function assertBaselineWritable(file, argv) {
  if (!argv.includes('--gravar-baseline')) throw new Error('Gravar baseline exige --gravar-baseline.');
  if (fs.existsSync(file)) throw new Error(`${path.basename(file)} é imutável; meça com outro nome de fase.`);
}
