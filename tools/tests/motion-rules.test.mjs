// U1 · Régua do movimento: fixtures positivas (devem acusar) e negativas (devem passar).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { motionFindings } from '../motion-rules.mjs';

const rules = (src, file = 'src/views/x.js') => motionFindings(src, file).map(f => f.rule);

test('interface: duração literal acusa; tokens, zero e expressões passam', () => {
  assert.deepEqual(rules('gsap.to(el, { opacity: 1, duration: .38, ease: "power2.out" });'), ['duração']);
  assert.deepEqual(rules('tl.fromTo(a, { y: 8 }, { y: 0, duration: 0.7 }, .15);'), ['duração']);
  assert.deepEqual(rules('gsap.to(el, { scale: 1, duration: 2 });', 'src/ui/x.js'), ['duração']);
  assert.deepEqual(rules('gsap.to(el, { duration: motionTokens().swap, ease: t.easeEnter });'), []);
  assert.deepEqual(rules('gsap.to(el, { duration: 0 });'), []);
  assert.deepEqual(rules('gsap.to(el, { duration: instant ? 0 : t.release });'), []);
  assert.deepEqual(rules('gsap.to(card, { rotateX: 0, duration: instant ? 0 : .3 });'), ['duração'], 'número escondido na expressão');
  assert.deepEqual(rules('gsap.to(el, { duration: t[kind], delay: i * .04 });'), []);
});

test('exceção só com motivo escrito na mesma linha', () => {
  assert.deepEqual(rules('gsap.to(el, { duration: .9 }); // movimento: exceção — voo do título mede a distância'), []);
  assert.deepEqual(rules('gsap.to(el, { duration: .9 }); // movimento: exceção —'), ['duração']);
  assert.deepEqual(rules('gsap.to(el, { duration: .9 }); // exceção'), ['duração']);
});

test('curva que só acelera é proibida na interface; saída e inOut passam; o pulso da cena 3D fica de fora', () => {
  assert.deepEqual(rules('gsap.to(d, { opacity: 0, duration: t.exit, ease: "power2.in" });'), ['curva']);
  assert.deepEqual(rules("gsap.to(d, { ease: 'expo.in' });", 'src/ui/dialogs.js'), ['curva']);
  assert.deepEqual(rules('beatTl.fromTo(v.mat.uniforms.flow, { value: -.05 }, { value: 1.08, ease: "power1.in" }, .2);', 'src/body/body.js'), []);
  assert.deepEqual(rules('gsap.to(d, { ease: "back.in(1.7)" });'), ['curva']);
  assert.deepEqual(rules('gsap.to(cam, { ease: "power2.inOut", duration: .65 });', 'src/body/body.js'), []);
  assert.deepEqual(rules('gsap.to(d, { ease: "expo.out" });'), []);
});

test('cena 3D e constantes de mola não são duração de interface', () => {
  assert.deepEqual(rules('gsap.to(cam, { x: 1, duration: .65, ease: "power2.out" });', 'src/body/body.js'), []);
  assert.deepEqual(rules('const follow = spring(look, request, { stiffness: 160, damping: 25 });'), []);
  assert.deepEqual(rules('const IDLE_MS = 2600, DIST = 3.7;', 'src/body/body.js'), []);
});

test('o achado aponta arquivo e linha', () => {
  const [f] = motionFindings('const a = 1;\ngsap.to(el, { duration: .5 });', 'src/views/home.js');
  assert.equal(f.file, 'src/views/home.js'); assert.equal(f.line, 2);
});
