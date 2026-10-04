// Verificação completa do site (projeto Vite). Uso:  cd tools && npm install && npm run check
// Etapas: 1) build do Vite  2) regras do projeto no código-fonte  3) CSS (stylelint)  4) HTML (html-validate)
//         5) telas em 3 larguras x 2 temas x 4 rotas: rolagem lateral, erros de console, acessibilidade (axe) e capturas.
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';
import AxeBuilder from '@axe-core/playwright';
import stylelint from 'stylelint';
import { HtmlValidate } from 'html-validate';
import { root, dist, reports, buildSite, pageHtml, startServer, chromePath } from './harness.mjs';
import { findMojibake } from './encoding.mjs';
import { motionFindings } from './motion-rules.mjs';

const results = []; // { etapa, nivel: 'ok'|'aviso'|'erro', texto }
const add = (etapa, nivel, texto) => results.push({ etapa, nivel, texto });
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);

// 1) build
const b = buildSite();
if (!b.ok) add('build', 'erro', 'vite build falhou:\n' + b.log.split('\n').slice(-15).join('\n'));
else {
  add('build', 'ok', 'vite build concluído (dist/).');
  if (!fs.existsSync(path.join(dist, 'modelos', 'heart-hra-v1.3.glb'))) add('build', 'erro', 'O modelo 3D não foi copiado para dist/modelos/.');
}

