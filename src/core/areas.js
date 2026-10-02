/* Estrutura do curso: módulo › unidade › matéria. Tudo deduzido das áreas do banco; nada de M1–M8 fixo. */
import { S, STAINS, IN_PRODUCTION } from "./state.js";
import { cmpName, plural } from "./text.js";
import { ARTERIES, extraArtery } from "./arteries.js";

export const areaById = id => S.areas.find(a => a.id === id);
export const byOrder = (a, b) => ((a.order ?? 999) - (b.order ?? 999)) || cmpName(a.name, b.name);
export const childrenOf = pid => S.areas.filter(a => (a.parentId || "") === (pid || "")).sort(byOrder);
/* Raízes da árvore = módulos (IDOMED) ou disciplinas (medicina geral), filtradas pelo acervo. */
export const acervoOfRoot = a => (a && a.acervo === "geral") ? "geral" : "idomed";
export const modules = (acervo = S.acervo) => childrenOf("").filter(a => acervoOfRoot(a) === acervo);

export function pathOf(id) {
  const out = []; let a = areaById(id), guard = 0;
  while (a && guard++ < 8) { out.unshift(a); a = areaById(a.parentId); }
  return out;
}
export const depthOf = id => pathOf(id).length - 1;
export const moduleOf = id => pathOf(id)[0] || null;
/* Material ou área sem raiz (sem área definida) fica no acervo IDOMED, como sempre esteve. */
export const acervoOf = id => acervoOfRoot(moduleOf(id));

export function descIds(id) {
  const set = new Set([id]); let grew = true;
  while (grew) { grew = false; for (const a of S.areas) if (set.has(a.parentId) && !set.has(a.id)) { set.add(a.id); grew = true; } }
  return set;
}
export function stainOf(id) { const p = pathOf(id); for (let i = p.length - 1; i >= 0; i--) if (p[i].stain) return p[i].stain; return ""; }
export const stainVar = k => { const s = STAINS.includes(k) ? k : "neutral"; return `--stain:var(--t-${s})`; };

/* Caminho legível; "from" corta o começo (ex.: dentro do M1 não repete "M1"). */
export const areaLabel = (id, from = "") => {
  const p = pathOf(id); const i = from ? p.findIndex(a => a.id === from) : -1;
  return p.slice(i + 1).map(a => a.name).join(" › ");
};
export function treeOrder() {
  const out = []; const walk = (pid, d) => childrenOf(pid).forEach(a => { out.push([a, d]); if (d < 2) walk(a.id, d + 1); });
  walk("", 0); return out;
}
export const materialsIn = id => { const set = descIds(id); return S.materials.filter(m => set.has(m.areaId)); };
export const countIn = id => materialsIn(id).length;

/* "Em produção": área sem nenhum material nela nem abaixo dela. Some sozinho no primeiro material. */
export function areasWithContent() {
  const set = new Set(), byId = new Map(S.areas.map(a => [a.id, a]));
  S.materials.forEach(m => { let a = byId.get(m.areaId), guard = 0; while (a && !set.has(a.id) && guard++ < 8) { set.add(a.id); a = byId.get(a.parentId); } });
  return set;
}
export const countLabel = n => n ? plural(n, "material", "materiais") : IN_PRODUCTION;

export function moduleList(acervo = S.acervo) {
  const live = areasWithContent();
  return modules(acervo).map((a, i) => {
    const artery = ARTERIES[i] || extraArtery(i);
    return { id: a.id, name: a.name, index: i, token: `--m${(i % 8) + 1}`, art: artery.art, path: artery.path, count: countIn(a.id), live: live.has(a.id) };
  });
}
/* "Art. 01" no coração (artéria), "Nerv. 01" na folha (nervura). */
export const moduleNumber = i => `${S.concept === "folha" ? "Nerv." : "Art."} ${String(i + 1).padStart(2, "0")}`;
export const inAcervo = (m, acervo = S.acervo) => acervoOf(m.areaId) === acervo;
