// U6 · Busca rápida: resultado com caminho curto (unidade › matéria · assunto), tipo à direita e chave estável
// para não refazer a lista quando o texto buscado não mudou.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { materialLine, areaLine, searchKey } from '../../src/domain/search.js';

const path = [{ id: 'm1', name: 'M1' }, { id: 'cis1', name: 'CIS 1' }, { id: 'anat', name: 'Anatomia' }];

test('material: caminho curto com unidade › matéria e assunto; tipo vai para a direita', () => {
  const line = materialLine({ subject: 'Membro superior', type: 'Caso clínico' }, path, { otherAcervo: '' });
  assert.equal(line.sub, 'CIS 1 › Anatomia · Membro superior');
  assert.equal(line.right, 'Caso clínico');
});

test('material de outro acervo leva o nome do acervo no começo', () => {
  assert.equal(materialLine({ subject: '', type: 'Livro' }, path, { otherAcervo: 'Medicina geral' }).sub, 'Medicina geral · CIS 1 › Anatomia');
});

test('caminho de um nível só e material sem área', () => {
  assert.equal(materialLine({ subject: 'X', type: '' }, [{ name: 'Farmacologia' }], { otherAcervo: '' }).sub, 'Farmacologia · X');
  assert.equal(materialLine({ type: 'Slides' }, [], { otherAcervo: '' }).sub, 'Sem área definida');
  assert.equal(materialLine({}, path, { otherAcervo: '' }).right, 'Link');
});

test('assunto igual ao nome da matéria não se repete', () => {
  assert.equal(materialLine({ subject: 'Anatomia', type: 'Slides' }, path, { otherAcervo: '' }).sub, 'CIS 1 › Anatomia');
});

test('área: título é o nome; o caminho acima vira a linha de baixo', () => {
  assert.deepEqual(areaLine(path, '3 materiais'), { title: 'Anatomia', sub: 'M1 › CIS 1 · 3 materiais' });
  assert.deepEqual(areaLine([{ name: 'M1' }], '7 materiais'), { title: 'M1', sub: '7 materiais' });
});

test('chave da busca ignora acento, caixa e espaços extras', () => {
  assert.equal(searchKey('  Anatomía   MEMBRO '), searchKey('anatomia membro'));
  assert.notEqual(searchKey('anatomia'), searchKey('anatomia m'));
});
