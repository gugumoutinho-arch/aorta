/* Esquema que o site conhece, em nomes do site (camelCase). Uma fonte só para o adaptador do Supabase (db.js) e para o
   banco fictício dos testes (tools/harness.mjs): o que não está aqui não é gravado em nenhuma das duas pontas.
   Regras de unicidade, chaves estrangeiras e coluna gerada repetem supabase/migrations/20261003190000_assuntos.sql. */
export const COLS = {
  materials: ["title", "url", "areaId", "subject", "period", "type", "tags", "collectionIds", "source", "notes", "status", "favorite", "createdAt", "lastOpenedAt", "statusAt"],
  areas: ["name", "parentId", "order", "stain", "short", "createdAt"],
  collections: ["name", "createdAt"],
  topics: ["areaId", "name", "slug", "slugAliases", "order", "bodyRegion", "createdAt"],
  material_topics: ["materialId", "topicId", "createdAt"],
  material_drafts: ["url", "path", "type", "title", "source", "year", "rights", "areaId", "topicIds", "driveFileId", "status", "materialId", "problems", "createdAt", "updatedAt"],
};
/* Tabelas sem coluna id: a chave é a dupla (o id do site é linkId, em src/domain/topic-edit.js). */
export const KEYS = { material_topics: ["materialId", "topicId"] };
/* Para o banco fictício imitar o banco: únicos (com condição, quando o índice é parcial) e chaves estrangeiras. */
export const RULES = {
  unique: {
    topics: [["areaId", "normalizedName"], ["areaId", "slug"]],
    material_drafts: [["driveFileId"]],
  },
  /* índice parcial: drive_file_id <> '' and status <> 'ignorado' */
  partial: { material_drafts: { notEmpty: "driveFileId", notStatus: "ignorado" } },
  references: { material_topics: { materialId: "materials", topicId: "topics" } },
  /* on delete: cascade apaga as ligações do material; restrict impede apagar assunto ligado */
  cascade: { materials: { table: "material_topics", field: "materialId" } },
  restrict: { topics: { table: "material_topics", field: "topicId" } },
  /* coluna gerada pelo banco a partir de outra (private.topic_norm) */
  generated: { topics: { normalizedName: "name" } },
};
