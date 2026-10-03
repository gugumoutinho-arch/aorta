// Gravar assuntos e ligações (N1) e escolher assuntos no formulário (N2). Banco fictício, sem Supabase.
// Uso: cd tools && node topic-edit.mjs
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';
import AxeBuilder from '@axe-core/playwright';
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

  ok('N1 sem erros no console', errors.length === 0 || (console.log(errors), false));
  await ctx.close();

  // N2 · formulário com assuntos, a 1440 e a 390 px, só com o teclado.
  for (const [width, theme] of [[1440, 'dark'], [390, 'light']]) {
    const tag = `N2 ${width} ${theme}`;
    const c = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: theme, reducedMotion: 'reduce' });
    const q = await c.newPage(), errs = [];
    q.on('pageerror', e => errs.push(e.message));
    q.on('console', m => m.type() === 'error' && !/fonts\.g|net::ERR/.test(m.text()) && errs.push(m.text()));
    const chip = id => q.locator(`#m-topics [data-topic="${id}"]`);
    const chipNames = () => q.$$eval('#m-topics .topic-chip', els => els.map(e => [e.textContent.trim(), e.querySelector('input').checked]));
    const active = () => q.evaluate(() => document.activeElement?.id || document.activeElement?.dataset?.topic || document.activeElement?.textContent);
    const tab = async n => { for (let i = 0; i < n; i++) await q.keyboard.press('Tab'); };

    await q.goto(main.url + '#a-cis1-anat/membro-superior'); await q.waitForSelector('#topic-tabs [aria-pressed="true"]');
    await q.locator('header [data-action="add"]').focus(); await q.keyboard.press('Enter');
    await q.waitForSelector('#dlg-form[open] #m-topics .topic-chip');
    ok(tag + ' aberto na aba: matéria e assunto já marcados', await q.inputValue('#m-area') === 'cis1-anat'
      && JSON.stringify(await chipNames()) === JSON.stringify([['Membro superior', true], ['Coluna vertebral', false], ['Membro inferior', false], ['Cabeça e pescoço', false]]));
    ok(tag + ' com assuntos, o campo de texto antigo some', await q.locator('#m-subject-fld').isHidden());

    await until(q, () => document.activeElement?.id === 'm-title');
    await q.keyboard.type('Aula nova de dissecção'); await tab(1); await q.keyboard.type('https://drive.google.com/file/d/novo123/view');
    await tab(3);
    ok(tag + ' teclado: Tab chega às fichas na ordem', await active() === 't2');
    await q.keyboard.press('Space');
    ok(tag + ' teclado: Espaço marca a ficha', await chip('t2').isChecked());
    await tab(3);
    ok(tag + ' teclado: depois das fichas vem "Novo assunto"', await active() === 'm-topic-new');

    await q.keyboard.type('Membro sup.'); await q.keyboard.press('Enter');
    await q.waitForSelector('#m-topic-similar:not([hidden])');
    await until(q, () => document.activeElement?.closest?.('#m-topic-similar')); // o foco vai ao "Usar" no quadro seguinte
    ok(tag + ' nome parecido: pergunta antes de criar', (await q.innerText('#m-topic-similar')).includes('Já existe “Membro superior”. Usar esse?')
      && /Usar “Membro superior”/.test(await active()));
    const axe = await new AxeBuilder({ page: q }).include('#dlg-form').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    ok(tag + ' WCAG no formulário com fichas e aviso', axe.violations.length === 0 || (console.log(JSON.stringify(axe.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) })))), false));
    ok(tag + ' sem rolagem lateral (página e formulário)', await q.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1
      && [...document.querySelectorAll('#dlg-form, #dlg-form .form-body')].every(e => e.scrollWidth <= e.clientWidth + 1)));
    ok(tag + ' alvos de toque ≥ 44 px', await q.evaluate(() => [...document.querySelectorAll('#m-topics .topic-chip, #m-topic-add, #m-topic-new, #m-topic-similar button')]
      .every(e => e.getBoundingClientRect().height >= 44)));
    await q.screenshot({ path: `${out}/parecido-${width}-${theme}.png` });
    await q.keyboard.press('Enter');
    await until(q, () => document.querySelector('#m-topic-similar').hidden && document.activeElement?.id === 'm-topic-new');
    ok(tag + ' "Usar esse" não cria assunto novo e volta ao campo', (await chipNames()).length === 4 && await chip('t1').isChecked());

    await q.keyboard.type('Tórax'); await q.keyboard.press('Enter');
    await until(q, () => [...document.querySelectorAll('#m-topics .topic-chip')].some(e => e.textContent.trim() === 'Tórax' && e.querySelector('input').checked));
    ok(tag + ' "Novo assunto" cria na hora e já marca', (await chipNames()).length === 5 && await active() === 'm-topic-new');
    await q.screenshot({ path: `${out}/formulario-${width}-${theme}.png` });

    await q.locator('#m-save').focus(); await q.keyboard.press('Enter');
    await until(q, () => !document.querySelector('#dlg-form').open);
    await tabCount(q, 'membro-superior', '3'); await tabCount(q, 'coluna-vertebral', '3'); await tabCount(q, 'torax', '1');
    ok(tag + ' salvar liga o material aos três assuntos (abas contam)', await q.locator('#materials .material', { hasText: 'Aula nova de dissecção' }).count() === 1);

    // Editar: desmarcar um assunto desliga só ele, e o texto antigo vira o primeiro assunto que sobrou.
    await q.locator('#materials .material', { hasText: 'Aula nova de dissecção' }).locator('[data-mid]').first().click();
    await q.waitForSelector('#dlg-detail[open] #d-edit'); await q.click('#d-edit');
    await q.waitForSelector('#dlg-form[open] #m-topics .topic-chip');
    ok(tag + ' editar: os assuntos ligados vêm marcados', JSON.stringify((await chipNames()).filter(x => x[1]).map(x => x[0])) === JSON.stringify(['Membro superior', 'Coluna vertebral', 'Tórax']));
    await chip('t1').focus(); await q.keyboard.press('Space'); await q.locator('#m-save').click();
    await until(q, () => !document.querySelector('#dlg-form').open);
    await tabCount(q, 'membro-superior', '2');
    ok(tag + ' editar: desmarcar desliga só esse assunto', (await counts(q))['coluna-vertebral'] === '3' && (await counts(q)).torax === '1');
    await q.locator('#topic-tabs [data-tab="coluna-vertebral"]').click();
    await q.locator('#materials .material', { hasText: 'Aula nova de dissecção' }).locator('[data-mid]').first().click();
    await q.waitForSelector('#dlg-detail[open] .detail-subject');
    ok(tag + ' texto antigo "assunto" = primeiro assunto ligado', await q.innerText('#dlg-detail .detail-subject') === 'Coluna vertebral');

    // Área acima de matéria: sem fichas, com explicação; o texto antigo volta a aparecer.
    await q.click('#d-edit'); await q.waitForSelector('#dlg-form[open]');
    await q.selectOption('#m-area', 'cis1');
    ok(tag + ' unidade escolhida: fichas somem e o aviso explica', await q.locator('#m-topics').isHidden() && await q.locator('#m-topic-row').isHidden()
      && (await q.innerText('#m-topics-hint')).includes('Escolha uma matéria') && await q.locator('#m-subject-fld').isVisible());
    await q.keyboard.press('Escape'); await until(q, () => !document.querySelector('#dlg-form').open);

    // Aba Casos clínicos: o formulário já vem como caso clínico, sem assunto marcado.
    await q.goto(main.url + '#a-cis1-anat/casos'); await q.waitForSelector('#topic-tabs [aria-pressed="true"]');
    await q.locator('header [data-action="add"]').click(); await q.waitForSelector('#dlg-form[open] #m-topics .topic-chip');
    ok(tag + ' aberto em Casos clínicos: tipo caso clínico e nenhum assunto', await q.inputValue('#m-type') === 'Caso clínico' && (await chipNames()).every(x => !x[1]));
    await q.keyboard.press('Escape');

    ok(tag + ' sem erros no console', errs.length === 0 || (console.log(errs), false));
    await c.close();
  }

  // N2 · nome de assunto vindo do usuário é texto, nunca HTML.
  const x = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' }), r = await x.newPage();
  await r.goto(main.url + '#a-cis1-anat'); await r.waitForSelector('#topic-tabs [data-tab]');
  await r.locator('header [data-action="add"]').click(); await r.waitForSelector('#dlg-form[open] #m-topics .topic-chip');
  await r.fill('#m-topic-new', '<img src=x onerror="window.__xss=1">'); await r.press('#m-topic-new', 'Enter');
  await until(r, () => document.querySelectorAll('#m-topics .topic-chip').length === 5);
  ok('N2 XSS: nome aparece como texto e nada é executado', await r.evaluate(() => !document.querySelector('#m-topics img') && !window.__xss
    && [...document.querySelectorAll('#m-topics .topic-chip')].some(e => e.textContent.includes('<img src=x'))));

  // N2 · revisão: Esc no aviso fecha só o aviso; salvar durante a criação espera o assunto; falha aparece no campo.
  await r.fill('#m-topic-new', 'Membro sup.'); await r.press('#m-topic-new', 'Enter');
  await until(r, () => document.activeElement?.closest?.('#m-topic-similar'));
  await r.keyboard.press('Escape');
  ok('N2 Esc no aviso fecha só o aviso e volta ao campo', await r.evaluate(() => document.querySelector('#dlg-form').open
    && document.querySelector('#m-topic-similar').hidden && document.activeElement?.id === 'm-topic-new'));
  await r.fill('#m-title', 'Aula lenta'); await r.fill('#m-url', 'https://example.com/lenta');
  await r.evaluate(() => { window.__mockDelay = 900; });
  await r.fill('#m-topic-new', 'Abdome'); await r.press('#m-topic-new', 'Enter');
  ok('N2 durante a criação o foco fica no campo', await r.evaluate(() => document.activeElement?.id === 'm-topic-new'));
  await r.click('#m-save');
  await until(r, () => !document.querySelector('#dlg-form').open);
  await r.evaluate(() => { window.__mockDelay = 0; });
  await tabCount(r, 'abdome', '1');
  ok('N2 salvar logo depois de "Novo assunto" espera e liga o assunto', await r.locator('#materials .material', { hasText: 'Aula lenta' }).count() === 1);
  await r.locator('header [data-action="add"]').click(); await r.waitForSelector('#dlg-form[open] #m-topics .topic-chip');
  await r.evaluate(() => { window.__mockFail = 'topics/'; });
  await r.fill('#m-topic-new', 'Pelve'); await r.press('#m-topic-new', 'Enter');
  await until(r, () => !document.querySelector('#m-topic-err').hidden);
  ok('N2 falha ao criar assunto aparece no próprio campo', (await r.innerText('#m-topic-err')).includes('Não deu para criar') && await r.inputValue('#m-topic-new') === 'Pelve');
  await x.close();
} finally { await browser.close(); main.server.close(); }
console.log(`\n${checks.length} verificações aprovadas.`);
