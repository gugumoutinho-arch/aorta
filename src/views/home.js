/* Início de cada acervo: título, busca, números reais, retomada, mapa (coração ou folha) e o que vem abaixo dele —
   na IDOMED, módulos do curso, mesa de estudo e recentes; em medicina geral, disciplinas, livros de referência,
   materiais próprios e o melhor da internet. */
import gsap from "gsap";
import { S, ACERVOS, ready, reducedMotion } from "../core/state.js";
import { $, h } from "../core/dom.js";
import { plural, validDate, cmpName, norm } from "../core/text.js";
import { childrenOf, moduleList, moduleNumber, pathOf, countLabel, inAcervo } from "../core/areas.js";
import { miniCard, openLink, moduleToken } from "./cards.js";
import { drawMap, mapVisible, wireMap, focusModuleLabel } from "./map.js";
import { concept } from "./concept.js";
import { revealHeadline, revealIn, countTo } from "../ui/motion.js";

const REVEAL = ".section-heading h2, .index-row, .production-index, .mini-card, .book";
let revealed = false;
function revealHome(delay = 0) { revealHeadline($("#home-title"), delay); revealIn($("#view-home"), REVEAL); }

/* Textos de cada acervo. A IDOMED aparece como nome do curso, sem marca nem logo, e com o aviso de que o acervo não é oficial. */
const COPY = {
  idomed: {
    h1: ["O que você vai estudar ", "hoje?"], intro: "Provas, resumos e monitoria da IDOMED, organizados como o curso: do M1 ao M8.",
    note: "Acervo feito por estudantes, sem vínculo oficial com a IDOMED.",
  },
  geral: {
    h1: ["Os clássicos da medicina, ", "à mão."], intro: "Livros de referência, materiais próprios e o melhor da internet, por disciplina, para qualquer estudante de medicina.",
    note: "Livros apontam para onde podem ser lidos de forma legítima: biblioteca digital, editora ou edição aberta.",
  },
};

let homeScroll = 0, lastModule = "";
export function homeLeft() { homeScroll = scrollY; lastModule = ""; mapVisible(false); }
export const rememberModule = id => { lastModule = id; };
export function homeReturned() {
  mapVisible(true);
  requestAnimationFrame(() => {
    window.scrollTo(0, homeScroll);
    if (!(lastModule && focusModuleLabel(lastModule))) $("#main").focus({ preventScroll: true });
  });
}
/* Troca de acervo: o início do outro acervo entra por cima, do topo, com o foco no título. */
export function homeSwitched() {
  mapVisible(true); lastModule = "";
  window.scrollTo(0, 0);
  $("#home-title").setAttribute("tabindex", "-1"); $("#home-title").focus({ preventScroll: true });
  if (reducedMotion()) return;
  revealHome();
  gsap.fromTo(["#intro-copy", ".search-plate", "#counts", "#acervo-note"], { opacity: 0, y: 16 },
    { opacity: 1, y: 0, duration: .7, ease: "expo.out", stagger: .06, delay: .15, overwrite: true, clearProps: "opacity,transform" });
  gsap.fromTo("#modules .mod", { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: .6, ease: "expo.out", stagger: .04, delay: .3, clearProps: "opacity,transform" });
}

const mats = () => S.materials.filter(m => inAcervo(m));
let copyFor = "";
function renderCopy() {
  if (copyFor === S.acervo + S.concept) return; // o título só muda com o acervo (e não desfaz a animação a cada redesenho)
  copyFor = S.acervo + S.concept;
  const c = COPY[S.acervo], a = ACERVOS[S.acervo];
  $("#home-title").replaceChildren(c.h1[0], h("em", { text: c.h1[1] }));
  $("#intro-copy").textContent = c.intro;
  $("#acervo-note").textContent = c.note;
  $("#map-title").textContent = `${a.mapTitle} · ${concept().caption}`;
  $("#index-title").textContent = a.indexTitle;
}
function renderCounts(mods) {
  const live = mods.filter(m => m.live).length, a = ACERVOS[S.acervo], n = mats().length;
  const box = $("#counts");
  if (!ready()) { box.dataset.built = ""; box.textContent = S.dbState === "loading" ? "Carregando o acervo…" : ""; return; }
  if (box.dataset.built !== "1") {
    box.dataset.built = "1";
    box.replaceChildren(h("i", { "aria-hidden": "true" }), h("b", { id: "count-n", text: "0" }), h("span", { id: "count-n-word" }), " · ",
      h("b", { id: "count-live" }), h("span", { id: "count-unit" }));
  }
  countTo($("#count-n"), n);
  $("#count-n-word").textContent = ` ${n === 1 ? "material" : "materiais"}`;
  $("#count-live").textContent = `${live} de ${mods.length}`;
  $("#count-unit").textContent = ` ${mods.length === 1 ? a.unit : a.units} com material`;
}
function renderResume() {
  const box = $("#resume");
  const last = mats().filter(m => validDate(m.lastOpenedAt)).sort((a, b) => b.lastOpenedAt.localeCompare(a.lastOpenedAt))[0];
  box.hidden = !last;
  if (!last) { box.replaceChildren(); return null; }
  box.setAttribute("style", `--c:var(${moduleToken(last.areaId)})`);
  box.replaceChildren(h("span", { class: "rib", "aria-hidden": "true" }),
    h("div", null,
      h("p", { class: "small", text: "Continuar · " + (pathOf(last.areaId).map(a => a.name).join(" › ") || "Sem área definida") }),
      h("button", { class: "resume-title", type: "button", "data-mid": last.id, text: last.title || "(sem título)" }),
      openLink(last, "open small", "Abrir original")));
  return last;
}
function renderIndex(mods) {
  const box = $("#course-index"), a = ACERVOS[S.acervo];
  $("#index-meta").textContent = mods.length ? `${plural(mods.length, a.unit, a.units)} · ${mods.filter(m => m.live).length} com material` : "";
  if (!mods.length) { box.replaceChildren(h("p", { class: "muted", text: ready() ? `Nenhum(a) ${a.unit} criado(a) ainda. Quem edita cria a estrutura em Organizar.` : "" })); return; }
  const live = mods.filter(m => m.live), waiting = mods.filter(m => !m.live);
  const rows = live.map(m => {
    const units = childrenOf(m.id), liveUnits = units.filter(u => mats().some(x => pathOf(x.areaId).some(p => p.id === u.id)));
    return h("article", { class: "index-row" + (S.acervo === "geral" ? " is-discipline" : ""), style: `--c:var(${m.token})` },
      h("a", { class: "index-num", href: "#a-" + m.id, "data-module": m.id, "aria-label": `${m.name}: ${countLabel(m.count)}` }, m.name),
      h("div", null,
        h("h3", { text: units.length ? (S.acervo === "geral" ? liveUnits : units).map(u => u.name).join(" · ") : m.name }),
        h("p", { text: `${countLabel(m.count)} · ${concept().labelTop ? "destino: " + concept().labelTop(m) : moduleNumber(m.index).toUpperCase() + (S.concept === "coracao" ? " · " + m.art : "")}` })),
      h("a", { class: "index-go", href: "#a-" + m.id, "aria-hidden": "true", tabindex: "-1" }, "↗"));
  });
  const prod = waiting.length ? h("div", { class: "production-index" }, h("span", { text: "Em produção · ainda sem material" }),
    waiting.map(m => h("a", { href: "#a-" + m.id, "data-module": m.id, "aria-label": `${m.name}, em produção`, text: m.name }))) : null;
  box.replaceChildren(...rows, ...(prod ? [prod] : []));
}

