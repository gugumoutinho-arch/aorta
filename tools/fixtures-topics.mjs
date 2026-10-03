// Dados fictícios de assuntos (CIS 1 › Anatomia) usados pelo teste das abas e pela demonstração (demo.mjs --abas).
const mat = (base, id, title, type, subject) => ({ ...base.materials[0], id, title, type, subject, areaId: 'cis1-anat', url: 'https://example.com/' + id, favorite: false, collectionIds: [] });
const topic = (id, name, slug, order, extra = {}) => ({ id, areaId: 'cis1-anat', name, slug, order, slugAliases: [], ...extra });

export function withTopics(base) {
  return {
    ...base,
    materials: [
      ...base.materials.filter(m => m.areaId !== 'cis1-anat'),
      mat(base, 'a1', 'Anatomia clínica dos membros superiores', 'Slides', 'Membro superior'),
      mat(base, 'a2', 'Caso clínico — luxação do ombro', 'Caso clínico', 'Membro superior'),
      mat(base, 'a3', 'Caso clínico — fratura do colo do fêmur', 'Caso clínico', 'Membro inferior'),
      mat(base, 'a4', 'Conferência de coluna', 'Slides', 'Coluna vertebral'),
      mat(base, 'a5', 'Revisão de membros inferiores', 'Resumo', 'Membro inferior'),
    ],
    topics: [
      topic('t1', 'Membro superior', 'membro-superior', 0),
      topic('t2', 'Coluna vertebral', 'coluna-vertebral', 1),
      topic('t3', 'Membro inferior', 'membro-inferior', 2, { slugAliases: ['membro-inf'] }),
      topic('t4', 'Cabeça e pescoço', 'cabeca-e-pescoco', 3),
    ],
    material_topics: [
      { materialId: 'a1', topicId: 't1' }, { materialId: 'a2', topicId: 't1' }, { materialId: 'a2', topicId: 't2' },
      { materialId: 'a3', topicId: 't3' }, { materialId: 'a4', topicId: 't2' }, { materialId: 'a5', topicId: 't3' },
    ],
  };
}

/* Mesma matéria com muitos assuntos, para ver a faixa rolando no celular. */
export const withManyTopics = data => ({
  ...data,
  topics: [...data.topics, ...Array.from({ length: 8 }, (_, i) => topic('x' + i, 'Assunto extra número ' + (i + 1), 'assunto-extra-numero-' + (i + 1), 4 + i))],
});
