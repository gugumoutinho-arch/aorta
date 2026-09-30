// Verificação completa do index.html. Uso:  cd tools && npm install && npm run check
// Etapas: 1) formato de publicação  2) sintaxe do script  3) CSS (stylelint)  4) HTML (html-validate)
//         5) telas em 3 larguras x 2 temas: rolagem lateral, erros de console, acessibilidade (axe) e capturas.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { chromium } from 'playwright-core';
import AxeBuilder from '@axe-core/playwright';
import stylelint from 'stylelint';
import { HtmlValidate } from 'html-validate';
import { here, reports, readSite, startServer, chromePath, pageHtml } from './harness.mjs';

const results = []; // { etapa, nivel: 'ok'|'aviso'|'erro', texto }
const add = (etapa, nivel, texto) => results.push({ etapa, nivel, texto });
const src = readSite();

// 1) formato
if (!src.startsWith('<title>Biblioteca de Medicina</title>')) add('formato', 'erro', 'O arquivo precisa começar com <title>Biblioteca de Medicina</title>.');
for (const [nome, re] of [['<!doctype', /<!doctype/i], ['<html', /<html[s>]/i], ['<head', /<head[s>]/i], ['<body', /<body[s>]/i]]) if (re.test(src)) add('formato', 'erro', `Tag proibida encontrada: ${nome}. O claude.ai envolve a página sozinho.`);
if (/\b(alert|confirm|prompt)\s*\(/.test(src.slice(src.lastIndexOf('<script>')))) add('formato', 'erro', 'Uso de alert/confirm/prompt: o claude.ai não mostra esses diálogos.');
if (!/window\.claude/.test(src)) add('formato', 'erro', 'Acesso ao banco (window.claude.use("db")) não encontrado.');
for (const col of ['materials', 'areas', 'collections']) if (!src.includes(`"${col}"`)) add('formato', 'erro', `Coleção "${col}" não encontrada no script.`);
if (!results.some(r => r.etapa === 'formato')) add('formato', 'ok', 'Começa em <title>, sem tags de documento, com acesso ao banco e as 3 coleções.');

// 2) sintaxe do script
const script = src.slice(src.lastIndexOf('<script>') + 8, src.lastIndexOf('</script>'));
try { new vm.Script(script); add('script', 'ok', 'Sintaxe do JavaScript válida.'); } catch (e) { add('script', 'erro', 'Erro de sintaxe: ' + e.message); }

// 3) CSS
const css = [...src.matchAll(/<style>([\s\S]*?)<\/style>/g)].map(m => m[1]).join('\n');
const sl = await stylelint.lint({ code: css, codeFilename: 'index.css', config: { extends: ['stylelint-config-recommended'], rules: { 'no-descending-specificity': null, 'font-family-no-missing-generic-family-keyword': null, 'no-duplicate-selectors': null /* blocos de ajuste no fim do CSS repetem seletores de propósito */ } } });
const slw = sl.results[0].warnings;
slw.length ? slw.slice(0, 8).forEach(w => add('css', w.severity === 'error' ? 'erro' : 'aviso', `Linha ${w.line}: ${w.text}`)) : add('css', 'ok', 'CSS sem erros (stylelint).');
const hexOnly = (css.match(/#[0-9a-fA-F]{3,8}\b|rgba?\(/g) || []).length;
add('css', 'ok', `Informação: ${hexOnly} cores literais no CSS (as cores de tema devem ficar nos tokens de :root).`);

// 4) HTML
const hv = new HtmlValidate({ extends: ['html-validate:recommended'], rules: { 'no-inline-style': 'off', 'require-sri': 'off', 'no-trailing-whitespace': 'off', 'void-style': 'off', 'prefer-native-element': 'off', 'wcag/h30': 'off', 'no-implicit-close': 'off', 'element-permitted-content': 'off', 'element-permitted-parent': 'off', 'element-required-content': 'off', 'doctype-style': 'off' /* o <title> dentro do corpo é como o claude.ai monta a página */, 'unique-landmark': 'off', 'empty-heading': 'off' /* títulos preenchidos pelo JavaScript após carregar */, 'no-redundant-for': 'off' } });
const rep = await hv.validateString(pageHtml());
const msgs = rep.results.flatMap(r => r.messages).filter(m => m.severity >= 1);
msgs.length ? msgs.slice(0, 8).forEach(m => add('html', m.severity >= 2 ? 'erro' : 'aviso', `Linha ${m.line}: ${m.message} (${m.ruleId})`)) : add('html', 'ok', 'HTML sem problemas (html-validate).');

// 5) telas
fs.mkdirSync(path.join(reports, 'shots'), { recursive: true });
const { server, url } = await startServer();
const browser = await chromium.launch({ executablePath: chromePath(), headless: true });
const widths = [375, 768, 1440], schemes = ['light', 'dark'];
const routes = [['inicio', '#inicio'], ['todos', '#todos'], ['cis1', '#a-cis1'], ['organizar', '#organizar']];
const axeTotals = {};
for (const w of widths) for (const scheme of schemes) {
  const ctx = await browser.newContext({ viewport: { width: w, height: w < 500 ? 812 : 900 }, colorScheme: scheme, deviceScaleFactor: 1 });
  const page = await ctx.newPage(); const errors = [];
  page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error' && !/fonts\.g|net::ERR/.test(m.text())) errors.push(m.text()); });
  await page.goto(url); await page.waitForTimeout(700);
  for (const [name, hash] of routes) {
    await page.evaluate(h => { location.hash = h; }, hash); await page.waitForTimeout(450);
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
for (const [k, { v, telas }] of axeList) add('acessibilidade', ['serious', 'critical'].includes(v.impact) ? 'erro' : 'aviso', `${k} — ${v.help} (${v.nodes.length} elemento(s); ex.: ${[...telas][0]}). ${v.helpUrl}`);

// relatório
const icon = { ok: 'OK   ', aviso: 'AVISO', erro: 'ERRO ' };
const lines = results.map(r => `${icon[r.nivel]} [${r.etapa}] ${r.texto}`);
const errs = results.filter(r => r.nivel === 'erro').length, warns = results.filter(r => r.nivel === 'aviso').length;
const summary = `# Verificação do site\n\n${new Date().toISOString()}\n\n` + lines.map(l => '- ' + l).join('\n') + `\n\n**${errs} erro(s), ${warns} aviso(s).** Capturas em tools/reports/shots/.\n`;
fs.writeFileSync(path.join(reports, 'summary.md'), summary);
console.log(lines.join('\n') + `\n\n${errs} erro(s), ${warns} aviso(s). Relatório: tools/reports/summary.md`);
process.exit(errs ? 1 : 0);
