/* Folhas de material: título completo (nunca cortado), tipo, onde fica, situação, favorito e "Abrir original". */
import { STATUS_LABEL } from "../core/state.js";
import { h, svg, ICON } from "../core/dom.js";
import { marked, validUrl } from "../core/text.js";
import { modules, pathOf, areaLabel } from "../core/areas.js";
import { markOpened, popping, pop, materialWrites } from "../core/actions.js";

export const moduleToken = areaId => {
  const mod = pathOf(areaId)[0]; const i = mod ? modules().findIndex(a => a.id === mod.id) : -1;
  return i < 0 ? "--muted" : `--m${(i % 8) + 1}`;
};
export const whereText = (m, from = "") => (areaLabel(m.areaId, from) || "Sem área definida");

export function openLink(m, cls = "open", label = "Abrir original") {
  if (!m.url || !validUrl(m.url)) return h("span", { class: "muted small", text: "Sem link válido" });
  return h("a", { class: cls, href: m.url, target: "_blank", rel: "noopener noreferrer", "aria-label": `${label} (abre em nova aba): ${m.title || "material"}`, onclick: () => markOpened(m.id) },
    h("span", { text: label }), svg(ICON.ext));
}
export function statusChip(s) {
  const v = s || "nao-iniciado";
  return h("span", { class: "chip status", "data-s": v, text: STATUS_LABEL[v] || STATUS_LABEL["nao-iniciado"] });
}
export function favButton(m) {
  const on = !!m.favorite, busy = materialWrites.has(m.id);
  return h("button", { class: "favorite" + (popping(m.id) && on ? " pop" : ""), type: "button", "data-fav": m.id, "aria-pressed": String(on), "aria-disabled": String(busy),
    "aria-label": (on ? "Remover dos favoritos: " : "Favoritar: ") + (m.title || "material"),
    style: popping(m.id) ? `--pop-delay:-${Math.round(performance.now() - pop.at)}ms` : null }, svg(ICON.star));
}

/* Folha completa (página do módulo). "from" = área já mostrada no cabeçalho, para não repetir. */
export function materialCard(m, { toks = [], from = "", where = true } = {}) {
  const st = m.status || "nao-iniciado";
  return h("article", { class: "material", style: `--c:var(${moduleToken(m.areaId)})` },
    h("div", { class: "mat-main" },
      h("p", { class: "material-meta" }, h("span", { class: "mono", text: m.type || "Link" }),
        where ? h("span", { text: whereText(m, from) }) : h("span", { class: "sr", text: "Em " + whereText(m) }), m.period ? h("span", { text: m.period }) : null),
      h("h3", { class: "material-title" }, h("button", { type: "button", "data-mid": m.id }, marked(m.title || "(sem título)", toks))),
      h("p", { class: "material-bottom" }, m.subject ? h("span", { class: "subj" }, marked(m.subject, toks)) : null, st !== "nao-iniciado" ? statusChip(st) : null, openLink(m))),
    favButton(m));
}
/* Cartão curto (início): tipo, título e onde fica. */
export function miniCard(m) {
  return h("article", { class: "mini-card", style: `--c:var(${moduleToken(m.areaId)})` },
    h("p", { class: "mono", text: [m.type || "Link", (m.status === "em-estudo" ? STATUS_LABEL["em-estudo"] : "")].filter(Boolean).join(" · ") }),
    h("h3", null, h("button", { type: "button", "data-mid": m.id, text: m.title || "(sem título)" })),
    h("p", { class: "small", text: [pathOf(m.areaId).map(a => a.name).join(" › ") || "Sem área definida", m.subject].filter(Boolean).join(" · ") }));
}
