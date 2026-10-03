// Abas de assunto dentro da matéria (C-19). Banco fictício, sem Supabase. Uso: cd tools && node topics.mjs
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';
import AxeBuilder from '@axe-core/playwright';
import { startServer, withDb, chromePath, reports } from './harness.mjs';

const base = JSON.parse(fs.readFileSync(new URL('./seed-v4.json', import.meta.url), 'utf8'));
const mat = (id, title, type, subject) => ({ ...base.materials[0], id, title, type, subject, areaId: 'cis1-anat', url: 'https://example.com/' + id, favorite: false, collectionIds: [] });
const topic = (id, name, slug, order, extra = {}) => ({ id, areaId: 'cis1-anat', name, slug, order, slugAliases: [], ...extra });
const data = {
  ...base,
  materials: [
    ...base.materials.filter(m => m.areaId !== 'cis1-anat'),
    mat('a1', 'Anatomia clínica dos membros superiores', 'Slides', 'Membro superior'),
    mat('a2', 'Caso clínico — luxação do ombro', 'Caso clínico', 'Membro superior'),
    mat('a3', 'Caso clínico — fratura do colo do fêmur', 'Caso clínico', 'Membro inferior'),
    mat('a4', 'Conferência de coluna', 'Slides', 'Coluna vertebral'),
    mat('a5', 'Revisão de membros inferiores', 'Resumo', 'Membro inferior'),
  ],
  topics: [
    topic('t1', 'Membro superior', 'membro-superior', 0),
    topic('t2', 'Coluna vertebral', 'coluna-vertebral', 1),
    topic('t3', 'Membro inferior', 'membro-inferior', 2, { slugAliases: ['membro-inf'] }),
    topic('t4', 'Cabeça e pescoço', 'cabeca-e-pescoco', 3),
  ],
  material_topics: [
    { materialId: 'a1', topicId: 't1' }, { materialId: 'a2', topicId: 't1' }, { materialId: 'a2', topicId: 't2' },
    { materialId: 'a3', topicId: 't3' }, { materialId: 'a4', topicId: 't2' }, { materialId: 'a5', topicId: 't3' },
  ],
};
const many = { ...data, topics: [...data.topics, ...Array.from({ length: 8 }, (_, i) => topic('x' + i, 'Assunto extra número ' + (i + 1), 'assunto-extra-numero-' + (i + 1), 4 + i))] };

const out = reports + '/topics'; fs.mkdirSync(out, { recursive: true });
const checks = [];
const ok = (label, result) => { assert.ok(result, label); checks.push(label); console.log('OK ' + label); };
const tabs = p => p.$$eval('#topic-tabs [data-tab]', els => els.map(e => [e.dataset.tab, e.querySelector('.num').textContent, e.getAttribute('aria-pressed')]));
const titles = p => p.$$eval('#materials .material h3, #materials .material [class*="title"]', els => [...new Set(els.map(e => e.textContent.trim()))]);
const groups = p => p.$$eval('#materials .group-h span:first-child', els => els.map(e => e.textContent.trim()));