/* Capa tipográfica de livro: autor grande, título, onde ler. Sem imagem de capa (direitos da editora). */
function bookCard(m) {
  const [author, ...rest] = String(m.title || "").split(" — ");
  const open = m.source && /aberto|open/i.test(m.source + " " + (m.tags || []).join(" "));
  return h("article", { class: "book", style: `--c:var(${moduleToken(m.areaId)})` },
    h("div", { class: "book-cover", "aria-hidden": "true" }, h("span", { class: "book-spine" }), h("b", { text: author }), h("span", { text: rest.join(" — ") || "" })),
    h("div", { class: "book-meta" },
      h("p", { class: "mono", text: pathOf(m.areaId)[0]?.name || "Livro" }),
      h("h3", null, h("button", { type: "button", "data-mid": m.id, text: m.title || "(sem título)" })),
      h("p", { class: "small", text: m.source || "" }),
      openLink(m, "open small", open ? "Ler livro aberto" : "Onde ler")));
}
function byUnitName(name) {
  const key = norm(name);
  return mats().filter(m => norm(pathOf(m.areaId)[1]?.name || "") === key).sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
}
function renderShelves(resume) {
  const geral = S.acervo === "geral";
  const others = mats().filter(m => m !== resume);
  const desk = others.filter(m => m.status === "em-estudo" || m.favorite)
    .sort((a, b) => (b.status === "em-estudo") - (a.status === "em-estudo") || cmpName(a.title || "", b.title || "")).slice(0, 4);
  $("#reading").hidden = !desk.length || geral;
  $("#reading-list").replaceChildren(...desk.map(miniCard));
  const books = geral ? mats().filter(m => m.type === "Livro" && norm(pathOf(m.areaId)[1]?.name || "") === norm("Livros de referência")) : [];
  $("#books-section").hidden = !books.length;
  $("#books").replaceChildren(...books.map(bookCard));
  const own = geral ? byUnitName("Materiais próprios").slice(0, 3) : [], web = geral ? byUnitName("Da internet").slice(0, 6) : [];
  $("#own-section").hidden = !own.length; $("#own").replaceChildren(...own.map(miniCard));
  $("#web-section").hidden = !web.length; $("#web").replaceChildren(...web.map(miniCard));
  const recent = geral ? [] : [...others].sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || "")).slice(0, 3);
  $("#recent-section").hidden = !recent.length;
  $("#recent").replaceChildren(...recent.map(miniCard));
}

export function renderHome() {
  renderCopy();
  const mods = ready() ? moduleList() : [];
  concept().decorate?.(mods);
  renderCounts(mods);
  const resume = ready() ? renderResume() : null;
  if (!ready()) $("#resume").hidden = true;
  renderIndex(mods);
  if (ready()) renderShelves(resume);
  else ["#reading", "#recent-section", "#books-section", "#own-section", "#web-section"].forEach(s => { $(s).hidden = true; });
  drawMap(mods);
  // Primeira chegada com dados: o conteúdo entra em cascata (o título já entrou na primeira pintura).
  if (ready() && !revealed && S.view === "inicio") { revealed = true; requestAnimationFrame(() => revealIn($("#view-home"), REVEAL)); }
}
export function wireHome() {
  wireMap();
  // Título por linhas assim que as fontes chegam, sem esperar o banco (não pisca quando os dados chegam depois).
  if (S.view === "inicio") (document.fonts?.ready || Promise.resolve()).then(() => { renderCopy(); revealHeadline($("#home-title"), .05); });
  // "Ctrl K" só aparece onde há teclado físico provável.
  const mac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  document.querySelectorAll(".kbd").forEach(k => { k.textContent = mac ? "⌘ K" : "Ctrl K"; });
}
