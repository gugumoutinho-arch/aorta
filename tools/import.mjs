// Importação por colagem (N4): colar 5 linhas mistas → prévia → salvar rascunhos → recarregar → publicar → abas certas,
// sem duplicar nem depois de um erro no meio. Banco fictício (persiste entre recarregamentos), sem Supabase.
// Uso: cd tools && node import.mjs
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';
import AxeBuilder from '@axe-core/playwright';
import { startServer, withDb, chromePath, reports } from './harness.mjs';
import { withTopics } from './fixtures-topics.mjs';

const base = withTopics(JSON.parse(fs.readFileSync(new URL('./seed-v4.json', import.meta.url), 'utf8')));
const data = { ...base, materials: [...base.materials, { ...base.materials[0], id: 'dup1', title: 'Atlas já cadastrado', url: 'https://drive.google.com/file/d/JAEXISTE/view', areaId: 'cis1-anat', subject: '' }] };
const out = reports + '/import'; fs.mkdirSync(out, { recursive: true });
const checks = [];
const ok = (label, result) => { assert.ok(result, label); checks.push(label); console.log('OK ' + label); };
const until = (p, fn, arg) => p.waitForFunction(fn, arg, { timeout: 8000 });
const TAB = '\t';
const PASTE = [
  ['url', 'caminho', 'tipo', 'titulo', 'fonte', 'ano', 'direitos'],
  ['https://drive.google.com/file/d/OMBRO1/view?usp=sharing', 'Aorta/IDOMED/M1/CIS 1/Anatomia/Membro superior/', 'Slides', 'Aula de ombro', 'Monitoria', '2026', ''],
  ['https://drive.google.com/file/d/COLUNA2/view?resourcekey=0-k2', 'Aorta/IDOMED/M1/CIS 1/Anatomia/Coluna vertebral', 'Resumo', 'Resumo de coluna', '', '', 'proprio'],
  ['https://drive.google.com/drive/folders/PASTA3', 'Aorta/IDOMED/M1/CIS 1/Anatomia', 'Slides', 'Pasta inteira'],
  ['https://drive.google.com/open?id=JAEXISTE', 'Aorta/IDOMED/M1/CIS 1/Anatomia/Membro inferior', 'Livro', 'Atlas de novo'],
  ['https://drive.google.com/file/d/LIVRO5/view', 'Aorta/IDOMED/M1/CIS 9/Anatomia', 'Livro', 'Livro em PDF <b>negrito</b>'],
].map(r => r.join(TAB)).join('\n');
/* Materiais gravados no banco fictício da página (para conferir que nada foi duplicado). */
const stored = p => p.evaluate(async () => {
  const db = await window.claude.use('db');
  return new Promise(r => db.collection('materials').onSnapshot(s => r(s.docs.map(d => ({ id: d.id, ...d.data() })))));
});
const card = (p, title) => p.locator('#imp-drafts .imp-draft').filter({ has: p.locator(`input[value="${title}"]`) });

