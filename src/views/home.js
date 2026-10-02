/* Início: título, busca, números reais, retomada, coração-mapa e índice dos módulos. */
import { S, ready } from "../core/state.js";
import { $, h } from "../core/dom.js";
import { plural, validDate, cmpName } from "../core/text.js";
import { childrenOf, moduleList, moduleNumber, pathOf, countLabel } from "../core/areas.js";
import { miniCard, openLink, moduleToken } from "./cards.js";
import { drawMap, mapVisible, wireMap, focusModuleLabel } from "./map.js";

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

function renderCounts(mods) {
  const live = mods.filter(m => m.live).length;
  const box = $("#counts");
  if (!ready()) { box.textContent = S.dbState === "loading" ? "Carregando o acervo…" : ""; return; }
  box.replaceChildren(h("i", { "aria-hidden": "true" }), h("b", { text: String(S.materials.length) }), ` ${S.materials.length === 1 ? "material" : "materiais"} · `,
    h("b", { text: `${live} de ${mods.length}` }), ` ${mods.length === 1 ? "módulo" : "módulos"} com material`);
}
function renderResume() {
  const box = $("#resume");
  const last = S.materials.filter(m => validDate(m.lastOpenedAt)).sort((a, b) => b.lastOpenedAt.localeCompare(a.lastOpenedAt))[0];
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
  const box = $("#course-index");
  $("#index-meta").textContent = mods.length ? `${plural(mods.length, "módulo", "módulos")} · ${mods.filter(m => m.live).length} com material` : "";
  if (!mods.length) { box.replaceChildren(h("p", { class: "muted", text: ready() ? "Nenhum módulo criado ainda. Quem edita cria a estrutura em Organizar." : "" })); return; }
  const live = mods.filter(m => m.live), waiting = mods.filter(m => !m.live);
  const rows = live.map(m => {
    const units = childrenOf(m.id);
    return h("article", { class: "index-row", style: `--c:var(${m.token})` },
      h("a", { class: "index-num", href: "#a-" + m.id, "data-module": m.id, "aria-label": `${m.name}: ${countLabel(m.count)}` }, m.name),
      h("div", null,
        h("h3", { text: units.length ? units.map(u => u.name).join(" · ") : m.name }),
        h("p", { text: `${countLabel(m.count)} · ${moduleNumber(m.index).toUpperCase()} · ${m.art}` })),
      h("a", { class: "index-go", href: "#a-" + m.id, "aria-hidden": "true", tabindex: "-1" }, "↗"));
  });
  const prod = waiting.length ? h("div", { class: "production-index" }, h("span", { text: "Em produção · ainda não irrigados" }),
    waiting.map(m => h("a", { href: "#a-" + m.id, "data-module": m.id, "aria-label": `${m.name}, em produção`, text: m.name }))) : null;
  box.replaceChildren(...rows, ...(prod ? [prod] : []));
}
function renderShelves(resume) {
  const others = S.materials.filter(m => m !== resume);
  const desk = others.filter(m => m.status === "em-estudo" || m.favorite)
    .sort((a, b) => (b.status === "em-estudo") - (a.status === "em-estudo") || cmpName(a.title || "", b.title || "")).slice(0, 4);
  $("#reading").hidden = !desk.length;
  $("#reading-list").replaceChildren(...desk.map(miniCard));
  const recent = [...S.materials].sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || "")).slice(0, 3);
  $("#recent-section").hidden = !recent.length;
  $("#recent").replaceChildren(...recent.map(miniCard));
}

export function renderHome() {
  const mods = ready() ? moduleList() : [];
  renderCounts(mods);
  const resume = ready() ? renderResume() : null;
  if (!ready()) $("#resume").hidden = true;
  renderIndex(mods);
  if (ready()) renderShelves(resume); else { $("#reading").hidden = true; $("#recent-section").hidden = true; }
  drawMap(mods);
}
export function wireHome() {
  wireMap();
  // "Ctrl K" só aparece onde há teclado físico provável.
  const mac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  document.querySelectorAll(".kbd").forEach(k => { k.textContent = mac ? "⌘ K" : "Ctrl K"; });
}
