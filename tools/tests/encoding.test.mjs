// Detector de acentos corrompidos: pega "refer?ncia" e "Ã§", deixa passar ? legítimo de URL e de código.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findMojibake } from '../encoding.mjs';

const hits = text => findMojibake(text).map(h => h.sample);

test('acha acento trocado por ? em texto corrido', () => {
  assert.equal(findMojibake('Dos livros de refer?ncia\n?s suas anota??es').length, 2);
  assert.equal(findMojibake('Medida de leitura e n?meros').length, 1);
});

test('acha caractere de substituição e UTF-8 lido como Latin-1', () => {
  assert.equal(findMojibake('cora' + String.fromCharCode(0xFFFD) + 'ão').length, 1);
  assert.equal(findMojibake('ediÃ§Ã£o').length, 1);
});

test('acha maiúsculas corrompidas pelo cp1252 do Windows', () => {
  for (const s of ['AÃ‡ÃƒO', 'NÃ“S', 'Ã‰ ISSO', 'VOCÃŠ', 'Ã€s vezes', 'NÃ£o']) assert.equal(findMojibake(s).length, 1, s);
});

test('informa a linha', () => {
  assert.equal(findMojibake('ok\nok\nleg?tima')[0].line, 3);
});

test('não acusa ? legítimo', () => {
  const ok = [
    'https://drive.google.com/file/d/x/view?usp=sharing',
    'fetch(`/api?acervo=${a}`)',
    'const x = a ? b : c;',
    'const y = obj?.campo ?? "";',
    'const re = /https?:\\/\\//;',
    'O que você vai estudar hoje?',
    'Você estuda hoje?Sim.',
    'Continua acentuado: referência, anotações, edição.',
  ];
  for (const line of ok) assert.deepEqual(hits(line), [], line);
});