// 2) regras do projeto (AGENTS.md) no código-fonte
const srcFiles = walk(path.join(root, 'src')).filter(f => /\.(js|css)$/.test(f));
const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const js = srcFiles.filter(f => f.endsWith('.js')).map(f => [path.relative(root, f), fs.readFileSync(f, 'utf8')]);
const allJs = js.map(([, s]) => s).join('\n') + indexHtml;
for (const [file, s] of js) if (/\b(alert|confirm|prompt)\s*\(|window\.print\s*\(/.test(s)) add('regras', 'erro', `${file}: alert/confirm/prompt/print não são permitidos.`);
if (/service_role|sb_secret_/i.test(allJs)) add('regras', 'erro', 'Possível chave secreta no código. Só a chave pública (sb_publishable_…) pode ir para o site.');
if (!/window\.claude/.test(allJs)) add('regras', 'erro', 'Ponta de testes (window.claude.use("db")) não encontrada.');
for (const col of ['materials', 'areas', 'collections']) if (!allJs.includes(`"${col}"`)) add('regras', 'erro', `Coleção "${col}" não encontrada no código.`);
if (/<a [^>]*download/i.test(allJs)) add('regras', 'erro', 'Downloads por <a download> não são permitidos.');
if (!/noindex/.test(indexHtml)) add('regras', 'erro', 'O index.html precisa manter <meta name="robots" content="noindex, nofollow">.');
if (!results.some(r => r.etapa === 'regras')) add('regras', 'ok', 'Sem diálogos do navegador, sem chave secreta, com as duas pontas do banco e as 3 coleções.');

// 2a) régua do movimento (motion-rules.mjs): interface só com tempos dos tokens e sem curva que só acelera
const motion = js.flatMap(([file, s]) => motionFindings(s, file.split(path.sep).join('/')));
motion.length ? motion.slice(0, 12).forEach(f => add('movimento', 'erro', `${f.file}:${f.line}: ${f.text}`))
  : add('movimento', 'ok', 'Interface só com tempos dos tokens de movimento e sem curva que só acelera.');

// 2b) acentos corrompidos (arquivo gravado fora de UTF-8); o próprio detector e seus testes ficam de fora
const textFiles = [
  ...srcFiles, path.join(root, 'index.html'),
  ...fs.readdirSync(root).filter(f => f.endsWith('.md')).map(f => path.join(root, f)),
  ...fs.readdirSync(path.join(root, 'tools')).filter(f => /\.(mjs|json)$/.test(f) && f !== 'encoding.mjs' && f !== 'package-lock.json').map(f => path.join(root, 'tools', f)),
];
const corrupted = textFiles.flatMap(f => findMojibake(fs.readFileSync(f, 'utf8')).map(h => `${path.relative(root, f)}:${h.line}: …${h.sample}…`));
corrupted.length
  ? add('codificação', 'erro', `Acentos corrompidos (salve em UTF-8):\n${corrupted.slice(0, 12).join('\n')}`)
  : add('codificação', 'ok', `${textFiles.length} arquivos em UTF-8, sem acento trocado por ? nem caractere de substituição.`);

// 3) CSS
const cssFiles = srcFiles.filter(f => f.endsWith('.css'));
const sl = await stylelint.lint({ files: cssFiles, config: { extends: ['stylelint-config-recommended'], rules: { 'no-descending-specificity': null, 'font-family-no-missing-generic-family-keyword': null, 'no-duplicate-selectors': null } } });
const slw = sl.results.flatMap(r => r.warnings.map(w => ({ ...w, file: path.basename(r.source) })));
slw.length ? slw.slice(0, 8).forEach(w => add('css', w.severity === 'error' ? 'erro' : 'aviso', `${w.file}:${w.line}: ${w.text}`)) : add('css', 'ok', `CSS sem erros (stylelint, ${cssFiles.length} arquivos).`);
const literal = cssFiles.filter(f => !f.endsWith('tokens.css')).map(f => (fs.readFileSync(f, 'utf8').match(/#[0-9a-fA-F]{3,8}\b/g) || []).length).reduce((a, n) => a + n, 0);
literal ? add('css', 'erro', `${literal} cor(es) hexadecimal(is) fora de tokens.css; cores de tema devem ser tokens.`) : add('css', 'ok', 'Cores só por tokens (nenhum hexadecimal fora de tokens.css).');
const looseHover = cssFiles.flatMap(f => hoverOutsideMedia(fs.readFileSync(f, 'utf8')).map(x => `${path.basename(f)}:${x}`));
looseHover.length ? add('css', 'erro', `:hover fora de @media (hover: hover) (no toque o efeito "gruda"):\n${looseHover.slice(0, 8).join('\n')}`)
  : add('css', 'ok', 'Efeitos de passar o mouse só em aparelhos com mouse (@media (hover: hover)).');

/* Regras com :hover fora de um @media que exija hover; devolve "linha: seletor". */
function hoverOutsideMedia(css) {
  const out = [], stack = []; let buf = '', line = 1;
  for (const c of css.replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, ' '))) {
    if (c === '\n') line++;
    if (c === '{') { const sel = buf.trim(); if (/:hover/.test(sel) && !stack.some(p => /@media[^{]*hover:\s*hover/.test(p))) out.push(`${line}: ${sel.replace(/\s+/g, ' ').slice(0, 90)}`); stack.push(sel); buf = ''; }
    else if (c === '}') { stack.pop(); buf = ''; } else if (c === ';') buf = ''; else buf += c;
  }
  return out;
}

// 4) HTML
if (b.ok) {
  const hv = new HtmlValidate({ extends: ['html-validate:recommended'], rules: { 'no-inline-style': 'off', 'require-sri': 'off', 'no-trailing-whitespace': 'off', 'void-style': 'off', 'prefer-native-element': 'off', 'wcag/h30': 'off', 'unique-landmark': 'off', 'empty-heading': 'off' /* títulos preenchidos pelo JavaScript */, 'no-redundant-for': 'off', 'long-title': 'off' } });
  const rep = await hv.validateString(pageHtml());
  const msgs = rep.results.flatMap(r => r.messages).filter(m => m.severity >= 1);
  msgs.length ? msgs.slice(0, 8).forEach(m => add('html', m.severity >= 2 ? 'erro' : 'aviso', `Linha ${m.line}: ${m.message} (${m.ruleId})`)) : add('html', 'ok', 'HTML sem problemas (html-validate).');
}

// 5) telas. Sem WebGL de propósito: o mapa em linhas é a base sempre presente; o coração 3D tem teste próprio em flows.mjs.
if (b.ok) {
  fs.mkdirSync(path.join(reports, 'shots'), { recursive: true });
  const { server, url } = await startServer();
  const browser = await chromium.launch({ executablePath: chromePath(), headless: true, args: ['--disable-gpu', '--disable-webgl', '--disable-webgl2'] });
  const widths = [375, 768, 1440], schemes = ['light', 'dark'];
  const routes = [['inicio', '#inicio'], ['todos', '#todos'], ['cis1', '#a-cis1'], ['organizar', '#organizar']];
  const axeTotals = {};
  for (const w of widths) for (const scheme of schemes) {
    const ctx = await browser.newContext({ viewport: { width: w, height: w < 500 ? 812 : 900 }, colorScheme: scheme, deviceScaleFactor: 1 });
    await ctx.route(/supabase\.co/, r => r.abort());
    const page = await ctx.newPage(); const errors = [];
    page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error' && !/fonts\.g|net::ERR/.test(m.text())) errors.push(m.text()); });
    await page.goto(url); await page.waitForTimeout(700);
    for (const [name, hash] of routes) {
      await page.evaluate(h => { location.hash = h; }, hash); await page.waitForTimeout(700);
      const label = `${name}@${w}-${scheme}`;
      const over = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      if (over > 1) add('telas', 'erro', `${label}: rolagem horizontal de ${over}px.`);
      const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      for (const v of axe.violations) { const k = `${v.impact}:${v.id}`; (axeTotals[k] ||= { v, telas: new Set() }).telas.add(label); }
      await page.screenshot({ path: path.join(reports, 'shots', `${label}.png`), fullPage: false });
    }
    if (errors.length) add('telas', 'erro', `Erros de console em ${w}px/${scheme}: ${[...new Set(errors)].slice(0, 3).join(' | ')}`);
    await ctx.close();
  }
  await browser.close(); server.close();
  if (!results.some(r => r.etapa === 'telas')) add('telas', 'ok', `${widths.length * schemes.length * routes.length} telas sem rolagem lateral nem erros de console.`);
  const axeList = Object.entries(axeTotals);
  if (!axeList.length) add('acessibilidade', 'ok', 'axe-core: nenhuma violação WCAG A/AA nas telas testadas.');
  for (const [k, { v, telas }] of axeList) add('acessibilidade', ['serious', 'critical'].includes(v.impact) ? 'erro' : 'aviso', `${k} — ${v.help} (${v.nodes.length} elemento(s); ex.: ${[...telas][0]}; ${v.nodes[0]?.target}). ${v.helpUrl}`);
}

// relatório
const icon = { ok: 'OK   ', aviso: 'AVISO', erro: 'ERRO ' };
const lines = results.map(r => `${icon[r.nivel]} [${r.etapa}] ${r.texto}`);
const errs = results.filter(r => r.nivel === 'erro').length, warns = results.filter(r => r.nivel === 'aviso').length;
fs.mkdirSync(reports, { recursive: true });
fs.writeFileSync(path.join(reports, 'summary.md'), `# Verificação do site\n\n${new Date().toISOString()}\n\n` + lines.map(l => '- ' + l).join('\n') + `\n\n**${errs} erro(s), ${warns} aviso(s).** Capturas em tools/reports/shots/.\n`);
console.log(lines.join('\n') + `\n\n${errs} erro(s), ${warns} aviso(s). Relatório: tools/reports/summary.md`);
process.exit(errs ? 1 : 0);
