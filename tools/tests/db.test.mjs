// N1 · As duas pontas do banco gravam assuntos, ligações e rascunhos com a mesma interface.
// Supabase: um cliente falso registra o que seria enviado (nenhum acesso ao banco real).
// Banco fictício dos testes: o mesmo script que tools/harness.mjs injeta na página, rodado aqui.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { supaDb } from '../../src/core/db.js';
import { mockDbScript } from '../harness.mjs';
import { saveMaterialTopics, restoreLinks, insertTopic } from '../../src/core/topic-store.js';

/* Cliente Supabase falso: cada consulta vira uma linha em "calls"; leituras devolvem "rows[tabela]". */
function fakeSupabase(rows = {}) {
  const calls = [];
  const query = (table, op, payload, opts) => {
    const q = { table, op, payload, opts, filters: [] };
    calls.push(q);
    const chain = {
      eq(c, v) { q.filters.push([c, v]); return chain; },
      order() { return chain; },
      range() { return chain; },
      then(ok, ko) { return Promise.resolve({ data: op === 'select' ? rows[table] || [] : null, error: null }).then(ok, ko); },
    };
    return chain;
  };
  return {
    calls,
    from: table => ({
      select: () => query(table, 'select'),
      upsert: (payload, opts) => query(table, 'upsert', payload, opts),
      update: payload => query(table, 'update', payload),
      delete: () => query(table, 'delete'),
    }),
    channel: () => ({ on() { return this; }, subscribe() { return this; } }),
  };
}
const writes = sb => sb.calls.filter(c => c.op !== 'select');

test('Supabase: ligação vira upsert da dupla (sem coluna id) e delete pelas duas colunas', async () => {
  const sb = fakeSupabase(), db = supaDb(sb);
  await db.doc('material_topics/m1:t1').set({ materialId: 'm1', topicId: 't1' });
  await db.collection('material_topics').doc('m1:t2').delete();
  const [up, del] = writes(sb);
  assert.deepEqual(up.payload, { material_id: 'm1', topic_id: 't1' });
  assert.deepEqual(up.opts, { onConflict: 'material_id,topic_id', ignoreDuplicates: true });
  assert.deepEqual(del.filters, [['material_id', 'm1'], ['topic_id', 't2']]);
});

test('Supabase: ligações lidas ganham o id composto', async () => {
  const sb = fakeSupabase({ material_topics: [{ material_id: 'm1', topic_id: 't1', created_at: '2026-10-03T00:00:00Z' }] });
  const snap = await new Promise(resolve => supaDb(sb).collection('material_topics').onSnapshot(resolve));
  assert.equal(snap.docs[0].id, 'm1:t1');
  assert.deepEqual(snap.docs[0].data(), { materialId: 'm1', topicId: 't1', createdAt: '2026-10-03T00:00:00Z' });
});

test('Supabase: assunto nunca envia normalized_name; ordem vira sort_order', async () => {
  const sb = fakeSupabase(), db = supaDb(sb);
  await db.collection('topics').doc('t9').set({ areaId: 'anat', name: 'Tórax', normalizedName: 'torax', slug: 'torax', slugAliases: [], order: 3, createdAt: '2026-10-03T00:00:00Z' });
  await db.doc('topics/t9').update({ name: 'Tórax e mediastino', normalizedName: 'x' });
  const [set, upd] = writes(sb);
  assert.deepEqual(set.payload, { id: 't9', area_id: 'anat', name: 'Tórax', slug: 'torax', slug_aliases: [], sort_order: 3, created_at: '2026-10-03T00:00:00Z' });
  assert.deepEqual(upd.payload, { name: 'Tórax e mediastino' });
  assert.deepEqual(upd.filters, [['id', 't9']]);
});

test('Supabase: rascunho da colagem grava as colunas da tabela material_drafts', async () => {
  const sb = fakeSupabase(), db = supaDb(sb);
  await db.collection('material_drafts').doc('d1').set({ url: 'https://drive.google.com/file/d/abc/view', path: 'Aorta/IDOMED', type: '', title: 'Aula', source: '',
    year: '', rights: 'publico', areaId: '', topicIds: ['t1'], driveFileId: 'abc', status: 'rascunho', materialId: null, problems: ['tipo'], createdAt: 'x', updatedAt: 'y', extra: 'fora' });
  const { payload } = writes(sb)[0];
  assert.deepEqual(Object.keys(payload).sort(), ['area_id', 'created_at', 'drive_file_id', 'id', 'material_id', 'path', 'problems', 'rights', 'source', 'status', 'title', 'topic_ids', 'type', 'updated_at', 'url', 'year']);
  assert.equal(payload.drive_file_id, 'abc');
});

/* Banco fictício: o mesmo de tools/harness.mjs, num "window" falso. */
function mockDb(data) {
  const window = {};
  new Function('window', mockDbScript(data))(window);
  return window.claude.use('db');
}
const snapshot = (db, col) => new Promise(resolve => db.collection(col).onSnapshot(s => resolve(s.docs.map(d => ({ id: d.id, ...d.data() })))));
const base = {
  areas: [{ id: 'anat', name: 'Anatomia', parentId: '' }], collections: [],
  materials: [{ id: 'm1', title: 'Aula', areaId: 'anat', subject: '' }, { id: 'm2', title: 'Outra', areaId: 'anat', subject: '' }],
  topics: [{ id: 't1', areaId: 'anat', name: 'Membro superior', slug: 'membro-superior', order: 0 }, { id: 't2', areaId: 'anat', name: 'Coluna', slug: 'coluna', order: 1 }],
  material_topics: [{ materialId: 'm1', topicId: 't1' }, { materialId: 'm2', topicId: 't1' }],
};

test('banco fictício: ligar e desligar grava só a diferença, com id composto', async () => {
  const db = await mockDb(base);
  const links = await snapshot(db, 'material_topics');
  const r = await saveMaterialTopics(db, { materialId: 'm1', wanted: ['t2'], links });
  assert.deepEqual(r, { add: ['t2'], remove: ['t1'] });
  assert.deepEqual((await snapshot(db, 'material_topics')).map(l => l.id).sort(), ['m1:t2', 'm2:t1']);
});

test('banco fictício: apagar material apaga as ligações (cascata) e restoreLinks as devolve', async () => {
  const db = await mockDb(base);
  const before = (await snapshot(db, 'material_topics')).filter(l => l.materialId === 'm1');
  await db.doc('materials/m1').delete();
  assert.deepEqual((await snapshot(db, 'material_topics')).map(l => l.id), ['m2:t1']);
  await db.doc('materials/m1').set({ title: 'Aula', areaId: 'anat' });
  await restoreLinks(db, before);
  assert.deepEqual((await snapshot(db, 'material_topics')).map(l => l.id).sort(), ['m1:t1', 'm2:t1']);
});

test('banco fictício: assunto com ligação não pode ser apagado (como o "on delete restrict" do banco)', async () => {
  const db = await mockDb(base);
  await assert.rejects(() => db.doc('topics/t1').delete());
  await db.doc('topics/t2').delete();
  assert.deepEqual((await snapshot(db, 'topics')).map(t => t.id), ['t1']);
});

test('banco fictício: insertTopic cria o assunto com data e devolve o id', async () => {
  const db = await mockDb(base);
  const t = await insertTopic(db, { areaId: 'anat', name: 'Tórax', slug: 'torax', slugAliases: [], order: 2 });
  const saved = (await snapshot(db, 'topics')).find(x => x.id === t.id);
  assert.equal(saved.name, 'Tórax');
  assert.ok(saved.createdAt);
});
