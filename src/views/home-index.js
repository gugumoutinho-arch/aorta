/* Início, abaixo do palco (direção D): índice editorial numerado, prateleira de casos clínicos (o único lugar com
   cartões grandes) e as listas do acervo (mesa de estudo, livros, materiais próprios, da internet, recentes). */
import { S, ACERVOS, EMPTY_FILTERS, ready } from "../core/state.js";
import { $, h } from "../core/dom.js";
import { plural, cmpName, norm } from "../core/text.js";
import { pathOf, descIds, moduleNumber, inAcervo } from "../core/areas.js";
import { courseIndex, indexStats, caseTitle } from "../domain/course-index.js";
import { CASE_TYPE, areaRoute } from "../domain/topics.js";
import { miniCard, openLink, moduleToken } from "./cards.js";
import { concept } from "./concept.js";

const mats = () => S.materials.filter(m => inAcervo(m));
const and = list => list.length < 2 ? list.join("") : list.slice(0, -1).join(", ") + " e " + list.at(-1);

/* Grupo de módulo (IDOMED): numeral e artéria; leva à página do módulo. */
function groupHead(mod) {
  const top = concept().labelTop ? concept().labelTop(mod) : moduleNumber(mod.index) + (S.concept === "coracao" ? " · " + mod.art : "");
  return h("a", { class: "index-group", href: "#a-" + mod.id, "data-module": mod.id, style: `--c:var(${mod.token})` },
    h("b", { text: mod.name }), h("span", { class: "mono", text: top }), h("span", { class: "index-group-n", text: plural(mod.count, "material", "materiais") }));
}
function row(r) {
  const body = [h("span", { class: "index-n mono", text: r.num }), h("span", { class: "index-name", text: r.name }),
    h("span", { class: "index-sum", text: r.summary }), h("span", { class: "index-count", text: r.live ? String(r.count) : "—" })];
  if (!r.live) return h("div", { class: "index-row off", style: `--c:var(${r.token})` }, ...body, h("span", { class: "sr", text: ", em produção" }));
  return h("a", { class: "index-row", href: "#" + areaRoute(r.id), "data-area": r.id, style: `--c:var(${r.token})`,
    "aria-label": `${r.name}: ${plural(r.count, "material", "materiais")}${r.summary ? ". " + r.summary : ""}` }, ...body);
}
export function renderIndex(mods) {
  const box = $("#course-index"), a = ACERVOS[S.acervo];
  $("#index-title").textContent = a.indexTitle;
  if (!ready()) { box.replaceChildren(); $("#index-meta").textContent = ""; $("#index-stats").replaceChildren(); return; }
  if (!mods.length) { box.replaceChildren(h("p", { class: "muted", text: `Nenhum(a) ${a.unit} criado(a) ainda. Quem edita cria a estrutura em Organizar.` })); return; }
  const all = mats(), { groups, waiting } = courseIndex({ areas: S.areas, materials: all, topics: S.topics, acervo: S.acervo, modules: mods });
  const rows = groups.flatMap(g => g.rows), liveRows = rows.filter(r => r.live).length;
  const ids = new Set(mods.flatMap(m => [...descIds(m.id)])), st = indexStats({ materials: all, topics: S.topics, areaIds: ids });
  $("#index-meta").textContent = `${plural(st.materials, "material", "materiais")} em ${plural(liveRows, S.acervo === "geral" ? "disciplina" : "matéria", S.acervo === "geral" ? "disciplinas" : "matérias")}.`
    + (waiting.length ? ` ${and(waiting.map(m => m.name))} ${waiting.length === 1 ? "entra" : "entram"} quando os materiais chegarem.` : "");
  const stat = (n, label) => h("div", null, h("dt", { text: label }), h("dd", { text: String(n) }));
  $("#index-stats").replaceChildren(stat(st.materials, "Materiais"), stat(st.topics, "Assuntos"), stat(st.cases, "Casos"));
  const prod = waiting.length ? h("div", { class: "production-index" }, h("span", { text: "Em produção · ainda sem material" }),
    waiting.map(m => h("a", { href: "#a-" + m.id, "data-module": m.id, "aria-label": `${m.name}, em produção`, text: m.name }))) : null;
  box.replaceChildren(...groups.flatMap(g => [g.module ? groupHead(g.module) : null, ...g.rows.map(row)].filter(Boolean)), ...(prod ? [prod] : []));
}

