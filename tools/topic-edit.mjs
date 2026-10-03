// Gravar assuntos e ligações (N1) e escolher assuntos no formulário (N2). Banco fictício, sem Supabase.
// Uso: cd tools && node topic-edit.mjs
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';
import { startServer, withDb, chromePath, reports } from './harness.mjs';
import { withTopics } from './fixtures-topics.mjs';

const data = withTopics(JSON.parse(fs.readFileSync(new URL('./seed-v4.json', import.meta.url), 'utf8')));
const out = reports + '/topic-edit'; fs.mkdirSync(out, { recursive: true });
const checks = [];
const ok = (label, result) => { assert.ok(result, label); checks.push(label); console.log('OK ' + label); };
const counts = p => p.$$eval('#topic-tabs [data-tab]', els => Object.fromEntries(els.map(e => [e.dataset.tab, e.querySelector('.num').textContent])));
const hash = p => decodeURIComponent(new URL(p.url()).hash);
/* Espera uma condição da página (sem pausas fixas). */
const until = (p, fn, arg) => p.waitForFunction(fn, arg, { timeout: 5000 });
const tabCount = (p, key, n) => until(p, ([k, v]) => document.querySelector(`#topic-tabs [data-tab="${k}"] .num`)?.textContent === v, [key, n]);

const main = await startServer({ inject: withDb(data) });
const browser = await chromium.launch({ executablePath: chromePath(), headless: true });
try {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const p = await ctx.newPage(), errors = [];
  p.on('pageerror', e => errors.push(e.message));
  p.on('console', m => m.type() === 'error' && !/fonts\.g|net::ERR/.test(m.text()) && errors.push(m.text()));

  // N1 · remover um material ligado a dois assuntos e desfazer: as ligações voltam junto.
  await p.goto(main.url + '#a-cis1-anat/membro-superior'); await p.waitForSelector('#topic-tabs [aria-pressed="true"]');
  ok('N1 antes: luxação do ombro está em Membro superior e Coluna vertebral', JSON.stringify(await counts(p)) === JSON.stringify({ '': '5', 'membro-superior': '2', 'coluna-vertebral': '2', 'membro-inferior': '2', 'cabeca-e-pescoco': '—', casos: '2' }));
  await p.locator('#materials [data-mid="a2"]').click(); await p.waitForSelector('#dlg-detail[open] #d-remove');
  await p.click('#d-remove'); await p.click('#d-rm-yes');
  await tabCount(p, 'membro-superior', '1');
  ok('N1 remover: as ligações saem junto (cascata)', (await counts(p))['coluna-vertebral'] === '1' && await p.locator('#materials [data-mid="a2"]').count() === 0);
  await p.locator('.toast button', { hasText: 'Desfazer' }).click();
  await tabCount(p, 'membro-superior', '2'); await tabCount(p, 'coluna-vertebral', '2');
  ok('N1 Desfazer: material e as duas ligações de volta', await p.locator('#materials [data-mid="a2"]').count() === 1);
  await p.locator('#topic-tabs [data-tab="coluna-vertebral"]').click();
  ok('N1 Desfazer: o material volta também na aba do segundo assunto', hash(p) === '#a-cis1-anat/coluna-vertebral' && await p.locator('#materials [data-mid="a2"]').count() === 1);

  ok('sem erros no console', errors.length === 0 || (console.log(errors), false));
  await ctx.close();
} finally { await browser.close(); main.server.close(); }
console.log(`\n${checks.length} verificações aprovadas.`);
