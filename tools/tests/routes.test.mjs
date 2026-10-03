// N5 · Conceito corpo: cada disciplina vai para um destino; Cardiologia aponta para o coração, nunca para o pulmão.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { destinationsFor, DESTINATIONS } from '../../src/body/routes.js';

const mods = names => names.map((name, index) => ({ id: 'g' + index, name, index }));
const byName = (list, out) => Object.fromEntries(list.map((m, i) => [m.name, out[i]]));

test('Cardiologia (e variações) vai para o coração', () => {
  for (const name of ['Cardiologia', 'Cardiologia clínica', 'CARDIOLOGIA', 'Semiologia cardiovascular']) {
    const list = mods(['Anatomia', name]);
    assert.equal(byName(list, destinationsFor(list))[name], 'coracao', name);
  }
});

test('destino coração existe, termina no coração do modelo e acende a malha "heart"', () => {
  const heart = DESTINATIONS.coracao;
  assert.ok(heart && heart.label === 'Coração' && heart.organ.includes('heart'));
  const box = JSON.parse(fs.readFileSync(new URL('../../src/body/anatomy.json', import.meta.url), 'utf8')).heart;
  const end = heart.route.at(-1);
  assert.ok(end.every((v, k) => v >= box.min[k] - 0.01 && v <= box.max[k] + 0.01), 'a ponta da artéria fica no coração: ' + end);
});

test('a mesma lista em outra ordem dá os mesmos destinos a cada disciplina', () => {
  const names = ['Neuroanatomia', 'Cardiologia', 'Histologia', 'Bioquímica', 'Anatomia', 'Genética', 'Fisiologia', 'Embriologia', 'Patologia'];
  const a = mods(names), want = byName(a, destinationsFor(a));
  for (let k = 0; k < 5; k++) {
    // embaralha a ordem do array, mas cada disciplina mantém o seu índice no curso
    const shuffled = [...a].sort((x, y) => ((x.index * 7 + k * 3) % names.length) - ((y.index * 7 + k * 3) % names.length));
    assert.deepEqual(byName(shuffled, destinationsFor(shuffled)), want, 'rodada ' + k);
  }
});

test('nome casado pelo assunto não perde o destino para um nome desconhecido que veio antes', () => {
  const list = mods(['Bioquímica', 'Genética', 'Ética', 'Saúde coletiva', 'Psicologia', 'Neuroanatomia']);
  assert.equal(byName(list, destinationsFor(list)).Neuroanatomia, 'cerebro');
});

test('nome desconhecido recebe um destino livre (sem repetir enquanto houver)', () => {
  const list = mods(['Bioquímica', 'Genética', 'Cardiologia']);
  const out = destinationsFor(list);
  assert.equal(new Set(out).size, 3);
  assert.ok(out.every(k => DESTINATIONS[k]));
  assert.notEqual(byName(list, out).Bioquímica, 'coracao');
});

test('ordem padrão do curso continua: M1 vai para o pé', () => {
  const list = mods(['M1', 'M2', 'M3']);
  assert.deepEqual(destinationsFor(list), ['pe', 'mao', 'cerebro']);
});
