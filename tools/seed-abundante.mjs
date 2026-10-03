import fs from 'node:fs';
const base = JSON.parse(fs.readFileSync(new URL('./seed-v4.json', import.meta.url), 'utf8'));
/** Dados sintéticos só em memória: nenhuma gravação de catálogo. */
export function abundantSeed(count = 120) {
  const data = structuredClone(base);
  const leaves = data.areas.filter(a => !data.areas.some(b => b.parentId === a.id));
  const model = data.materials[0];
  data.materials = Array.from({ length: count }, (_, i) => ({ ...model,
    id: `abundante-${i}`, title: `Exemplo ${i + 1} — orientação espacial e relações anatômicas: revisão do conteúdo com um título completo que ocupa mais de uma linha`,
    areaId: leaves[i < 30 ? 0 : i === 30 ? 1 : 2 + (i % (leaves.length - 2))].id,
    subject: 'Relações anatômicas', url: 'https://example.com/material-de-teste',
    type: i % 5 === 0 ? 'Estudo dirigido' : 'Resumo', favorite: i % 17 === 0,
  }));
  return data;
}