const main = await startServer({ inject: withDb(data, { persist: true }) });
const browser = await chromium.launch({ executablePath: chromePath(), headless: true });
try {
  for (const [width, theme] of [[1440, 'dark'], [390, 'light']]) {
    const tag = `${width} ${theme}`;
    const ctx = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: theme, reducedMotion: 'reduce' });
    const p = await ctx.newPage(), errors = [];
    p.on('pageerror', e => errors.push(e.message));
    p.on('console', m => m.type() === 'error' && !/fonts\.g|net::ERR/.test(m.text()) && errors.push(m.text()));

    await p.goto(main.url + '#organizar'); await p.waitForSelector('#imp-drafts-note:not(:empty)');
    await p.fill('#imp-text', PASTE); await p.click('#imp-form button[type="submit"]');
    await p.waitForSelector('#imp-preview:not([hidden]) .imp-row');
    const rows = await p.$$eval('#imp-rows .imp-row', els => els.map(e => e.innerText));
    ok(tag + ' prévia: 5 linhas, na ordem colada', rows.length === 5 && /linha 2/i.test(rows[0]) && /linha 6/i.test(rows[4]));
    ok(tag + ' prévia: caminho vira matéria e assunto', rows[0].includes('Vai para: M1 › CIS 1 › Anatomia › Membro superior') && rows[1].includes('Coluna vertebral'));
    ok(tag + ' prévia: pasta do Drive recusada com explicação', /pasta do Drive: cole os links dos arquivos/.test(rows[2]) && /Será ignorada/.test(rows[2]));
    ok(tag + ' prévia: duplicata do catálogo marcada; ligar existe, mas não vem escolhido', /Duplicata: já está no catálogo: “Atlas já cadastrado”/.test(rows[3])
      && await p.inputValue('#imp-rows [data-row="3"]') === 'ignorar' && await p.locator('#imp-rows [data-row="3"] option[value="ligar"]').count() === 1);
    ok(tag + ' prévia: caminho desconhecido e livro no Drive viram pendência, sem criar nada', /Caminho não encontrado/.test(rows[4]) && /Livro deve apontar para editora/.test(rows[4])
      && /Matéria: a escolher/.test(rows[4]));
    ok(tag + ' prévia: título com HTML aparece como texto', rows[4].includes('<b>negrito</b>') && !(await p.locator('#imp-rows b b, #imp-rows .imp-head b > b').count()));
    ok(tag + ' prévia: resumo diz o que vai acontecer', /5 linhas: 3 rascunhos novos, 2 ignoradas \(1 por erro\)\./.test(await p.innerText('#imp-summary'))
      && await p.innerText('#imp-save') === 'Salvar 3 rascunhos');
    await p.locator('#imp-rows [data-row="3"]').focus(); await p.selectOption('#imp-rows [data-row="3"]', 'ligar');
    ok(tag + ' escolher "ligar" avisa que muda material já publicado, no botão e no resumo', /passa a aparecer também em M1 › CIS 1 › Anatomia › Membro inferior, já publicado/.test(await p.locator('#imp-rows .imp-row').nth(3).innerText())
      && await p.innerText('#imp-save') === 'Salvar 3 rascunhos e ligar 1 material' && /1 material já publicado ganha assunto ao salvar/.test(await p.innerText('#imp-summary'))
      && await p.evaluate(() => document.activeElement?.dataset?.row === '3'));
    await p.selectOption('#imp-rows [data-row="3"]', 'ignorar');
    const axe = await new AxeBuilder({ page: p }).include('#import').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    ok(tag + ' WCAG na colagem', axe.violations.length === 0 || (console.log(JSON.stringify(axe.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) })))), false));
    ok(tag + ' sem rolagem lateral e alvos ≥ 44 px', await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1
      && [...document.querySelectorAll('#import button, #import select, #import textarea')].every(e => e.getBoundingClientRect().height >= 44)));
    await p.screenshot({ path: `${out}/previa-${width}-${theme}.png`, fullPage: true });

    await p.click('#imp-save');
    await p.waitForSelector('#imp-drafts .imp-draft');
    await until(p, () => document.querySelectorAll('#imp-drafts .imp-draft').length === 3);
    ok(tag + ' salvar: 3 rascunhos, nada publicado', (await stored(p)).length === data.materials.length && await p.locator('#imp-preview').isHidden());

    await p.reload(); await p.waitForSelector('#imp-drafts .imp-draft');
    ok(tag + ' recarregar mantém os rascunhos', await p.locator('#imp-drafts .imp-draft').count() === 3);
    await p.screenshot({ path: `${out}/rascunhos-${width}-${theme}.png`, fullPage: true });

    // Livro no Drive e sem matéria: publicar é recusado e explica o que falta.
    await card(p, 'Livro em PDF <b>negrito</b>').getByRole('button', { name: 'Publicar' }).click();
    await until(p, () => /Não dá para publicar/.test(document.querySelector('#imp-status').textContent));
    ok(tag + ' livro no Drive não publica, diz por quê e leva o foco ao motivo', /Falta para publicar: .*Falta escolher a matéria.*Livro deve apontar/.test(await card(p, 'Livro em PDF <b>negrito</b>').locator('.imp-block').innerText())
      && await p.evaluate(() => document.activeElement?.classList.contains('imp-block')));

    await card(p, 'Aula de ombro').getByRole('button', { name: 'Publicar' }).click();
    await until(p, () => document.querySelectorAll('#imp-drafts .imp-draft').length === 2);
    ok(tag + ' depois de publicar, o foco vai ao rascunho seguinte', await p.evaluate(() => document.activeElement?.matches('#imp-drafts .imp-draft h4')));
    // Erro no meio (ligação ao assunto): o material já foi criado; publicar de novo completa sem duplicar.
    await p.evaluate(() => { window.__mockFail = 'material_topics/'; });
    await card(p, 'Resumo de coluna').getByRole('button', { name: 'Publicar' }).click();
    await p.waitForSelector('.toast.error');
    ok(tag + ' erro no meio: o rascunho continua para tentar de novo', await card(p, 'Resumo de coluna').count() === 1);
    await card(p, 'Resumo de coluna').getByRole('button', { name: 'Publicar' }).click();
    await until(p, () => document.querySelectorAll('#imp-drafts .imp-draft').length === 1);
    const all = await stored(p);
    ok(tag + ' publicar de novo não duplica', all.filter(m => m.url.includes('COLUNA2')).length === 1 && all.filter(m => m.url.includes('OMBRO1')).length === 1);
    ok(tag + ' material guarda o link com a resourcekey e a fonte do Drive', all.some(m => m.url === 'https://drive.google.com/file/d/COLUNA2/view?resourcekey=0-k2' && m.source === 'Google Drive'));

    await p.goto(main.url + '#a-cis1-anat/membro-superior'); await p.waitForSelector('#topic-tabs [aria-pressed="true"]');
    ok(tag + ' publicado aparece na aba do assunto certo', await p.locator('#materials .material', { hasText: 'Aula de ombro' }).count() === 1);
    await p.locator('#topic-tabs [data-tab="coluna-vertebral"]').click();
    ok(tag + ' e o outro na aba dele', await p.locator('#materials .material', { hasText: 'Resumo de coluna' }).count() === 1
      && await p.locator('#materials .material', { hasText: 'Aula de ombro' }).count() === 0);

    // Colar o mesmo lote de novo: tudo vira duplicata.
    await p.goto(main.url + '#organizar'); await p.waitForSelector('#imp-drafts .imp-draft');
    await p.fill('#imp-text', PASTE); await p.click('#imp-form button[type="submit"]'); await p.waitForSelector('#imp-rows .imp-row');
    const again = await p.$$eval('#imp-rows .imp-row', els => els.map(e => e.innerText));
    ok(tag + ' colar de novo: publicados e rascunho viram duplicata', /já está no catálogo: “Aula de ombro”/.test(again[0]) && /já está no catálogo: “Resumo de coluna”/.test(again[1])
      && /já há um rascunho deste arquivo/.test(again[4]) && /5 linhas: 0 rascunhos novos/.test(await p.innerText('#imp-summary')));

    // Ignorar oferece Desfazer.
    await card(p, 'Livro em PDF <b>negrito</b>').getByRole('button', { name: 'Ignorar' }).click();
    await until(p, () => !document.querySelector('#imp-drafts .imp-draft'));
    await p.locator('.toast button', { hasText: 'Desfazer' }).click();
    await until(p, () => document.querySelectorAll('#imp-drafts .imp-draft').length === 1);
    ok(tag + ' Ignorar tem Desfazer', true);

    ok(tag + ' sem erros no console', errors.filter(e => !/falha de teste/.test(e)).length === 0 || (console.log(errors), false));
    await p.evaluate(() => localStorage.clear());
    await ctx.close();
  }
} finally { await browser.close(); main.server.close(); }
console.log(`\n${checks.length} verificações aprovadas.`);
