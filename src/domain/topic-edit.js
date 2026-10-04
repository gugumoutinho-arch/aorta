/* Gravação de assuntos e ligações material ↔ assunto: só cálculo, sem banco nem DOM.
   O banco garante (area_id, normalized_name) e (area_id, slug) únicos e recusa os slugs reservados das abas;
   aqui o site calcula antes, para não esbarrar nessas regras. */
import { topicNorm, topicSlug } from "./topics.js";

/* "casos", "todos" e "tipos" são abas ou rotas do site (supabase/migrations/20261003190000_assuntos.sql). */
export const RESERVED_SLUGS = Object.freeze(["casos", "todos", "tipos"]);
export const MAX_TOPIC_NAME = 80;

/* material_topics não tem id: a chave é a dupla. Só o adaptador e o banco fictício usam este id; cada parte vai
   codificada (encodeURIComponent), então um ":" dentro de um id nunca confunde a separação. */
export const linkId = (materialId, topicId) => encodeURIComponent(materialId) + ":" + encodeURIComponent(topicId);
export function parseLinkId(id) {
  const parts = String(id).split(":");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  try { return { materialId: decodeURIComponent(parts[0]), topicId: decodeURIComponent(parts[1]) }; } catch (_) { return null; }
}

/* O que inserir e o que remover para a lista de assuntos de um material virar "wanted" (sem repetir, na ordem pedida). */
export function linkDiff(current, wanted) {
  const have = new Set(current), want = [...new Set(wanted)];
  return { add: want.filter(id => !have.has(id)), remove: [...have].filter(id => !want.includes(id)) };
}

/* Assuntos da matéria ligados ao material, na ordem da matéria (a mesma das abas). */
export function linkedTopics(materialId, links, topics) {
  const ids = new Set(links.filter(l => l.materialId === materialId).map(l => l.topicId));
  return topics.filter(t => ids.has(t.id)).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

/* Texto antigo materials.subject: nome do primeiro assunto ligado da matéria PRINCIPAL do material (area_id),
   por sort_order e depois id; nenhum assunto dessa matéria = vazio. */
export const byOrderThenId = (a, b) => (a.order ?? 0) - (b.order ?? 0) || String(a.id).localeCompare(String(b.id));
export function subjectFor(topicIds, topics, areaId) {
  const ids = new Set(topicIds);
  const first = topics.filter(t => t.areaId === areaId && ids.has(t.id)).sort(byOrderThenId)[0];
  return first ? first.name : "";
}

/* Slug livre na matéria: o do nome, ou com -2, -3… se já existir (atual ou antigo) ou for reservado. */
export function freeSlug(name, taken) {
  const base = topicSlug(name) || "assunto";
  const busy = s => taken.has(s) || RESERVED_SLUGS.includes(s);
  if (!busy(base)) return base;
  for (let n = 2; ; n++) if (!busy(`${base}-${n}`)) return `${base}-${n}`;
}

/* Novo assunto na matéria. Nome igual (sem acento, maiúscula ou espaço extra) a um existente devolve o existente. */
export function planTopic(areaId, rawName, topics) {
  const name = String(rawName ?? "").normalize("NFC").replace(/\s+/g, " ").trim();
  if (!areaId) return { error: "Escolha a matéria antes de criar o assunto." };
  if (!name) return { error: "Dê um nome ao assunto." };
  if (name.length > MAX_TOPIC_NAME) return { error: `O nome do assunto pode ter até ${MAX_TOPIC_NAME} caracteres.` };
  const own = topics.filter(t => t.areaId === areaId);
  const same = own.find(t => topicNorm(t.name) === topicNorm(name));
  if (same) return { existing: same };
  const taken = new Set(own.flatMap(t => [t.slug, ...(t.slugAliases || [])]));
  const order = own.reduce((max, t) => Math.max(max, (t.order ?? -1) + 1), 0);
  return { fields: { areaId, name, slug: freeSlug(name, taken), slugAliases: [], order } };
}
