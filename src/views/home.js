/* Início de cada acervo (direção D): um palco com o mapa (coração ou corpo), título, busca e o "Continuar" em vidro;
   ao rolar, vira editorial — índice numerado, prateleira de casos clínicos e as listas do acervo (home-index.js). */
import gsap from "gsap";
import { S, ACERVOS, EMPTY_FILTERS, ready, reducedMotion } from "../core/state.js";
import { $, h } from "../core/dom.js";
import { plural, validDate } from "../core/text.js";
import { moduleList, pathOf, descIds, inAcervo } from "../core/areas.js";
import { openLink, moduleToken } from "./cards.js";
import { drawMap, mapVisible, wireMap, focusModuleLabel, featureModule } from "./map.js";
import { renderIndex, renderCases, wireCases, renderShelves, hideShelves } from "./home-index.js";
import { revealHeadline, cancelHeadline, revealIn, countTo } from "../ui/motion.js";
import { motionTokens } from "../ui/tokens.js";
import { cascade } from "../ui/choreo.js";
import { concept } from "./concept.js";

const REVEAL = ".section-heading h2, .index-aside > *, .index-group, .index-row, .production-index, .case-card, .mini-card, .book";
let revealed = false;
function revealHome(delay = 0) { revealHeadline($("#home-title"), delay); revealIn($("#view-home"), REVEAL); }

/* Textos de cada acervo: definidos uma vez em index.html (window.aortaCopy), aplicados antes da primeira pintura.
   A IDOMED aparece como nome do curso, sem marca nem logo, e com o aviso de que o acervo não é oficial.
   O fim do título (h1[2]) some no celular, onde o palco é compacto. */
const COPY = window.aortaCopy;

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
  // A entrada fica numa linha do tempo guardada: é ela que se cancela (por referência) se o aluno ligar "reduzir movimento" no meio.
  entrance?.kill();
  const t = motionTokens();
  entrance = gsap.timeline({ onComplete: () => { entrance = null; } });
  entrance.fromTo(["#intro-copy", ".search-plate", "#counts", "#acervo-note"], { opacity: 0, y: 12 },
    { opacity: 1, y: 0, duration: t.enter, ease: t.easeEnter, stagger: cascade(), clearProps: "opacity,transform" }, .15);
  // As âncoras têm transform de layout. Só seu conteúdo pode se deslocar.
  entrance.fromTo("#modules .mod > *", { opacity: 0 }, { opacity: 1, duration: t.swap, ease: t.easeRespond, stagger: cascade(.01, 24), clearProps: "opacity" }, 0);
}
let entrance = null;
/* Cancela a entrada em andamento e deixa tudo visível e sem estilo inline (movimento reduzido). */
export function settleEntrance() {
  entrance?.kill(); entrance = null;
  const els = ["#intro-copy", ".search-plate", "#counts", "#acervo-note", "#modules .mod > *"].flatMap(sel => [...document.querySelectorAll(sel)]);
  gsap.set(els, { clearProps: "opacity,transform" });
}

const mats = () => S.materials.filter(m => inAcervo(m));
let copyFor = "";
function renderCopy() {
  const c = COPY[S.acervo], a = ACERVOS[S.acervo], key = S.acervo + S.concept, text = c.h1.join("");
  // O título só é reescrito quando o acervo muda (não desfaz a animação a cada redesenho), mas o texto real do DOM
  // também é conferido: se algo chegou fora de ordem sob carga, a tela se corrige sozinha.
  if (copyFor === key && $("#home-title").textContent === text) return;
  copyFor = key;
  cancelHeadline($("#home-title"));
  $("#home-title").replaceChildren(c.h1[0], h("em", { text: c.h1[1] }), ...(c.h1[2] ? [h("span", { class: "h1-tail", text: c.h1[2] })] : []), c.h1[3]);
  $("#intro-copy").textContent = c.intro;
  $("#acervo-note").textContent = c.note;
  $("#map-title").textContent = `${a.mapTitle} · ${concept().caption}`;
}
function renderCounts(mods) {
  const live = mods.filter(m => m.live).length, a = ACERVOS[S.acervo], n = mats().length;
  const box = $("#counts");
  if (!ready()) { box.dataset.built = ""; box.textContent = S.dbState === "loading" ? "Carregando o acervo…" : ""; $("#search-label").textContent = "Buscar assunto, matéria ou material"; return; }
  if (box.dataset.built !== "1") {
    box.dataset.built = "1";
    box.replaceChildren(h("i", { "aria-hidden": "true" }), h("b", { id: "count-n", text: "0" }), h("span", { id: "count-n-word" }), " · ",
      h("b", { id: "count-live" }), h("span", { id: "count-unit" }));
  }
  countTo($("#count-n"), n);
  $("#count-n-word").textContent = ` ${n === 1 ? "material" : "materiais"}`;
  $("#count-live").textContent = `${live} de ${mods.length}`;
  $("#count-unit").textContent = ` ${mods.length === 1 ? a.unit : a.units} com material`;
  // A placa diz o tamanho do que dá para achar: materiais e assuntos deste acervo.
  const ids = new Set(mods.flatMap(m => [...descIds(m.id)])), topics = S.topics.filter(t => ids.has(t.areaId)).length;
  // No celular a placa diz só os materiais (uma linha, sem pular); os assuntos aparecem a partir de 641 px.
  $("#search-label").replaceChildren(...(n ? [`Buscar em ${plural(n, "material", "materiais")}`, topics ? h("span", { class: "search-more", text: " e " + plural(topics, "assunto", "assuntos") }) : ""] : ["Buscar assunto, matéria ou material"]));
}
/* "Continuar" (painel de vidro sobre o palco). Sem histórico, o mesmo lugar convida a começar pelo primeiro módulo com
   material: o espaço fica sempre ocupado depois que os dados chegam (sem salto de layout no celular). */
