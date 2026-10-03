// Nota de desempenho, acessibilidade e boas práticas (Lighthouse) em celular e computador, nos dois acervos.
// Nota = mediana de LH_RUNS execuções (padrão 3); reprova (saída 1) abaixo dos limites de gates.mjs. Uso:  cd tools && npm run lighthouse   (LH_ACERVOS=idomed para um só)
// Observação: a página de teste usa dados fictícios e carrega as fontes do Google Fonts (precisa de internet).
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import lighthouse from 'lighthouse';
import { reports, startServer, chromePath, withDb } from './harness.mjs';
import { lighthouseFailures, medianScores } from './gates.mjs';

fs.mkdirSync(reports, { recursive: true });
const seed = JSON.parse(fs.readFileSync(new URL('./seed-v4.json', import.meta.url), 'utf8'));
const { server, url } = await startServer({ inject: withDb(seed) });
const acervos = (process.env.LH_ACERVOS || 'idomed,geral').split(',').map(s => s.trim()).filter(Boolean);
const port = 9333;
// No CI (ubuntu-latest) o AppArmor pode impedir a sandbox do Chrome lançado fora do Playwright.
const ciArgs = process.env.CI ? ['--no-sandbox'] : [];
const chrome = spawn(chromePath(), [`--remote-debugging-port=${port}`, '--headless=new', '--no-first-run', '--disable-gpu', ...ciArgs, `--user-data-dir=${path.join(reports, 'lh-profile')}`, 'about:blank'], { stdio: 'ignore' });
/* Espera o Chrome aceitar conexões (até 20 s) em vez de uma pausa fixa. */
for (let waited = 0; ; waited += 250) {
  try { if ((await fetch(`http://127.0.0.1:${port}/json/version`)).ok) break; } catch { /* ainda subindo */ }
  if (waited >= 20000) { chrome.kill(); server.close(); throw new Error('O Chrome não abriu a porta de depuração em 20 s.'); }
  await new Promise(r => setTimeout(r, 250));
}

const RUNS = Math.max(1, Number(process.env.LH_RUNS) || 3);
const CATEGORIES = ['performance', 'accessibility', 'best-practices', 'seo'];
const out = [], failures = [];
try {
  for (const acervo of acervos) for (const mode of ['mobile', 'desktop']) {
    const flags = { port, output: 'json', onlyCategories: CATEGORIES, logLevel: 'error' };
    const config = mode === 'desktop' ? (await import('lighthouse/core/config/desktop-config.js')).default : undefined;
    const runs = [];
    for (let i = 0; i < RUNS; i++) runs.push((await lighthouse(`${url}#${acervo}`, flags, config)).lhr);
    const all = runs.map(lhr => Object.fromEntries(CATEGORIES.map(k => [k, Math.round((lhr.categories[k]?.score ?? 0) * 100)])));
    const scores = medianScores(all);
    const run = { lhr: runs.at(-1) }, c = run.lhr.categories, a = run.lhr.audits;
    const fails = Object.values(a).filter(x => x.score !== null && x.score < 0.9 && x.scoreDisplayMode === 'binary' && (c.accessibility.auditRefs.some(r => r.id === x.id) || c['best-practices'].auditRefs.some(r => r.id === x.id))).map(x => x.title);
    failures.push(...lighthouseFailures(mode, scores).map(f => `${acervo} ${f} (mediana de ${RUNS})`));
    out.push(`${acervo.padEnd(7)} ${mode.padEnd(8)} desempenho ${scores.performance} [${all.map(s => s.performance).join('/')}] | acessibilidade ${scores.accessibility} | boas práticas ${scores['best-practices']} | SEO ${scores.seo}` +
      `  (LCP ${a['largest-contentful-paint']?.displayValue ?? '-'}, CLS ${a['cumulative-layout-shift']?.displayValue ?? '-'}, TBT ${a['total-blocking-time']?.displayValue ?? '-'})` +
      (fails.length ? `\n         a corrigir: ${fails.slice(0, 5).join('; ')}` : ''));
    fs.writeFileSync(path.join(reports, `lighthouse-${acervo}-${mode}.json`), JSON.stringify(run.lhr));
  }
} finally { chrome.kill(); server.close(); }
const text = out.join('\n') + (failures.length ? `\n\nREPROVADO:\n${failures.join('\n')}` : '\n\nAprovado nos limites (SEO fora: noindex intencional).');
fs.writeFileSync(path.join(reports, 'lighthouse-summary.txt'), text + '\n');
console.log(text + '\n\nDetalhes em tools/reports/lighthouse-<acervo>-<modo>.json');
if (failures.length) process.exitCode = 1;
