// Contrato das medições: números reproduzíveis, gates que reprovam de verdade e baseline protegido.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { sessionCls, p95, median, medianScores, lighthouseFailures, LH_LIMITS, v5ReportsDir, assertBaselineWritable } from '../gates.mjs';
import { initialBundle } from '../bundle-v5.mjs';
import { reports } from '../harness.mjs';

test('CLS por janela de sessão (1 s de intervalo, 5 s no máximo)', () => {
  assert.equal(sessionCls([]), 0);
  assert.equal(+sessionCls([{ at: 0, value: .01 }, { at: 500, value: .02 }]).toFixed(3), .03);
  // intervalo maior que 1 s abre janela nova: vale a maior janela
  assert.equal(+sessionCls([{ at: 0, value: .01 }, { at: 2000, value: .02 }]).toFixed(3), .02);
  // janela não passa de 5 s, mesmo com deslocamentos seguidos
  const many = Array.from({ length: 12 }, (_, i) => ({ at: i * 900, value: .01 }));
  assert.ok(sessionCls(many) < .12);
});

test('p95 de tempos de quadro', () => {
  assert.equal(p95([]), 0);
  assert.equal(p95(Array.from({ length: 100 }, (_, i) => i + 1)), 95);
});

test('Lighthouse reprova abaixo do limite e aprova no limite', () => {
  const ok = { performance: LH_LIMITS.mobile.performance, accessibility: 100, 'best-practices': 100, seo: 60 };
  assert.deepEqual(lighthouseFailures('mobile', ok), []);
  const bad = lighthouseFailures('mobile', { ...ok, performance: LH_LIMITS.mobile.performance - 1, accessibility: 98 });
  assert.equal(bad.length, 2);
  assert.match(bad.join(' '), /desempenho/);
  assert.match(bad.join(' '), /acessibilidade/);
  // SEO não é gate: o noindex é intencional
  assert.deepEqual(lighthouseFailures('desktop', { performance: 99, accessibility: 100, 'best-practices': 100, seo: 0 }), []);
});

test('mediana de execuções do Lighthouse: um ponto fora da curva não reprova sozinho', () => {
  assert.equal(median([82, 91, 89]), 89);
  assert.equal(median([80, 90]), 85);
  const runs = [{ performance: 82, accessibility: 100 }, { performance: 89, accessibility: 100 }, { performance: 91, accessibility: 100 }];
  assert.deepEqual(medianScores(runs), { performance: 89, accessibility: 100 });
  assert.deepEqual(lighthouseFailures('mobile', { ...medianScores(runs), 'best-practices': 100 }), []);
});

test('pasta de relatórios v5 não depende do diretório atual', () => {
  const before = process.cwd();
  try { process.chdir(os.tmpdir()); assert.equal(v5ReportsDir(), path.join(reports, 'v5')); }
  finally { process.chdir(before); }
});

test('baseline só é gravado com pedido explícito e se ainda não existir', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'baseline-'));
  const file = path.join(dir, 'baseline.json');
  assert.throws(() => assertBaselineWritable(file, []), /--gravar-baseline/);
  assert.doesNotThrow(() => assertBaselineWritable(file, ['--gravar-baseline']));
  fs.writeFileSync(file, '{}');
  assert.throws(() => assertBaselineWritable(file, ['--gravar-baseline']), /imutável/);
});

test('JS inicial segue imports estáticos e modulepreload, não os dinâmicos', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dist-'));
  fs.mkdirSync(path.join(dir, 'assets'));
  fs.writeFileSync(path.join(dir, 'index.html'), '<link rel="modulepreload" crossorigin href="./assets/pre.js"><script type="module" crossorigin src="./assets/index.js"></script>');
  fs.writeFileSync(path.join(dir, 'assets/index.js'), 'import{a as b}from"./dep.js";import"./side.js";const h=()=>import("./heart.js");');
  fs.writeFileSync(path.join(dir, 'assets/dep.js'), 'export const a=1;');
  fs.writeFileSync(path.join(dir, 'assets/side.js'), 'console.info(1)');
  fs.writeFileSync(path.join(dir, 'assets/pre.js'), 'export{}');
  fs.writeFileSync(path.join(dir, 'assets/heart.js'), 'export default 3');
  const { files, gzip } = initialBundle(dir);
  assert.deepEqual(files.sort(), ['dep.js', 'index.js', 'pre.js', 'side.js']);
  assert.ok(gzip > 0);
});
