// Tokens de movimento: CSS é a fonte, mas uma leitura antes da folha carregar não pode travar NaN.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseMotionTokens, MOTION_DEFAULTS } from '../../src/ui/tokens.js';

const reader = values => name => values[name] ?? '';

test('lê durações em ms do CSS e converte para segundos', () => {
  const t = parseMotionTokens(reader({ enter: '720ms', reveal: '480ms', swap: '320ms', exit: '180ms', release: '240ms', press: '100ms', 'ease-enter': 'expo.out', 'ease-respond': 'power2.out' }));
  assert.equal(t.enter, .72);
  assert.equal(t.press, .1);
  assert.equal(t.easeEnter, 'expo.out');
  assert.equal(t.complete, true);
});

test('sem CSS carregado, usa os padrões e marca a leitura como incompleta', () => {
  const t = parseMotionTokens(reader({}));
  assert.deepEqual({ ...t, complete: undefined }, { ...MOTION_DEFAULTS, complete: undefined });
  assert.equal(t.complete, false);
  for (const k of ['enter', 'reveal', 'swap', 'exit', 'release', 'press']) assert.ok(Number.isFinite(t[k]), k);
});

test('valor inválido cai no padrão só daquele token', () => {
  const t = parseMotionTokens(reader({ enter: 'abc', swap: '-5ms', press: '90ms' }));
  assert.equal(t.enter, MOTION_DEFAULTS.enter);
  assert.equal(t.swap, MOTION_DEFAULTS.swap);
  assert.equal(t.press, .09);
  assert.equal(t.complete, false);
});

test('aceita segundos além de milissegundos', () => {
  assert.equal(parseMotionTokens(reader({ enter: '.5s' })).enter, .5);
});