const servers = [await startServer({ inject: withDb(data) }), await startServer({ inject: withDb(many) }), await startServer({ inject: withDb(base) })];
const [main, crowded, plain] = servers;
const browser = await chromium.launch({ executablePath: chromePath(), headless: true });
try {
  for (const [width, theme] of [[1440, 'dark'], [390, 'light'], [320, 'dark']]) {
    const ctx = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: theme, reducedMotion: 'reduce' });
    const p = await ctx.newPage(), errors = [];
    p.on('pageerror', e => errors.push(e.message)); p.on('console', m => m.type() === 'error' && errors.push(m.text()));
    const tag = width + ' ' + theme;

    await p.goto(main.url + '#a-cis1-anat'); await p.waitForSelector('#topic-tabs:not([hidden]) [data-tab]');
    ok(tag + ' abas na ordem com contagem, assunto vazio como em produção e Casos clínicos', JSON.stringify(await tabs(p)) === JSON.stringify([
      ['', '5', 'true'], ['membro-superior', '2', 'false'], ['coluna-vertebral', '2', 'false'], ['membro-inferior', '2', 'false'], ['cabeca-e-pescoco', '—', 'false'], ['casos', '2', 'false']]));
    ok(tag + ' Todos agrupa por assunto na ordem da matéria, sem repetir material', JSON.stringify(await groups(p)) === JSON.stringify(['Membro superior', 'Coluna vertebral', 'Membro inferior'])
      && await p.locator('#materials .material').count() === 5);

    await p.locator('#topic-tabs [data-tab="coluna-vertebral"]').click();
    ok(tag + ' aba de assunto filtra pela ligação e atualiza o endereço', decodeURIComponent(new URL(p.url()).hash) === '#a-cis1-anat/coluna-vertebral'
      && await p.locator('#materials .material').count() === 2 && JSON.stringify(await groups(p)) === JSON.stringify(['Coluna vertebral']));
    ok(tag + ' foco fica na aba escolhida', await p.evaluate(() => document.activeElement?.dataset.tab === 'coluna-vertebral'));

    await p.locator('#topic-tabs [data-tab="casos"]').click();
    ok(tag + ' Casos clínicos mostra só casos, agrupados por assunto', await p.locator('#materials .material').count() === 2
      && JSON.stringify(await groups(p)) === JSON.stringify(['Membro superior', 'Membro inferior']));

    await p.locator('#topic-tabs [data-tab="cabeca-e-pescoco"]').click();
    ok(tag + ' assunto sem material mostra "Em produção" com o nome do assunto', (await p.locator('#materials .empty').innerText()).includes('Cabeça e pescoço ainda não tem material'));

    await p.locator('#topic-tabs [data-tab="membro-superior"]').click();
    await p.fill('#lib-q', 'ombro'); await p.waitForTimeout(250);
    ok(tag + ' busca dentro da aba combina os dois', await p.locator('#materials .material').count() === 1
      && (await p.locator('#materials').innerText()).includes('luxação do ombro'));
    await p.fill('#lib-q', ''); await p.waitForTimeout(250);

    await p.goto(main.url + '#a-cis1/membro-superior'); await p.waitForSelector('#subjects [data-subject]');
    ok(tag + ' aba em endereço de unidade (sem matéria) é tirada do endereço', decodeURIComponent(new URL(p.url()).hash) === '#a-cis1'
      && await p.locator('#topic-tabs').isHidden());

    await p.goto(main.url + '#a-cis1-anat/membro-inferior'); await p.waitForSelector('#topic-tabs [aria-pressed="true"]');
    ok(tag + ' endereço direto abre a aba', await p.getAttribute('#topic-tabs [aria-pressed="true"]', 'data-tab') === 'membro-inferior' && await p.locator('#materials .material').count() === 2);
    await p.goto(main.url + '#a-cis1-anat/membro-inf'); await p.waitForSelector('#topic-tabs [aria-pressed="true"]');
    ok(tag + ' slug antigo leva ao assunto e o endereço é corrigido', await p.getAttribute('#topic-tabs [aria-pressed="true"]', 'data-tab') === 'membro-inferior'
      && decodeURIComponent(new URL(p.url()).hash) === '#a-cis1-anat/membro-inferior');
    await p.goto(main.url + '#a-cis1-anat/nao-existe'); await p.waitForSelector('#topic-tabs [aria-pressed="true"]');
    ok(tag + ' aba inexistente volta para Todos', await p.getAttribute('#topic-tabs [aria-pressed="true"]', 'data-tab') === '' && decodeURIComponent(new URL(p.url()).hash) === '#a-cis1-anat');

    await p.locator('#topic-tabs [data-tab="membro-superior"]').focus(); await p.keyboard.press('Enter');
    ok(tag + ' teclado: Enter ativa a aba', await p.getAttribute('#topic-tabs [aria-pressed="true"]', 'data-tab') === 'membro-superior');
    ok(tag + ' alvos de toque ≥ 44 px e sem rolagem lateral da página', await p.evaluate(() =>
      [...document.querySelectorAll('#topic-tabs [data-tab]')].every(b => b.offsetHeight >= 44) && document.documentElement.scrollWidth <= innerWidth + 1));
    const axe = await new AxeBuilder({ page: p }).include('#topic-tabs').include('#materials').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    ok(tag + ' WCAG nas abas e materiais', axe.violations.length === 0 || (console.log(JSON.stringify(axe.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) })))), false));
    await p.screenshot({ path: `${out}/anatomia-${width}-${theme}.png` });

    await p.goto(main.url + '#a-cis1'); await p.waitForSelector('#subjects [data-subject]');
    ok(tag + ' sem matéria escolhida não há abas', await p.locator('#topic-tabs').isHidden());
    await p.locator('#subjects [data-subject="cis1-anat"]').click(); await p.locator('#topic-tabs [data-tab="casos"]').click();
    await p.locator('#subjects [data-subject=""]').click();
    ok(tag + ' trocar de matéria zera a aba', await p.locator('#topic-tabs').isHidden() && !decodeURIComponent(new URL(p.url()).hash).includes('/'));

    await p.goto(crowded.url + '#a-cis1-anat/assunto-extra-numero-8'); await p.waitForSelector('#topic-tabs [aria-pressed="true"]');
    ok(tag + ' muitas abas: rolam dentro da faixa e a ativa fica à vista', await p.evaluate(() => {
      const box = document.querySelector('#topic-tabs'), a = box.querySelector('[aria-pressed="true"]'), b = box.getBoundingClientRect(), r = a.getBoundingClientRect();
      return document.documentElement.scrollWidth <= innerWidth + 1 && r.left >= b.left - 1 && r.right <= b.right + 1;
    }));
    await p.screenshot({ path: `${out}/muitas-abas-${width}-${theme}.png` });

    await p.goto(plain.url + '#a-cis1-anat/membro-superior'); await p.waitForSelector('#materials .material, #materials .empty');
    ok(tag + ' banco sem assuntos: sem abas, catálogo normal', await p.locator('#topic-tabs').isHidden() && await p.locator('#materials .material').count() > 0);

    ok(tag + ' sem erros no console', errors.length === 0 || (console.log(errors), false));
    await ctx.close();
  }
} finally { await browser.close(); servers.forEach(s => s.server.close()); }
console.log(`\n${checks.length} verificações aprovadas.`);
