// N1 · Gravar assuntos e ligações: diferença de ligações, slug com colisão, texto antigo "subject" e chave composta.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { linkDiff, linkId, parseLinkId, planTopic, freeSlug, subjectFor, linkedTopics, RESERVED_SLUGS } from '../../src/domain/topic-edit.js';

const topics = [
  { id: 't1', areaId: 'anat', name: 'Membro superior', slug: 'membro-superior', order: 0, slugAliases: [] },
  { id: 't2', areaId: 'anat', name: 'Coluna vertebral', slug: 'coluna-vertebral', order: 1, slugAliases: ['coluna'] },
  { id: 't3', areaId: 'anat', name: 'Membro inferior', slug: 'membro-inferior', order: 4, slugAliases: [] },
  { id: 'e1', areaId: 'embrio', name: 'Gametogênese', slug: 'gametogenese', order: 0, slugAliases: [] },
];

test('diferença de ligações: insere só o que falta e remove só o que saiu', () => {
  assert.deepEqual(linkDiff(['t1', 't2'], ['t2', 't3']), { add: ['t3'], remove: ['t1'] });
  assert.deepEqual(linkDiff(['t1'], ['t1']), { add: [], remove: [] });
  assert.deepEqual(linkDiff([], ['t1', 't1', 't2']), { add: ['t1', 't2'] , remove: [] });
  assert.deepEqual(linkDiff(['t1', 't2'], []), { add: [], remove: ['t1', 't2'] });
});

test('chave composta material:assunto vai e volta, sem ambiguidade mesmo com o separador nos ids', () => {
  assert.equal(linkId('m1', 't1'), 'm1:t1');
  assert.deepEqual(parseLinkId('m1:t1'), { materialId: 'm1', topicId: 't1' });
  for (const [m, t] of [['a:b', 'c'], ['a', 'b:c'], ['a%3A', 'b'], ['x/y', 'z%'], ['3f1c-uuid', '9a2b-uuid']]) {
    assert.deepEqual(parseLinkId(linkId(m, t)), { materialId: m, topicId: t }, `${m} | ${t}`);
  }
  assert.notEqual(linkId('a:b', 'c'), linkId('a', 'b:c'));
  assert.equal(parseLinkId('sem-dois-pontos'), null);
  assert.equal(parseLinkId(':t1'), null);
  assert.equal(parseLinkId('a:b:c'), null, 'separador cru a mais é recusado');
  assert.equal(parseLinkId('m1:%E0%A4%A'), null, 'codificação quebrada é recusada');
});

test('novo assunto: slug do nome e ordem = máximo + 1', () => {
  assert.deepEqual(planTopic('anat', 'Cabeça e pescoço', topics).fields,
    { areaId: 'anat', name: 'Cabeça e pescoço', slug: 'cabeca-e-pescoco', slugAliases: [], order: 5 });
  assert.equal(planTopic('histo', 'Epitélio', topics).fields.order, 0);
});

test('slug com colisão ganha -2, -3…, inclusive contra slugs antigos e reservados', () => {
  assert.equal(planTopic('anat', 'Coluna', topics).fields.slug, 'coluna-2');
  assert.equal(freeSlug('Membro superior', new Set(['membro-superior', 'membro-superior-2'])), 'membro-superior-3');
  for (const r of RESERVED_SLUGS) assert.equal(freeSlug(r, new Set()), r + '-2');
  assert.equal(planTopic('anat', 'Casos', topics).fields.slug, 'casos-2');
  assert.equal(planTopic('anat', '!!!', topics).fields.slug, 'assunto');
  // o mesmo slug em outra matéria não conta
  assert.equal(planTopic('embrio', 'Membro superior', topics).fields.slug, 'membro-superior');
});

test('nome igual ao de um assunto da matéria (sem acento, caixa ou espaço) devolve o existente', () => {
  assert.equal(planTopic('anat', '  membro   SUPERIOR ', topics).existing.id, 't1');
  assert.equal(planTopic('embrio', 'Gametogenese', topics).existing.id, 'e1');
  assert.ok(planTopic('anat', 'Gametogenese', topics).fields, 'assunto de outra matéria não conta');
});

test('nome do assunto: limpo, obrigatório, até 80 caracteres e só dentro de uma matéria', () => {
  assert.equal(planTopic('anat', ' Tórax  ', topics).fields.name, 'Tórax');
  assert.equal(planTopic('anat', 'Tórax', topics).fields.name, 'Tórax', 'NFC');
  assert.ok(planTopic('anat', '   ', topics).error);
  assert.ok(planTopic('', 'Tórax', topics).error);
  assert.ok(planTopic('anat', 'x'.repeat(81), topics).error);
  assert.ok(planTopic('anat', 'x'.repeat(80), topics).fields);
});

test('texto antigo subject = primeiro assunto da matéria principal, por ordem e depois id', () => {
  const extra = [...topics, { id: 't0', areaId: 'anat', name: 'Empate antes', order: 4 }, { id: 'o1', areaId: 'orto', name: 'Ortopedia geral', order: -1 }];
  assert.equal(subjectFor(['t3', 't2'], topics, 'anat'), 'Coluna vertebral');
  assert.equal(subjectFor(['t3', 't0'], extra, 'anat'), 'Empate antes', 'mesma ordem: menor id');
  assert.equal(subjectFor(['o1', 't3'], extra, 'anat'), 'Membro inferior', 'assunto de outra matéria não conta');
  assert.equal(subjectFor(['o1'], extra, 'anat'), '');
  assert.equal(subjectFor([], topics, 'anat'), '');
  assert.equal(subjectFor(['sumiu'], topics, 'anat'), '');
  const links = [{ materialId: 'm1', topicId: 't3' }, { materialId: 'm1', topicId: 't1' }, { materialId: 'm2', topicId: 't2' }];
  assert.deepEqual(linkedTopics('m1', links, topics).map(t => t.id), ['t1', 't3']);
});
