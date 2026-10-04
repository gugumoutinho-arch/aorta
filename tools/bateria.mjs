// Bateria em UMA linha por suíte (economiza leitura de saída): roda as suítes em sequência — todas reconstroem o mesmo
// dist/, nunca em paralelo — e imprime só o resumo e, se falhar, as 3 primeiras linhas de erro.
// Uso: cd tools && node bateria.mjs [--so=test,check,flows,acervos,topics,topic-edit,import] [--orcamento] [--lh[=5]]
// Saída 1 se qualquer suíte falhar. --orcamento = ORCAMENTO_ESTRITO=1; --lh = Lighthouse IDOMED, mediana de N (padrão 5).
import { spawnSync } from 'node:child_process';
import { here } from './harness.mjs';

const arg = k => process.argv.find(a => a === `--${k}` || a.startsWith(`--${k}=`));
const val = (k, d) => arg(k)?.split('=')[1] ?? d;
const ALL = ['test', 'check', 'flows', 'acervos', 'topics', 'topic-edit', 'import'];
const only = val('so', '').split(',').filter(Boolean);
const suites = only.length ? ALL.filter(s => only.includes(s)) : ALL;
const run = (args, env = {}) => {
  const r = spawnSync(process.execPath, args, { cwd: here, encoding: 'utf8', env: { ...process.env, ...env }, maxBuffer: 64 * 1024 * 1024 });
  return { code: r.status, out: (r.stdout || '') + (r.stderr || '') };
};
const errors = out => out.split(/\r?\n/).filter(l => /FALHA|AssertionError|Error:|erro\(s\)[^0]*[1-9]|✖|not ok/.test(l)).slice(0, 3);
const summary = {
  test: o => { const p = o.match(/ℹ pass (\d+)/)?.[1], f = o.match(/ℹ fail (\d+)/)?.[1]; return p ? `${p} passaram, ${f} falharam` : null; },
  check: o => o.match(/(\d+) erro\(s\), (\d+) aviso\(s\)/)?.[0],
  flows: o => o.match(/(\d+) de (\d+) verificações aprovadas, (\d+) falha\(s\)/)?.[0],
};
let failed = 0;
for (const s of suites) {
  const t = Date.now();
  const r = s === 'test' ? run(['--test', 'tests/*.test.mjs']) : run([`${s}.mjs`]);
  const line = (summary[s] || (o => o.match(/(\d+) verificações aprovadas/)?.[0]))(r.out) || '(sem resumo)';
  const ok = r.code === 0;
  if (!ok) failed++;
  console.log(`${ok ? 'OK   ' : 'FALHA'} ${s.padEnd(10)} ${line}  (${Math.round((Date.now() - t) / 1000)} s)`);
  if (!ok) for (const l of errors(r.out)) console.log('        ' + l.trim().slice(0, 200));
}
if (arg('orcamento')) {
  const r = run(['orcamento.mjs'], { ORCAMENTO_ESTRITO: '1' });
  const growth = r.out.match(/"growth":\s*(\d+)/)?.[1], fails = r.out.match(/"failures":\s*\[([^\]]*)\]/)?.[1]?.trim();
  if (r.code !== 0) failed++;
  console.log(`${r.code === 0 ? 'OK   ' : 'FALHA'} orcamento  estrito; JS inicial +${growth ?? '?'} B sobre o baseline${fails ? '; falhas: ' + fails.slice(0, 200) : ''}`);
}
if (arg('lh')) {
  const r = run(['lighthouse.mjs'], { LH_ACERVOS: 'idomed', LH_RUNS: val('lh', '5') });
  if (r.code !== 0) failed++;
  for (const l of r.out.split(/\r?\n/).filter(l => /^idomed/.test(l))) console.log(`${r.code === 0 ? 'OK   ' : 'FALHA'} lighthouse ${l.replace(/\s+/g, ' ').replace(/ \| SEO \d+/, '')}`);
}
console.log(failed ? `\n${failed} suíte(s) com falha.` : '\nTudo verde.');
process.exit(failed ? 1 : 0);
