// Leitura paginada (A-04): o Supabase corta em 1000 linhas por pedido; só publica o resultado completo.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fetchAll, PAGE } from '../../src/domain/pagination.js';

const source = (total, failAt = -1) => {
  const calls = [];
  const fetchPage = async (from, to) => {
    calls.push([from, to]);
    if (calls.length - 1 === failAt) return { data: null, error: new Error('rede caiu') };
    const rows = Array.from({ length: Math.max(0, Math.min(to, total - 1) - from + 1) }, (_, i) => ({ id: from + i }));
    return { data: rows, error: null };
  };
  return { fetchPage, calls };
};

test('páginas de 1000, com intervalos inclusivos', () => assert.equal(PAGE, 1000));

for (const total of [0, 1, 999, 1000, 1001, 2500]) {
  test(`${total} linhas chegam completas, sem repetir nem faltar`, async () => {
    const { fetchPage, calls } = source(total);
    const rows = await fetchAll(fetchPage);
    assert.equal(rows.length, total);
    assert.equal(new Set(rows.map(r => r.id)).size, total);
    assert.deepEqual(calls[0], [0, 999]);
    assert.equal(calls.length, Math.floor(total / 1000) + 1);
  });
}

test('falha no meio rejeita tudo (quem chama mantém os dados anteriores)', async () => {
  const { fetchPage } = source(2500, 1);
  await assert.rejects(fetchAll(fetchPage), /rede caiu/);
});

test('para mesmo se o servidor ignorar o limite e mandar menos', async () => {
  const rows = await fetchAll(async from => ({ data: from === 0 ? [{ id: 1 }, { id: 2 }] : [], error: null }));
  assert.equal(rows.length, 2);
});
