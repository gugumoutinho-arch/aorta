// Nota de desempenho, acessibilidade e boas práticas (Lighthouse) em celular e computador.
// Uso:  cd tools && npm run lighthouse
// Observação: a página de teste usa dados fictícios e carrega as fontes do Google Fonts (precisa de internet).
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import lighthouse from 'lighthouse';
import { reports, startServer, chromePath, withDb } from './harness.mjs';

fs.mkdirSync(reports, { recursive: true });
const v4 = process.env.LH_V4 === '1';
const { server, url } = await startServer(v4 ? { inject: withDb(JSON.parse(fs.readFileSync(new URL('./seed-v4.json', import.meta.url), 'utf8'))) } : {});
const reportPrefix = v4 ? 'lighthouse-v4-' : 'lighthouse-';
const port = 9333;
const chrome = spawn(chromePath(), [`--remote-debugging-port=${port}`, '--headless=new', '--no-first-run', '--disable-gpu', `--user-data-dir=${path.join(reports, 'lh-profile')}`, 'about:blank'], { stdio: 'ignore' });
await new Promise(r => setTimeout(r, 2500));

const out = [];
try {
  for (const mode of ['mobile', 'desktop']) {
    const flags = { port, output: 'json', onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'], logLevel: 'error' };
    const config = mode === 'desktop' ? (await import('lighthouse/core/config/desktop-config.js')).default : undefined;
    const run = await lighthouse(url + (process.env.LH_QUERY || ''), flags, config); // ex.: LH_QUERY='?conceito=corpo'
    const c = run.lhr.categories;
    const score = k => Math.round((c[k]?.score ?? 0) * 100);
    const a = run.lhr.audits;
    const fails = Object.values(a).filter(x => x.score !== null && x.score < 0.9 && x.scoreDisplayMode === 'binary' && (c.accessibility.auditRefs.some(r => r.id === x.id) || c['best-practices'].auditRefs.some(r => r.id === x.id))).map(x => x.title);
    out.push(`${mode.padEnd(8)} desempenho ${score('performance')} | acessibilidade ${score('accessibility')} | boas práticas ${score('best-practices')} | SEO ${score('seo')}` +
      `  (LCP ${a['largest-contentful-paint']?.displayValue ?? '-'}, CLS ${a['cumulative-layout-shift']?.displayValue ?? '-'}, TBT ${a['total-blocking-time']?.displayValue ?? '-'})` +
      (fails.length ? `\n         a corrigir: ${fails.slice(0, 5).join('; ')}` : ''));
    fs.writeFileSync(path.join(reports, `${reportPrefix}${mode}.json`), JSON.stringify(run.lhr));
  }
} finally { chrome.kill(); server.close(); }
const text = out.join('\n');
fs.writeFileSync(path.join(reports, reportPrefix + 'summary.txt'), text + '\n');
console.log(text + '\n\nDetalhes em tools/reports/lighthouse-*.json');
