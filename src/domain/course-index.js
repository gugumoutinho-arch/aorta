/* Índice editorial do início (direção D): linhas numeradas com as matérias do curso (ou as disciplinas, na Medicina
   geral), um resumo dos assuntos e a contagem. Lógica pura sobre áreas, materiais e assuntos; sem DOM. */
const byOrder = (a, b) => ((a.order ?? 999) - (b.order ?? 999)) || String(a.name).localeCompare(String(b.name), "pt-BR", { numeric: true });
import { CASE_TYPE } from "./topics.js";

/* Contagem de materiais por área, somando os descendentes. */
function counter(areas, materials) {
  const parent = new Map(areas.map(a => [a.id, a.parentId || ""])), count = new Map();
  for (const m of materials) { let id = m.areaId, guard = 0; while (id && guard++ < 8) { count.set(id, (count.get(id) || 0) + 1); id = parent.get(id); } }
  return id => count.get(id) || 0;
}

/* IDOMED: cada módulo com conteúdo vira um grupo; dentro dele, uma linha por matéria (ou pela unidade, quando ela
   ainda não tem matérias). Medicina geral: um grupo só, uma linha por disciplina. Módulos sem nada vão para "waiting".
   Numeração contínua (01, 02…) na ordem do curso. Resumo: nomes dos assuntos (até 4) ou, sem assuntos, das unidades. */
export function courseIndex({ areas, materials, topics = [], acervo = "idomed", modules }) {
  const count = counter(areas, materials), kids = id => areas.filter(a => (a.parentId || "") === id).sort(byOrder);
  const topicNames = id => topics.filter(t => t.areaId === id).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map(t => t.name);
  const summary = (names, more) => names.length ? names.slice(0, 4).join(", ") + (names.length > 4 || more ? "…" : "") : "";
  let n = 0;
  const row = (area, mod, extra = {}) => {
    const c = count(area.id), topicsHere = topicNames(area.id);
    return { id: area.id, name: area.name, num: String(++n).padStart(2, "0"), count: c, live: c > 0, moduleId: mod.id, token: mod.token,
      summary: c ? summary(topicsHere) || extra.fallback || "" : "Em produção", topics: topicsHere.length };
  };
  const live = modules.filter(m => count(m.id) > 0), waiting = modules.filter(m => !count(m.id));
  if (acervo === "geral") {
    const rows = live.map(m => row(m, m, { fallback: summary(kids(m.id).filter(u => count(u.id)).map(u => u.name)) }));
    return { groups: rows.length ? [{ module: null, rows }] : [], waiting };
  }
  const groups = live.map(mod => {
    const rows = kids(mod.id).flatMap(unit => {
      const subs = kids(unit.id);
      return subs.length ? subs.map(s => row(s, mod, { fallback: unit.name })) : [row(unit, mod, { fallback: "" })];
    });
    return { module: mod, rows };
  });
  return { groups, waiting };
}

/* Números do índice: materiais, assuntos e casos clínicos do acervo. */
export function indexStats({ materials, topics = [], areaIds }) {
  return {
    materials: materials.length,
    topics: topics.filter(t => areaIds.has(t.areaId)).length,
    cases: materials.filter(m => m.type === CASE_TYPE).length,
  };
}

/* Título curto de um caso na prateleira: tira o prefixo "Caso clínico —" (o tipo já está no título da seção). */
export function caseTitle(title) {
  const t = String(title || "").replace(/^\s*caso\s+cl[ií]nico\s*[—–:-]\s*/i, "").trim();
  return t ? t[0].toLocaleUpperCase("pt-BR") + t.slice(1) : String(title || "(sem título)");
}
