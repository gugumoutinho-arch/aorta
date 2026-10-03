// N3 · Detector de quase-duplicatas de assunto: só sugere, nunca une sozinho.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { similarKey, levenshtein, areSimilar, findSimilar } from '../../src/domain/similar.js';

test('casos obrigatórios do dono', () => {
  assert.ok(areSimilar('Membro sup.', 'Membro superior'));
  assert.ok(!areSimilar('Membro superior', 'Membro inferior'));
  assert.ok(areSimilar('Gametogênese', 'Gametogenese'));
  assert.ok(!areSimilar('1ª semana', '2ª semana'));
});

test('normalização: NFC, espaços, caixa, acentos, pontuação e abreviações aprovadas', () => {
  assert.equal(similarKey('  Membro   Sup. '), 'membro superior');
  assert.equal(similarKey('Gametógênese'), 'gametogenese');
  assert.equal(similarKey('MMSS'), 'membro superior');
  assert.equal(similarKey('mmii'), 'membro inferior');
  assert.equal(similarKey('Membro inf'), 'membro inferior');
  assert.equal(similarKey('Coluna (revisão)!'), 'coluna revisao');
  // abreviação só vale como palavra inteira
  assert.equal(similarKey('Superfície'), 'superficie');
});

test('Levenshtein', () => {
  assert.equal(levenshtein('', 'abc'), 3);
  assert.equal(levenshtein('coluna', 'coluna'), 0);
  assert.equal(levenshtein('placentacao', 'placentaçao'.normalize('NFD').replace(/\p{M}/gu, '')), 0);
  assert.equal(levenshtein('kitten', 'sitting'), 3);
});

test('parecido por distância (até 12% do maior nome, no mínimo 1) ou por palavras (Jaccard ≥ 0,8)', () => {
  assert.ok(areSimilar('Placentação', 'Placentaçao'));
  assert.ok(areSimilar('Coluna vertebal', 'Coluna vertebral'), 'erro de digitação');
  assert.ok(areSimilar('Cabeça e pescoço', 'Pescoço e cabeça'), 'mesmas palavras em outra ordem');
  assert.ok(areSimilar('Cabeça pescoço', 'Cabeça e pescoço'), 'conectivo não conta');
  assert.ok(!areSimilar('Coluna', 'Colon'));
  assert.ok(!areSimilar('Membro superior direito', 'Membro superior'));
  assert.ok(!areSimilar('Tórax', 'Abdome'));
});

test('veto: direções anatômicas opostas nunca são parecidas', () => {
  for (const [a, b] of [['superior', 'inferior'], ['medial', 'lateral'], ['direito', 'esquerdo'], ['anterior', 'posterior'], ['proximal', 'distal'], ['cranial', 'caudal']]) {
    assert.ok(!areSimilar(`Compartimento ${a}`, `Compartimento ${b}`), `${a} × ${b}`);
  }
  assert.ok(!areSimilar('Mão direita', 'Mão esquerda'));
  assert.ok(!areSimilar('MMSS', 'Membros inferiores'));
  assert.ok(!areSimilar('Membros superiores e inferiores', 'Membros superiores'));
  assert.ok(areSimilar('Membros superiores', 'MMSS'));
});

test('veto: números e algarismos romanos diferentes não são o mesmo assunto', () => {
  assert.ok(!areSimilar('Semana 3', 'Semana 8'));
  assert.ok(!areSimilar('Fisiologia I', 'Fisiologia II'));
  assert.ok(areSimilar('3ª semana', '3a semana'));
});

test('busca só dentro da mesma matéria e devolve os mais parecidos primeiro', () => {
  const topics = [
    { id: 't1', areaId: 'anat', name: 'Membro superior' },
    { id: 't2', areaId: 'anat', name: 'Membro inferior' },
    { id: 't3', areaId: 'anat', name: 'Membros superiores' },
    { id: 'e1', areaId: 'embrio', name: 'Membro superior' },
  ];
  assert.deepEqual(findSimilar('Membro sup.', 'anat', topics).map(t => t.id), ['t1', 't3'], 'singular e plural do vocabulário');
  assert.deepEqual(findSimilar('MMSS', 'anat', topics).map(t => t.id).sort(), ['t1', 't3'], 'plural e abreviação pelo vocabulário');
  assert.deepEqual(findSimilar('Membro superior', 'histo', topics), []);
  assert.deepEqual(findSimilar('', 'anat', topics), []);
});

test('vocabulário explícito de plural: membros superiores ~ membro superior, sem misturar direções', () => {
  assert.equal(similarKey('Membros superiores'), 'membro superior');
  assert.ok(areSimilar('MMSS', 'Membro superior'));
  assert.ok(areSimilar('Membros inferiores', 'MMII'));
  assert.ok(!areSimilar('Membros superiores', 'Membro inferior'));
});

test('Unicode composto e decomposto dão o mesmo resultado', () => {
  const nfc = 'Gametogênese'.normalize('NFC'), nfd = 'Gametogênese'.normalize('NFD');
  assert.notEqual(nfc, nfd);
  assert.ok(areSimilar(nfc, nfd));
  assert.equal(similarKey(nfd), similarKey(nfc));
  assert.deepEqual(findSimilar(nfd, 'embrio', [{ id: 'g', areaId: 'embrio', name: nfc }]).map(t => t.id), ['g']);
});

test('unicidade usa topicNorm (a regra do banco); a semelhança só sugere', async () => {
  const { planTopic } = await import('../../src/domain/topic-edit.js');
  const { topicNorm } = await import('../../src/domain/topics.js');
  const topics = [{ id: 't1', areaId: 'anat', name: 'Membro superior', slug: 'membro-superior', order: 0 }];
  assert.equal(planTopic('anat', 'MEMBRO  superior', topics).existing.id, 't1', 'mesmo topicNorm = mesmo assunto');
  assert.ok(planTopic('anat', 'Membro sup.', topics).fields, 'parecido não é igual: o banco aceitaria, a tela só sugere');
  assert.ok(areSimilar('Membro sup.', 'Membro superior'));
  assert.equal(topicNorm('Gametogênese'.normalize('NFD')) === topicNorm('Gametogênese'), false, 'o banco também não une decomposto; por isso planTopic normaliza para NFC antes');
  assert.equal(planTopic('embrio', 'Gametogênese'.normalize('NFD'), [{ id: 'g', areaId: 'embrio', name: 'Gametogênese', slug: 'gametogenese' }]).existing.id, 'g');
});
