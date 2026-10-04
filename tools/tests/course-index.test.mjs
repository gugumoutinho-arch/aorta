// U2 · Índice editorial do início: linhas numeradas por matéria (IDOMED) ou disciplina (Medicina geral).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { courseIndex, indexStats, caseTitle } from '../../src/domain/course-index.js';

const areas = [
  { id: 'm1', name: 'M1', parentId: '', order: 1 }, { id: 'm2', name: 'M2', parentId: '', order: 2 }, { id: 'm3', name: 'M3', parentId: '', order: 3 },
  { id: 'cis1', name: 'CIS 1', parentId: 'm1', order: 1 }, { id: 'bbio1', name: 'BBIO 1', parentId: 'm1', order: 2 },
  { id: 'anat', name: 'Anatomia', parentId: 'cis1', order: 2 }, { id: 'embrio', name: 'Embriologia', parentId: 'cis1', order: 1 },
  { id: 'pm', name: 'Práticas Médicas', parentId: 'cis1', order: 3 }, { id: 'cis2', name: 'CIS 2', parentId: 'm2', order: 1 },
];
const mods = ['m1', 'm2', 'm3'].map((id, i) => ({ id, name: 'M' + (i + 1), token: '--m' + (i + 1) }));
const materials = [
  { id: 'a', areaId: 'anat', type: 'Slides' }, { id: 'b', areaId: 'anat', type: 'Caso clínico' }, { id: 'c', areaId: 'embrio', type: 'Resumo' },
  { id: 'd', areaId: 'bbio1', type: 'Slides' }, { id: 'e', areaId: 'cis2', type: 'Caso clínico' },
];
const topics = [{ id: 't1', areaId: 'anat', name: 'Membro superior', order: 0 }, { id: 't2', areaId: 'anat', name: 'Coluna', order: 1 }];

test('IDOMED: um grupo por módulo com material, uma linha por matéria, numeração contínua na ordem do curso', () => {
  const { groups, waiting } = courseIndex({ areas, materials, topics, acervo: 'idomed', modules: mods });
  assert.deepEqual(groups.map(g => g.module.id), ['m1', 'm2']);
  assert.deepEqual(groups[0].rows.map(r => [r.num, r.name, r.count]), [['01', 'Embriologia', 1], ['02', 'Anatomia', 2], ['03', 'Práticas Médicas', 0], ['04', 'BBIO 1', 1]]);
  assert.deepEqual(groups[1].rows.map(r => [r.num, r.name]), [['05', 'CIS 2']], 'unidade sem matérias vira a própria linha');
  assert.deepEqual(waiting.map(m => m.id), ['m3']);
});

test('resumo: assuntos na ordem do editor; sem assuntos, a unidade; sem material, "Em produção"', () => {
  const rows = courseIndex({ areas, materials, topics, acervo: 'idomed', modules: mods }).groups[0].rows;
  assert.equal(rows[1].summary, 'Membro superior, Coluna');
  assert.equal(rows[0].summary, 'CIS 1');
  assert.equal(rows[2].summary, 'Em produção'); assert.equal(rows[2].live, false);
});

test('Medicina geral: uma linha por disciplina, com as unidades que têm material no resumo', () => {
  const g = [{ id: 'd1', name: 'Anatomia', parentId: '' }, { id: 'd1l', name: 'Livros de referência', parentId: 'd1', order: 1 }, { id: 'd1p', name: 'Materiais próprios', parentId: 'd1', order: 2 }, { id: 'd2', name: 'Fisiologia', parentId: '' }];
  const out = courseIndex({ areas: g, materials: [{ areaId: 'd1l' }], acervo: 'geral', modules: [{ id: 'd1', name: 'Anatomia', token: '--m1' }, { id: 'd2', name: 'Fisiologia', token: '--m2' }] });
  assert.equal(out.groups.length, 1); assert.equal(out.groups[0].module, null);
  assert.deepEqual(out.groups[0].rows.map(r => [r.num, r.name, r.summary]), [['01', 'Anatomia', 'Livros de referência']]);
  assert.deepEqual(out.waiting.map(m => m.id), ['d2']);
});

test('números do índice e título curto do caso', () => {
  assert.deepEqual(indexStats({ materials, topics, areaIds: new Set(['anat']) }), { materials: 5, topics: 2, cases: 2 });
  assert.equal(caseTitle('Caso clínico — luxação do ombro'), 'Luxação do ombro');
  assert.equal(caseTitle('caso clinico: fratura'), 'Fratura');
  assert.equal(caseTitle('Introdutório — infertilidade'), 'Introdutório — infertilidade');
  assert.equal(caseTitle(''), '(sem título)');
});

test('acervo vazio: sem grupos', () => {
  assert.deepEqual(courseIndex({ areas: [], materials: [], acervo: 'idomed', modules: [] }), { groups: [], waiting: [] });
});
