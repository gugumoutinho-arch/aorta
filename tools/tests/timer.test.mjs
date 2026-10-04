// U8 · Temporizador que pausa: o aviso com "Desfazer" não some enquanto há cursor ou foco nele.
import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { pausableTimer } from '../../src/ui/timer.js';

test('dispara no tempo quando ninguém pausa', () => {
  mock.timers.enable({ apis: ['setTimeout', 'Date'] });
  let done = 0; pausableTimer(10000, () => done++);
  mock.timers.tick(9999); assert.equal(done, 0);
  mock.timers.tick(1); assert.equal(done, 1);
  mock.timers.reset();
});

test('pausado não dispara, por mais tempo que passe; ao retomar, ainda resta o que faltava (no mínimo o piso)', () => {
  mock.timers.enable({ apis: ['setTimeout', 'Date'] });
  let done = 0; const t = pausableTimer(10000, () => done++, { minAfterResume: 3000 });
  mock.timers.tick(8000); t.pause();
  mock.timers.tick(60000); assert.equal(done, 0);
  t.resume();
  mock.timers.tick(2999); assert.equal(done, 0, 'restavam 2 s, mas o piso garante 3 s depois de sair');
  mock.timers.tick(1); assert.equal(done, 1);
  mock.timers.reset();
});

test('cancelar impede o disparo; pausar e retomar duas vezes não duplica', () => {
  mock.timers.enable({ apis: ['setTimeout', 'Date'] });
  let done = 0; const t = pausableTimer(5000, () => done++);
  t.pause(); t.pause(); t.resume(); t.resume();
  mock.timers.tick(5000); assert.equal(done, 1);
  const c = pausableTimer(5000, () => done++); c.cancel(); mock.timers.tick(10000); assert.equal(done, 1);
  mock.timers.reset();
});
