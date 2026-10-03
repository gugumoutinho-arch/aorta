// Abas de assunto dentro da matéria (C-19): mesma normalização do banco, contagens, casos clínicos e rotas.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { topicNorm, topicSlug, tabContext, topicTabs, inTab, firstTopicName, parseAreaRoute, areaRoute, CASES } from '../../src/domain/topics.js';

const topics = [
  { id: 't-sup', areaId: 'anat', name: 'Membro superior', slug: 'membro-superior', order: 0 },
  { id: 't-col', areaId: 'anat', name: 'Coluna vertebral', slug: 'coluna-vertebral', order: 1 },
  { id: 't-inf', areaId: 'anat', name: 'Membro inferior', slug: 'membro-inferior', order: 2, slugAliases: ['membro-inf'] },
  { id: 't-vazio', areaId: 'anat', name: 'Cabeça e pescoço', slug: 'cabeca-e-pescoco', order: 3 },
  { id: 't-outra', areaId: 'embrio', name: 'Gametogênese', slug: 'gametogenese', order: 0 },
];
const materials = [
  { id: 'm1', areaId: 'anat', type: 'Slides' },
  { id: 'm2', areaId: 'anat', type: 'Caso clínico' },
  { id: 'm3', areaId: 'anat', type: 'Caso clínico' },
  { id: 'm4', areaId: 'anat', type: 'Resumo', subject: 'Coluna (texto antigo)' },
  { id: 'm5', areaId: 'anat', type: 'Livro', subject: 'Atlas' },
];
const links = [
  { materialId: 'm1', topicId: 't-sup' }, { materialId: 'm2', topicId: 't-sup' },
  { materialId: 'm3', topicId: 't-inf' }, { materialId: 'm4', topicId: 't-col' },
  { materialId: 'm2', topicId: 't-col' }, { materialId: 'm9', topicId: 't-outra' },
];
const ctx = tabContext({ areaId: 'anat', topics, links });

test('normalização e slug iguais aos do banco (private.topic_norm / topic_slug)', () => {
  assert.equal(topicNorm('  Membro   Superior '), 'membro superior');
  assert.equal(topicNorm('Gametogênese'), 'gametogenese');
  assert.equal(topicSlug('1ª e 2ª semanas'), '1a-e-2a-semanas');
  assert.equal(topicSlug('Placentação'), 'placentacao');
  assert.equal(topicSlug('Coluna vertebral (revisão)'), 'coluna-vertebral-revisao');
});

test('contexto: só assuntos da matéria, em ordem, e índice material → assuntos', () => {
  assert.deepEqual(ctx.own.map(t => t.id), ['t-sup', 't-col', 't-inf', 't-vazio']);
  assert.deepEqual([...ctx.index.get('m2')].sort(), ['t-col', 't-sup']);
  assert.equal(ctx.bySlug.get('membro-inf').id, 't-inf');
});

test('abas: Todos, assuntos da matéria em ordem com contagem, e Casos clínicos', () => {
  const tabs = topicTabs(ctx, materials);
  assert.deepEqual(tabs.map(t => [t.key, t.count]), [
    ['', 5], ['membro-superior', 2], ['coluna-vertebral', 2], ['membro-inferior', 1], ['cabeca-e-pescoco', 0], [CASES, 2],
  ]);
  assert.equal(tabs.at(-1).label, 'Casos clínicos');
});

test('sem assuntos na matéria não há abas; sem casos não há aba de casos', () => {
  assert.deepEqual(topicTabs(tabContext({ areaId: 'histo', topics, links }), []), []);
  assert.ok(!topicTabs(ctx, materials.filter(m => m.type !== 'Caso clínico')).some(t => t.key === CASES));
});

test('caso clínico aparece na aba do assunto e na de casos; Todos não repete', () => {
  assert.deepEqual(materials.filter(m => inTab(m, 'membro-superior', ctx)).map(m => m.id), ['m1', 'm2']);
  assert.deepEqual(materials.filter(m => inTab(m, 'coluna-vertebral', ctx)).map(m => m.id), ['m2', 'm4']);
  assert.deepEqual(materials.filter(m => inTab(m, CASES, ctx)).map(m => m.id), ['m2', 'm3']);
  assert.equal(materials.filter(m => inTab(m, '', ctx)).length, 5);
  assert.equal(materials.filter(m => inTab(m, 'nao-existe', ctx)).length, 0);
});

test('slug antigo continua levando ao assunto', () => {
  assert.deepEqual(materials.filter(m => inTab(m, 'membro-inf', ctx)).map(m => m.id), ['m3']);
});

test('grupo de cada material: primeiro assunto ligado na ordem da matéria, senão o texto antigo', () => {
  assert.equal(firstTopicName(materials[1], ctx), 'Membro superior');
  assert.equal(firstTopicName(materials[3], ctx), 'Coluna vertebral');
  assert.equal(firstTopicName(materials[4], ctx), 'Atlas');
});

test('rota: área com e sem aba; hash antigo continua valendo', () => {
  assert.deepEqual(parseAreaRoute('cis1-anat'), { areaId: 'cis1-anat', tab: '' });
  assert.deepEqual(parseAreaRoute('cis1-anat/membro-superior'), { areaId: 'cis1-anat', tab: 'membro-superior' });
  assert.deepEqual(parseAreaRoute('cis1-anat/casos'), { areaId: 'cis1-anat', tab: CASES });
  assert.deepEqual(parseAreaRoute('cis1-anat/Membro Superior/'), { areaId: 'cis1-anat', tab: 'membro-superior' });
  assert.equal(areaRoute('cis1-anat', ''), 'a-cis1-anat');
  assert.equal(areaRoute('cis1-anat', 'membro-superior'), 'a-cis1-anat/membro-superior');
});

test('desempenho: 1000 materiais × 15 abas com 2000 ligações em menos de 100 ms', () => {
  const many = Array.from({ length: 15 }, (_, i) => ({ id: 'x' + i, areaId: 'big', name: 'Assunto ' + i, slug: 'assunto-' + i, order: i }));
  const mats = Array.from({ length: 1000 }, (_, i) => ({ id: 'mm' + i, areaId: 'big', type: i % 7 ? 'Slides' : 'Caso clínico' }));
  const lk = mats.flatMap((m, i) => [{ materialId: m.id, topicId: 'x' + (i % 15) }, { materialId: m.id, topicId: 'x' + ((i + 3) % 15) }]);
  const t0 = performance.now();
  const c = tabContext({ areaId: 'big', topics: many, links: lk });
  const tabs = topicTabs(c, mats);
  mats.forEach(m => firstTopicName(m, c));
  assert.equal(tabs.length, 17);
  assert.ok(performance.now() - t0 < 100, `levou ${(performance.now() - t0).toFixed(0)} ms`);
});