function renderResume(mods) {
  const box = $("#resume");
  const last = mats().filter(m => validDate(m.lastOpenedAt)).sort((a, b) => b.lastOpenedAt.localeCompare(a.lastOpenedAt))[0];
  const first = mods.find(m => m.live);
  box.hidden = !last && !first;
  $("#resume-slot").dataset.filled = String(!box.hidden);
  if (last) {
    box.className = "resume"; box.setAttribute("style", `--c:var(${moduleToken(last.areaId)})`);
    box.replaceChildren(
      h("div", { class: "resume-text" },
        h("p", { class: "mono", text: "Continuar · " + (pathOf(last.areaId).map(a => a.name).join(" › ") || "Sem área definida") }),
        h("button", { class: "resume-title", type: "button", "data-mid": last.id, text: last.title || "(sem título)" })),
      openLink(last, "resume-go", "Abrir original"));
    featureModule(pathOf(last.areaId)[0]?.id);
    return last;
  }
  if (first) {
    box.className = "resume start"; box.setAttribute("style", `--c:var(${first.token})`);
    box.replaceChildren(
      h("div", { class: "resume-text" }, h("p", { class: "mono", text: "Comece por aqui" }),
        h("a", { class: "resume-title", href: "#a-" + first.id, "data-module": first.id, text: `${first.name} · ${plural(first.count, "material", "materiais")}` })),
      h("a", { class: "resume-go", href: "#a-" + first.id, tabindex: "-1", "aria-hidden": "true" }, "→"));
    featureModule(first.id);
  } else box.replaceChildren();
  return null;
}

export function renderHome() {
  renderCopy();
  const mods = ready() ? moduleList() : [];
  concept().decorate?.(mods);
  renderCounts(mods);
  drawMap(mods);
  const resume = ready() ? renderResume(mods) : null;
  if (!ready()) { $("#resume").hidden = true; $("#resume-slot").dataset.filled = "pending"; } // o espaço fica reservado até os dados chegarem
  renderIndex(mods);
  if (ready()) { renderCases(); renderShelves(resume); } else hideShelves();
  // Primeira chegada com dados: o conteúdo entra em cascata (o título já entrou na primeira pintura).
  if (ready() && !revealed && S.view === "inicio") { revealed = true; requestAnimationFrame(() => revealIn($("#view-home"), REVEAL)); }
}
/* "Ver todos" dos casos e o "Favoritos" da barra inferior: todos os materiais do acervo já filtrados. */
export function showAll(filters) {
  const apply = () => { S.q = ""; S.f = { ...EMPTY_FILTERS, ...filters }; window.dispatchEvent(new Event("aorta:render")); };
  if (location.hash !== "#todos") { addEventListener("hashchange", apply, { once: true }); location.hash = "todos"; } else apply();
}
/* "Mapa" da barra inferior: o índice do curso, no início do acervo atual. */
export function goIndex() {
  const go = () => { const el = $("#indice"); el.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "start" }); el.focus({ preventScroll: true }); };
  if (S.view !== "inicio") { addEventListener("hashchange", () => requestAnimationFrame(go), { once: true }); location.hash = "inicio"; } else go();
}
export function wireHome() {
  wireMap();
  wireCases(showAll);
  matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change", e => {
    if (e.matches) settleEntrance();
  });
  // Título por linhas assim que as fontes chegam, sem esperar o banco (não pisca quando os dados chegam depois).
  if (S.view === "inicio") (document.fonts?.ready || Promise.resolve()).then(() => { renderCopy(); revealHeadline($("#home-title"), .05); });
  // "Ctrl K" só aparece onde há teclado físico provável.
  const mac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  document.querySelectorAll(".kbd").forEach(k => { k.textContent = mac ? "⌘ K" : "Ctrl K"; });
}
