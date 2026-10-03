// N4 · Salvar rascunhos e publicar sobre o banco fictício: publicar de novo (inclusive depois de erro no meio) não duplica.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mockDbScript } from '../harness.mjs';
import { saveImport, publishDraft } from '../../src/core/import-store.js';
import { parsePaste, planImport } from '../../src/domain/import.js';

function mockDb(data) {
  const window = {};
  new Function('window', mockDbScript(data))(window);
  return { window, db: window.claude.use('db') };
}
const snap = (db, col) => new Promise(r => db.collection(col).onSnapshot(s => r(s.docs.map(d => ({ id: d.id, ...d.data() })))));
const areas = [{ id: 'm1', name: 'M1', parentId: '' }, { id: 'cis1', name: 'CIS 1', parentId: 'm1' }, { id: 'anat', name: 'Anatomia', parentId: 'cis1' }];
const topics = [{ id: 't1', areaId: 'anat', name: 'Membro superior', slug: 'membro-superior', order: 0 }];
const data = { areas, collections: [], topics, material_topics: [], materials: [{ id: 'old', title: 'Velho', url: 'https://drive.google.com/file/d/VELHO/view', areaId: 'anat', subject: '' }] };
const paste = 'url\tcaminho\ttipo\ttitulo\nhttps://drive.google.com/file/d/NOVO/view\tM1/CIS 1/Anatomia/Membro superior\tSlides\tAula\nhttps://drive.google.com/open?id=VELHO\tM1/CIS 1/Anatomia/Membro superior\tSlides\tVelho de novo';
const now = '2026-10-03T12:00:00Z';

async function setup() {
  const { window, db: dbp } = mockDb(data), db = await dbp;
  // A duplicata vem como "ignorar"; ligar ao material existente é escolha explícita.
  const rows = planImport(parsePaste(paste).rows, { areas, topics, materials: data.materials, drafts: [], types: ['Slides'] })
    .map(r => r.canLink ? { ...r, action: 'ligar' } : r);
  const saved = await saveImport(db, rows, { links: [], topics, materials: data.materials, now });
  return { window, db, saved };
}
const ctxOf = async db => ({ links: await snap(db, 'material_topics'), topics, materials: await snap(db, 'materials'), now });

test('salvar: linha nova vira rascunho; duplicata com assunto liga o material existente', async () => {
  const { db, saved } = await setup();
  assert.deepEqual(saved, { drafts: 1, linked: 1 });
  const drafts = await snap(db, 'material_drafts');
  assert.equal(drafts.length, 1);
  assert.deepEqual([drafts[0].status, drafts[0].driveFileId, drafts[0].topicIds], ['rascunho', 'NOVO', ['t1']]);
  assert.deepEqual((await snap(db, 'material_topics')).map(l => l.id), ['old:t1']);
  assert.equal((await snap(db, 'materials')).find(m => m.id === 'old').subject, 'Membro superior');
});

test('publicar cria material com assunto e marca o rascunho; publicar de novo não duplica', async () => {
  const { db } = await setup();
  const [draft] = await snap(db, 'material_drafts');
  const id = await publishDraft(db, draft, await ctxOf(db));
  const after = await snap(db, 'material_drafts');
  assert.deepEqual([after[0].status, after[0].materialId], ['publicado', id]);
  const again = await publishDraft(db, after[0], await ctxOf(db));
  assert.equal(again, id);
  const mats = (await snap(db, 'materials')).filter(m => m.url.includes('NOVO'));
  assert.equal(mats.length, 1);
  assert.deepEqual([mats[0].subject, mats[0].source, mats[0].status], ['Membro superior', 'Google Drive', 'nao-iniciado']);
  assert.ok((await snap(db, 'material_topics')).some(l => l.id === id + ':t1'));
});

test('erro no meio (ligação): repetir com o rascunho atualizado completa sem criar outro material', async () => {
  const { window, db } = await setup();
  const [draft] = await snap(db, 'material_drafts');
  window.__mockFail = 'material_topics/';
  await assert.rejects(() => publishDraft(db, draft, { links: [], topics, materials: [], now }));
  const [half] = await snap(db, 'material_drafts');
  assert.ok(half.materialId && half.status === 'rascunho', 'o id do material já ficou guardado no rascunho');
  await publishDraft(db, half, await ctxOf(db));
  assert.equal((await snap(db, 'materials')).filter(m => m.url.includes('NOVO')).length, 1);
  assert.equal((await snap(db, 'material_drafts'))[0].status, 'publicado');
});

/* Falha programada antes e depois de cada escrita da publicação; repetir sempre termina com 1 material, as ligações
   e o rascunho publicado — nunca duplica. */
for (const [hook, prefix] of [['__mockFail', 'material_drafts/'], ['__mockFailAfter', 'material_drafts/'], ['__mockFail', 'materials/'],
  ['__mockFailAfter', 'materials/'], ['__mockFail', 'material_topics/'], ['__mockFailAfter', 'material_topics/']]) {
  test(`publicar: ${hook === '__mockFail' ? 'falha antes' : 'falha depois'} de gravar em ${prefix} e repetir não duplica`, async () => {
    const { window, db } = await setup();
    const [draft] = await snap(db, 'material_drafts');
    window[hook] = prefix;
    const c0 = await ctxOf(db); await assert.rejects(() => publishDraft(db, draft, c0));
    const [again] = await snap(db, 'material_drafts');
    await publishDraft(db, again, await ctxOf(db));
    const mats = (await snap(db, 'materials')).filter(m => m.url.includes('NOVO'));
    assert.equal(mats.length, 1);
    assert.equal(mats[0].id, draft.id, 'o id do material é o do rascunho');
    assert.ok((await snap(db, 'material_topics')).some(l => l.materialId === draft.id && l.topicId === 't1'));
    assert.equal((await snap(db, 'material_drafts'))[0].status, 'publicado');
  });
}

test('publicar: o rascunho só vira "publicado" depois das ligações', async () => {
  const { window, db } = await setup();
  const [draft] = await snap(db, 'material_drafts');
  window.__mockFail = 'material_topics/';
  const c0 = await ctxOf(db); await assert.rejects(() => publishDraft(db, draft, c0));
  assert.equal((await snap(db, 'material_drafts'))[0].status, 'rascunho');
});

test('publicar: material já existente não é sobrescrito ao retomar', async () => {
  const { db } = await setup();
  const [draft] = await snap(db, 'material_drafts');
  await db.doc('materials/' + draft.id).create({ title: 'Editado à mão', url: draft.url, areaId: 'anat', status: 'revisado' });
  await publishDraft(db, draft, await ctxOf(db));
  const m = (await db.doc('materials/' + draft.id).get()).data();
  assert.deepEqual([m.title, m.status], ['Editado à mão', 'revisado']);
});

test('publicar: rascunho ignorado (por outro cliente) não é publicado', async () => {
  const { db } = await setup();
  const [draft] = await snap(db, 'material_drafts');
  await db.doc('material_drafts/' + draft.id).update({ status: 'ignorado' });
  const c = await ctxOf(db);
  await assert.rejects(() => publishDraft(db, draft, c), /ignorado/);
  assert.equal((await snap(db, 'materials')).filter(m => m.url.includes('NOVO')).length, 0);
});
