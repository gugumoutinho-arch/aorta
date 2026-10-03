/* Assuntos dentro de uma matéria (abas "Todos · assuntos · Casos clínicos"). Lógica pura, sem DOM.
   topicNorm/topicSlug repetem private.topic_norm/topic_slug do banco (supabase/migrations/20261003190000_assuntos.sql).
   As consultas usam um contexto montado uma vez por desenho (índice material → assuntos), não varrem as ligações. */
export const CASES = "casos";
export const CASE_TYPE = "Caso clínico";

/* Exportadas para o banco fictício dos testes gerar normalized_name exatamente como o banco. */
export const TOPIC_FROM = "áàâãäéèêëíìîïóòôõöúùûüçñªº", TOPIC_TO = "aaaaaeeeeiiiiooooouuuucnao";
const MAP = new Map([...TOPIC_FROM].map((c, i) => [c, TOPIC_TO[i]]));

export const topicNorm = value => [...String(value ?? "").toLowerCase()].map(c => MAP.get(c) ?? c).join("").replace(/\s+/g, " ").trim();
export const topicSlug = value => topicNorm(value).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const byOrder = (a, b) => (a.order ?? 0) - (b.order ?? 0) || topicNorm(a.name).localeCompare(topicNorm(b.name));

/* Assuntos da matéria em ordem, slug (atual e antigos) → assunto, e material → ids dos assuntos ligados. */
export function tabContext({ areaId, topics, links }) {
  const own = topics.filter(t => t.areaId === areaId).sort(byOrder);
  const bySlug = new Map();
  own.forEach(t => (t.slugAliases || []).forEach(s => bySlug.set(s, t)));
  own.forEach(t => bySlug.set(t.slug, t));
  const ids = new Set(own.map(t => t.id)), index = new Map();
  for (const l of links) {
    if (!ids.has(l.topicId)) continue;
    if (!index.has(l.materialId)) index.set(l.materialId, new Set());
    index.get(l.materialId).add(l.topicId);
  }
  return { areaId, own, bySlug, index };
}

/* O material está na aba? "" = Todos; CASES = casos clínicos da matéria; senão, o slug do assunto. */
export function inTab(material, tab, ctx) {
  if (!tab) return true;
  if (tab === CASES) return material.type === CASE_TYPE;
  const topic = ctx.bySlug.get(tab);
  return !!topic && !!ctx.index.get(material.id)?.has(topic.id);
}

/* Nome do grupo do material: o primeiro assunto ligado, na ordem da matéria; sem ligação, o texto antigo. */
export function firstTopicName(material, ctx) {
  const mine = ctx.index.get(material.id);
  const t = mine && ctx.own.find(t => mine.has(t.id));
  return t ? t.name : (material.subject || "").trim();
}

/* Abas: Todos, cada assunto (em ordem, com contagem; zero = em produção) e Casos clínicos se houver.
   "materials" já vem recortado para a matéria. Sem assuntos cadastrados, não há abas. */
export function topicTabs(ctx, materials) {
  if (!ctx.own.length) return [];
  const perTopic = new Map(ctx.own.map(t => [t.id, 0]));
  let cases = 0;
  for (const m of materials) {
    ctx.index.get(m.id)?.forEach(id => perTopic.set(id, perTopic.get(id) + 1));
    if (m.type === CASE_TYPE) cases++;
  }
  const tabs = [{ key: "", label: "Todos", count: materials.length },
    ...ctx.own.map(t => ({ key: t.slug, label: t.name, count: perTopic.get(t.id), topicId: t.id }))];
  if (cases) tabs.push({ key: CASES, label: "Casos clínicos", count: cases });
  return tabs;
}

/* "#a-<área>/<aba>": a parte depois da barra é a aba; o resto continua sendo a rota antiga "#a-<área>". */
export function parseAreaRoute(path) {
  const [areaId, ...rest] = String(path).split("/");
  const raw = rest.join("/").replace(/\/+$/, "");
  return { areaId, tab: raw ? topicSlug(raw) : "" };
}
export const areaRoute = (areaId, tab) => "a-" + areaId + (tab ? "/" + tab : "");
