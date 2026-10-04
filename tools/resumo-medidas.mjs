// Resume várias execuções de medir-v5.mjs (--fase=<prefixo>-1 … -N): mediana e pior caso da maior tarefa, p95 do
// quadro e CLS, por acervo e etapa (entrada, troca de acervo, mergulho).
// Uso: cd tools && node resumo-medidas.mjs <prefixo> [pasta]   (pasta padrão: reports/v5)
import fs from 'node:fs';
import path from 'node:path';
import { reports } from './harness.mjs';

const [prefix, dir = path.join(reports, 'v5')] = process.argv.slice(2);
if (!prefix) { console.error('Uso: node resumo-medidas.mjs <prefixo> [pasta]'); process.exit(1); }
const runs = fs.readdirSync(dir).filter(f => new RegExp(`^${prefix}-\\d+\\.json$`).test(f)).map(f => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')));
const median = xs => { const s = [...xs].sort((a, b) => a - b); const m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const out = { prefixo: prefix, execucoes: runs.length, commit: [...new Set(runs.map(r => r.commit))].join(','), cpu: runs[0]?.cpu, renderer: runs[0]?.renderer, acervos: {} };
for (const acervo of ['idomed', 'geral']) {
  const ms = runs.map(r => r.metrics.find(m => m.acervo === acervo)).filter(Boolean), a = out.acervos[acervo] = { cls: { mediana: +median(ms.map(m => m.cls)).toFixed(4), pior: +Math.max(...ms.map(m => m.cls)).toFixed(4) } };
  for (const stage of ['entrance', 'switch', 'dive']) {
    const st = ms.map(m => m[stage]);
    a[stage] = { maiorTarefaMediana: Math.round(median(st.map(s => s.maximumTask))), maiorTarefaPior: Math.round(Math.max(...st.map(s => s.maximumTask))),
      p95Mediana: +median(st.map(s => s.p95Frame)).toFixed(1), tarefasLongasMediana: median(st.map(s => s.longTasks)) };
  }
}
console.log(JSON.stringify(out, null, 1));
