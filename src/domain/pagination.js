/* Leitura paginada: o Supabase devolve no máximo 1000 linhas por pedido. Busca página a página e só devolve
   o conjunto completo; uma página com erro rejeita tudo, para quem chama manter os dados que já tinha. */
export const PAGE = 1000;

export async function fetchAll(fetchPage, pageSize = PAGE) {
  const rows = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await fetchPage(from, from + pageSize - 1);
    if (error) throw error;
    rows.push(...(data || []));
    if (!data || data.length < pageSize) return rows;
  }
}