/* Prateleira de casos clínicos: cartões grandes que rolam de lado; só aparece se houver caso no acervo. */
export function renderCases() {
  const list = mats().filter(m => m.type === CASE_TYPE).sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  $("#cases-section").hidden = !list.length;
  if (!list.length) { $("#cases").replaceChildren(); return; }
  $("#cases-all").textContent = `Ver ${list.length === 1 ? "o caso" : "todos os " + list.length} →`;
  $("#cases").replaceChildren(...list.slice(0, 8).map(m => {
    const where = [pathOf(m.areaId).at(-1)?.name, m.subject].filter(Boolean).join(" · ");
    return h("article", { class: "case-card", style: `--c:var(${moduleToken(m.areaId)})` },
      h("p", { class: "mono", text: where || "Caso clínico" }),
      h("h3", null, h("button", { type: "button", "data-mid": m.id, "aria-label": `${m.title || "Caso clínico"}${where ? " — " + where : ""}`, text: caseTitle(m.title) })),
      openLink(m, "case-open", "Abrir original"));
  }));
}
export function wireCases(go) {
  $("#cases-all").addEventListener("click", () => go({ ...EMPTY_FILTERS, type: CASE_TYPE }));
}

/* Livro: autor e título, com "onde ler" (sem capa da editora). */
function bookRow(m) {
  const open = m.source && /aberto|open/i.test(m.source + " " + (m.tags || []).join(" "));
  return h("article", { class: "book", style: `--c:var(${moduleToken(m.areaId)})` },
    h("p", { class: "mono", text: pathOf(m.areaId)[0]?.name || "Livro" }),
    h("h3", null, h("button", { type: "button", "data-mid": m.id, text: m.title || "(sem título)" })),
    h("p", { class: "small", text: m.source || "" }),
    openLink(m, "open small", open ? "Ler livro aberto" : "Onde ler"));
}
const byUnitName = name => mats().filter(m => norm(pathOf(m.areaId)[1]?.name || "") === norm(name)).sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
export function renderShelves(resume) {
  const geral = S.acervo === "geral", others = mats().filter(m => m !== resume && m.type !== CASE_TYPE);
  const desk = others.filter(m => m.status === "em-estudo" || m.favorite)
    .sort((a, b) => (b.status === "em-estudo") - (a.status === "em-estudo") || cmpName(a.title || "", b.title || "")).slice(0, 4);
  $("#reading").hidden = !desk.length || geral;
  $("#reading-list").replaceChildren(...desk.map(miniCard));
  const books = geral ? mats().filter(m => m.type === "Livro" && norm(pathOf(m.areaId)[1]?.name || "") === norm("Livros de referência")) : [];
  $("#books-section").hidden = !books.length;
  $("#books").replaceChildren(...books.map(bookRow));
  const own = geral ? byUnitName("Materiais próprios").slice(0, 3) : [], web = geral ? byUnitName("Da internet").slice(0, 6) : [];
  $("#own-section").hidden = !own.length; $("#own").replaceChildren(...own.map(miniCard));
  $("#web-section").hidden = !web.length; $("#web").replaceChildren(...web.map(miniCard));
  const recent = geral ? [] : [...others].sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || "")).slice(0, 3);
  $("#recent-section").hidden = !recent.length;
  $("#recent").replaceChildren(...recent.map(miniCard));
}
export const hideShelves = () => ["#reading", "#recent-section", "#books-section", "#own-section", "#web-section", "#cases-section"].forEach(s => { $(s).hidden = true; });
