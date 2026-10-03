// N1 · As duas pontas do banco gravam assuntos, ligações e rascunhos com a mesma interface.
// Supabase: um cliente espião registra o que seria enviado (nenhum acesso à rede).
// Banco fictício dos testes: o mesmo script que tools/harness.mjs injeta na página, rodado aqui.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { supaDb } from '../../src/core/db.js';
import { linkId } from '../../src/domain/topic-edit.js';
import { mockDbScript } from '../harness.mjs';
import { saveMaterialTopics, restoreLinks, createTopicSafe } from '../../src/core/topic-store.js';

/* Cliente Supabase espião: cada consulta vira uma linha em "calls"; leituras devolvem "rows[tabela]". */
function spySupabase(rows = {}, { fail } = {}) {
  const calls = [];
  const query = (table, op, payload, opts) => {
    const q = { table, op, payload, opts, filters: [] };
    calls.push(q);
    const result = () => {
      if (fail && fail(q)) return { data: null, error: { code: '23505', message: 'duplicada' } };
      if (op !== 'select') return { data: null, error: null };
      const all = (rows[table] || []).filter(r => q.filters.every(([c, v]) => r[c] === v));
      return { data: q.single ? all[0] || null : all, error: null };
    };
    const chain = {
      eq(c, v) { q.filters.push([c, v]); return chain; },
      order() { return chain; },
      range() { return chain; },
      maybeSingle() { q.single = true; return chain; },
      then(ok, ko) { return Promise.resolve(result()).then(ok, ko); },
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

test('Supabase: ligação vira upsert da dupla (sem coluna id) e delete pelas duas colunas, mesmo com ":" nos ids', async () => {
  const sb = spySupabase(), db = supaDb(sb);
  await db.doc('material_topics/' + linkId('m:1', 't1')).set({ materialId: 'm:1', topicId: 't1' });
  await db.collection('material_topics').doc(linkId('m1', 't:2')).delete();
  const [up, del] = writes(sb);
  assert.deepEqual(up.payload, { material_id: 'm:1', topic_id: 't1' });
  assert.ok(!('id' in up.payload));
  assert.deepEqual(up.opts, { onConflict: 'material_id,topic_id', ignoreDuplicates: true });
  assert.deepEqual(del.filters, [['material_id', 'm1'], ['topic_id', 't:2']]);
});

test('Supabase: ligação não se altera (update recusado sem chegar ao banco)', async () => {
  const sb = spySupabase(), db = supaDb(sb);
  await assert.rejects(() => db.doc('material_topics/m1:t1').update({ topicId: 't2' }), /não se altera/);
  assert.equal(writes(sb).length, 0);
});

test('Supabase: ligações lidas ganham o id composto codificado', async () => {
  const sb = spySupabase({ material_topics: [{ material_id: 'a:b', topic_id: 't1', created_at: '2026-10-03T00:00:00Z' }] });
  const snap = await new Promise(resolve => supaDb(sb).collection('material_topics').onSnapshot(resolve));
  assert.equal(snap.docs[0].id, linkId('a:b', 't1'));
  assert.deepEqual(snap.docs[0].data(), { materialId: 'a:b', topicId: 't1', createdAt: '2026-10-03T00:00:00Z' });
});

test('Supabase: assunto nunca envia normalized_name; ordem vira sort_order; create não sobrescreve', async () => {
  const sb = spySupabase(), db = supaDb(sb);
  await db.collection('topics').doc('t9').set({ areaId: 'anat', name: 'Tórax', normalizedName: 'torax', slug: 'torax', slugAliases: [], order: 3, createdAt: '2026-10-03T00:00:00Z' });
  await db.doc('topics/t9').update({ name: 'Tórax e mediastino', normalizedName: 'x' });
  await db.doc('materials/d1').create({ title: 'Aula', url: 'https://example.com/a', createdAt: '2026-10-03T00:00:00Z' });
  const [set, upd, create] = writes(sb);
  assert.deepEqual(set.payload, { id: 't9', area_id: 'anat', name: 'Tórax', slug: 'torax', slug_aliases: [], sort_order: 3, created_at: '2026-10-03T00:00:00Z' });
  assert.deepEqual(upd.payload, { name: 'Tórax e mediastino' });
  assert.deepEqual(upd.filters, [['id', 't9']]);
  assert.deepEqual(create.opts, { onConflict: 'id', ignoreDuplicates: true });
});

test('Supabase: get lê pela chave; list lê a tabela inteira', async () => {
  const sb = spySupabase({ topics: [{ id: 't1', area_id: 'anat', name: 'Coluna', normalized_name: 'coluna', sort_order: 0 }],
    material_topics: [{ material_id: 'm1', topic_id: 't1' }] });
  const db = supaDb(sb);
  const got = await db.doc('topics/t1').get();
  assert.deepEqual([got.exists, got.data().name, got.data().normalizedName], [true, 'Coluna', 'coluna']);
  assert.equal((await db.doc('topics/nada').get()).exists, false);
  assert.equal((await db.doc('material_topics/m1:t1').get()).exists, true);
  assert.deepEqual(sb.calls.filter(c => c.single).at(-1).filters, [['material_id', 'm1'], ['topic_id', 't1']]);
  assert.deepEqual((await db.collection('topics').list()).map(d => d.id), ['t1']);
});

test('Supabase: rascunho da colagem grava as colunas da tabela material_drafts', async () => {
  const sb = spySupabase(), db = supaDb(sb);
  await db.collection('material_drafts').doc('d1').set({ url: 'https://drive.google.com/file/d/abc/view', path: 'Aorta/IDOMED', type: '', title: 'Aula', source: '',
    year: '', rights: 'publico', areaId: '', topicIds: ['t1'], driveFileId: 'abc', status: 'rascunho', materialId: null, problems: ['tipo'], createdAt: 'x', updatedAt: 'y', extra: 'fora' });
  const { payload } = writes(sb)[0];
  assert.deepEqual(Object.keys(payload).sort(), ['area_id', 'created_at', 'drive_file_id', 'id', 'material_id', 'path', 'problems', 'rights', 'source', 'status', 'title', 'topic_ids', 'type', 'updated_at', 'url', 'year']);
});

/* Banco fictício: o mesmo de tools/harness.mjs, num "window" falso com localStorage (persistência por contexto). */
function fakeContext() {
  const data = new Map(), listeners = [];
  return { localStorage: { getItem: k => data.get(k) ?? null, setItem: (k, v) => { data.set(k, String(v)); } }, listeners };
}
function mockDb(seed, { persist = false, context = fakeContext() } = {}) {
  const window = { addEventListener: (t, f) => context.listeners.push(f) };
  new Function('window', 'localStorage', 'addEventListener', mockDbScript(seed, { persist }))(window, context.localStorage, window.addEventListener);
  return { window, context, db: window.claude.use('db') };
}
const snapshot = (db, col) => new Promise(resolve => db.collection(col).onSnapshot(s => resolve(s.docs.map(d => ({ id: d.id, ...d.data() })))));
const base = {
  areas: [{ id: 'anat', name: 'Anatomia', parentId: '' }, { id: 'orto', name: 'Ortopedia', parentId: '' }], collections: [],
  materials: [{ id: 'm1', title: 'Aula', areaId: 'anat', subject: '' }, { id: 'm2', title: 'Outra', areaId: 'anat', subject: '' }],
  topics: [{ id: 't1', areaId: 'anat', name: 'Membro superior', slug: 'membro-superior', order: 0 }, { id: 't2', areaId: 'anat', name: 'Coluna', slug: 'coluna', order: 1 },
    { id: 'o1', areaId: 'orto', name: 'Ombro', slug: 'ombro', order: 0 }],
  material_topics: [{ materialId: 'm1', topicId: 't1' }, { materialId: 'm1', topicId: 'o1' }, { materialId: 'm2', topicId: 't1' }],
};

test('banco fictício: ligar e desligar mexe só nos assuntos daquela matéria (preserva Ortopedia)', async () => {
  const { db: p } = mockDb(base), db = await p;
  const links = await snapshot(db, 'material_topics'), topics = await snapshot(db, 'topics');
  const r = await saveMaterialTopics(db, { materialId: 'm1', areaId: 'anat', wanted: ['t2'], links, topics });
  assert.deepEqual(r, { add: ['t2'], remove: ['t1'] });
  assert.deepEqual((await snapshot(db, 'material_topics')).map(l => l.id).sort(), ['m1:o1', 'm1:t2', 'm2:t1']);
  await assert.rejects(() => saveMaterialTopics(db, { materialId: 'm1', areaId: 'anat', wanted: ['o1'], links, topics }), /outra matéria/);
});

test('banco fictício: apagar material apaga as ligações (cascata) e restoreLinks as devolve', async () => {
  const { db: p } = mockDb(base), db = await p;
  const before = (await snapshot(db, 'material_topics')).filter(l => l.materialId === 'm1');
  await db.doc('materials/m1').delete();
  assert.deepEqual((await snapshot(db, 'material_topics')).map(l => l.id), ['m2:t1']);
  await assert.rejects(() => restoreLinks(db, before), e => e.code === '23503', 'sem o material de volta, a ligação é recusada (chave estrangeira)');
  await db.doc('materials/m1').set({ title: 'Aula', areaId: 'anat' });
  await restoreLinks(db, before);
  assert.deepEqual((await snapshot(db, 'material_topics')).map(l => l.id).sort(), ['m1:o1', 'm1:t1', 'm2:t1']);
});

test('banco fictício: restrict, unicidade e coluna gerada como no banco', async () => {
  const { db: p } = mockDb(base), db = await p;
  await assert.rejects(() => db.doc('topics/t1').delete(), e => e.code === '23503');
  await assert.rejects(() => db.doc('topics/x').set({ areaId: 'anat', name: 'COLUNA ', slug: 'outra' }), e => e.code === '23505', 'mesmo nome normalizado');
  await assert.rejects(() => db.doc('topics/x').set({ areaId: 'anat', name: 'Outra', slug: 'coluna' }), e => e.code === '23505', 'mesmo slug');
  await db.doc('topics/x').set({ areaId: 'orto', name: 'Coluna', slug: 'coluna', normalizedName: 'mentira', extra: 1 });
  const x = (await snapshot(db, 'topics')).find(t => t.id === 'x');
  assert.deepEqual([x.normalizedName, 'extra' in x], ['coluna', false], 'gerada pelo banco; coluna fora do esquema não é gravada');
  await assert.rejects(() => db.doc('material_topics/m1:nada').set({ materialId: 'm1', topicId: 'nada' }), e => e.code === '23503');
  await assert.rejects(() => db.doc('material_topics/m1:t1').update({ topicId: 't2' }), /não se altera/);
});

test('banco fictício: rascunho com o mesmo arquivo do Drive é recusado, salvo se o outro estiver ignorado', async () => {
  const { db: p } = mockDb(base), db = await p;
  const d = { url: 'https://drive.google.com/file/d/A/view', driveFileId: 'A', status: 'rascunho' };
  await db.doc('material_drafts/d1').set(d);
  await assert.rejects(() => db.doc('material_drafts/d2').set(d), e => e.code === '23505');
  await db.doc('material_drafts/d1').update({ status: 'ignorado' });
  await db.doc('material_drafts/d2').set(d);
  await assert.rejects(() => db.doc('material_drafts/d1').update({ status: 'rascunho' }), e => e.code === '23505');
});

test('banco fictício: persiste entre recargas no mesmo contexto, e outro contexto começa limpo', async () => {
  const context = fakeContext();
  const first = await mockDb(base, { persist: true, context }).db;
  await first.doc('topics/novo').set({ areaId: 'anat', name: 'Tórax', slug: 'torax' });
  const reloaded = await mockDb(base, { persist: true, context }).db;
  assert.ok((await snapshot(reloaded, 'topics')).some(t => t.id === 'novo'));
  const other = await mockDb(base, { persist: true }).db;
  assert.ok(!(await snapshot(other, 'topics')).some(t => t.id === 'novo'));
});

test('banco fictício: falha antes da escrita não grava; falha depois grava (resposta incerta)', async () => {
  const { window, db: p } = mockDb(base), db = await p;
  window.__mockFail = 'topics/';
  await assert.rejects(() => db.doc('topics/a').set({ areaId: 'anat', name: 'A', slug: 'a' }));
  assert.equal((await db.doc('topics/a').get()).exists, false);
  window.__mockFailAfter = 'topics/';
  await assert.rejects(() => db.doc('topics/b').set({ areaId: 'anat', name: 'B', slug: 'b' }));
  assert.equal((await db.doc('topics/b').get()).exists, true);
});

test('criar assunto: dois clientes com o mesmo nome chegam ao MESMO assunto, confirmado no banco', async () => {
  const context = fakeContext();
  const a = await mockDb(base, { persist: true, context }).db, b = await mockDb(base, { persist: true, context }).db;
  const stale = await snapshot(a, 'topics');
  const [x, y] = await Promise.all([createTopicSafe(a, { areaId: 'anat', name: 'Tórax', topics: stale, now: 'n' }),
    createTopicSafe(b, { areaId: 'anat', name: 'tórax ', topics: stale, now: 'n' })]);
  assert.equal(x.id, y.id);
  assert.equal((await snapshot(a, 'topics')).filter(t => t.areaId === 'anat' && t.normalizedName === 'torax').length, 1);
});

test('criar assunto: nomes diferentes com o mesmo slug ao mesmo tempo ganham -2, sem erro', async () => {
  const context = fakeContext();
  const a = await mockDb(base, { persist: true, context }).db, b = await mockDb(base, { persist: true, context }).db;
  const stale = await snapshot(a, 'topics');
  const made = await Promise.all([createTopicSafe(a, { areaId: 'anat', name: 'Tórax!', topics: stale, now: 'n' }),
    createTopicSafe(b, { areaId: 'anat', name: 'Tórax?', topics: stale, now: 'n' })]);
  assert.deepEqual(made.map(t => t.slug).sort(), ['torax', 'torax-2']);
  assert.equal(new Set(made.map(t => t.id)).size, 2);
});

test('criar assunto: nome que já existe devolve o existente sem gravar; falha depois da gravação é conferida no banco', async () => {
  const { window, db: p } = mockDb(base), db = await p;
  const topics = await snapshot(db, 'topics');
  assert.equal((await createTopicSafe(db, { areaId: 'anat', name: 'coluna', topics, now: 'n' })).id, 't2');
  window.__mockFailAfter = 'topics/';
  const t = await createTopicSafe(db, { areaId: 'anat', name: 'Pelve', topics, now: 'n' });
  assert.equal(t.name, 'Pelve');
  assert.equal((await snapshot(db, 'topics')).filter(x => x.name === 'Pelve').length, 1);
});

test('texto legado: segue o primeiro assunto da matéria principal; quem nunca teve assunto conserva o texto', async () => {
  const { setLinksInArea } = await import('../../src/core/topic-store.js');
  const { db: p } = mockDb({ ...base, materials: [...base.materials, { id: 'm3', title: 'Livre', areaId: 'anat', subject: 'texto livre' }] }), db = await p;
  const topics = await snapshot(db, 'topics');
  let links = await snapshot(db, 'material_topics');
  const m1 = (await snapshot(db, 'materials')).find(m => m.id === 'm1');
  let r = await setLinksInArea(db, { material: m1, areaId: 'anat', wanted: ['t2'], links, topics });
  assert.equal((await db.doc('materials/m1').get()).data().subject, 'Coluna');
  r = await setLinksInArea(db, { material: { ...m1, subject: 'Coluna' }, areaId: 'anat', wanted: [], links: r.links, topics });
  assert.equal((await db.doc('materials/m1').get()).data().subject, '', 'tirou o último assunto da matéria principal');
  assert.ok(r.links.some(l => l.materialId === 'm1' && l.topicId === 'o1'), 'Ortopedia continua ligada');
  links = await snapshot(db, 'material_topics');
  await setLinksInArea(db, { material: { id: 'm3', areaId: 'anat', subject: 'texto livre' }, areaId: 'orto', wanted: ['o1'], links, topics });
  assert.equal((await db.doc('materials/m3').get()).data().subject, 'texto livre', 'assunto de outra matéria não apaga o texto livre');
});
