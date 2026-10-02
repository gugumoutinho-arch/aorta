/* Busca rápida (Ctrl/⌘ + K ou "/"): materiais, matérias, unidades e módulos, sem acento e sem maiúscula.
   Quem já sabe o que procura chega à ficha em dois toques; quem não sabe vê os caminhos que existem. */
import { S, ACERVOS, ready } from "../core/state.js";
import { $, $$, h } from "../core/dom.js";
import { tokens, marked, norm, plural } from "../core/text.js";
import { moduleList, pathOf, treeOrder, countIn, countLabel, acervoOf } from "../core/areas.js";
import { openDlg, closeDlg } from "../ui/dialogs.js";
import { openDetail } from "./detail.js";
import { moduleToken } from "./cards.js";

let options = [], active = -1, origin = null;
const pal = () => $("#palette");
const hay = m => norm([m.title, pathOf(m.areaId).map(a => a.name).join(" "), m.subject, m.type, (m.tags || []).join(" ")].join(" "));

function results(q) {
  const toks = tokens(q), groups = [];
  if (!ready()) return [{ label: S.dbState === "loading" ? "Carregando o acervo…" : "O acervo não está disponível agora.", items: [] }];
  const mods = moduleList();
  const tag = id => ACERVOS[acervoOf(id)].label;
  if (!toks.length) {
    // Sem texto: os caminhos dos dois acervos, o atual primeiro.
    for (const key of [S.acervo, ...Object.keys(ACERVOS).filter(k => k !== S.acervo)]) {
      const list = moduleList(key);
      if (list.length) groups.push({ label: `${ACERVOS[key].label} · ${ACERVOS[key].units}`, items: list.map(m => ({ kind: "area", id: m.id, title: m.name, sub: countLabel(m.count), token: m.token, badge: m.name.slice(0, 3) })) });
    }
    return groups;
  }
  const mats = S.materials.filter(m => toks.every(t => hay(m).includes(t))).slice(0, 8);
  if (mats.length) groups.push({ label: "Materiais", items: mats.map(m => ({ kind: "material", id: m.id, title: m.title || "(sem título)", sub: [tag(m.areaId), pathOf(m.areaId).map(a => a.name).join(" › ") || "Sem área definida", m.subject, m.type].filter(Boolean).join(" · "), token: moduleToken(m.areaId), badge: (m.type || "Link").slice(0, 2) })) });
  const areas = treeOrder().filter(([a]) => toks.every(t => norm(pathOf(a.id).map(x => x.name).join(" ")).includes(t))).slice(0, 6);
  if (areas.length) groups.push({ label: "Módulos, unidades e matérias", items: areas.map(([a]) => ({ kind: "area", id: a.id, title: pathOf(a.id).map(x => x.name).join(" › "), sub: `${tag(a.id)} · ${countLabel(countIn(a.id))}`, token: moduleToken(a.id), badge: (pathOf(a.id)[0]?.name || "").slice(0, 3) })) });
  if (!groups.length) groups.push({ label: "Nenhum resultado", empty: `Nada encontrado para “${q.trim()}”. A busca usa título, matéria, assunto, tipo e etiquetas, não o texto dos arquivos. Caminhos que já têm material:`,
    items: mods.filter(m => m.live).map(m => ({ kind: "area", id: m.id, title: m.name, sub: plural(m.count, "material", "materiais"), token: m.token, badge: m.name })) });
  return groups;
}

function render() {
  const q = $("#pq").value, toks = tokens(q), list = $("#results");
  options = []; let n = 0;
  const nodes = [];
  results(q).forEach((g, gi) => {
    nodes.push(h("li", { class: "grp mono", role: "presentation", id: "grp-" + gi, text: g.label }));
    if (g.empty) nodes.push(h("li", { class: "empty-note", role: "presentation", text: g.empty }));
    g.items.forEach(it => {
      const id = "opt-" + n++;
      options.push({ ...it, el: id });
      nodes.push(h("li", { role: "option", id, "aria-selected": "false", class: "opt", style: `--c:var(${it.token})`, "data-i": String(options.length - 1) },
        h("span", { class: "ic", "aria-hidden": "true", text: it.badge }),
        h("span", { class: "txt" }, h("strong", null, marked(it.title, toks)), h("small", { text: it.sub })),
        h("span", { class: "ty mono", text: it.kind === "material" ? "Ficha" : "Abrir" })));
    });
  });
  list.replaceChildren(...nodes);
  setActive(options.length ? 0 : -1);
}
function setActive(i) {
  active = i;
  $$("#results [role=option]").forEach((o, k) => o.setAttribute("aria-selected", String(k === i)));
  const opt = options[i];
  if (opt) { $("#pq").setAttribute("aria-activedescendant", opt.el); document.getElementById(opt.el)?.scrollIntoView({ block: "nearest" }); }
  else $("#pq").removeAttribute("aria-activedescendant");
}
function choose(i) {
  const o = options[i]; if (!o) return;
  closeDlg(pal(), true);
  if (o.kind === "material") openDetail(o.id, origin);
  else location.hash = "a-" + o.id;
}
export function openPalette() {
  if ($("#dlg-form").open || $("#dlg-theme").open) return;
  if ($("#dlg-detail").open) closeDlg($("#dlg-detail"), true);
  origin = document.activeElement;
  $("#pq").value = ""; render();
  openDlg(pal(), origin);
  requestAnimationFrame(() => $("#pq").focus());
}

export function wirePalette() {
  $$("[data-search]").forEach(b => b.addEventListener("click", openPalette));
  $("#pq").addEventListener("input", render);
  $("#pq").addEventListener("keydown", e => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); if (options.length) setActive((active + (e.key === "ArrowDown" ? 1 : options.length - 1)) % options.length); }
    else if (e.key === "Enter") { e.preventDefault(); choose(active); }
    else if (e.key === "Home" && options.length && !$("#pq").value) { e.preventDefault(); setActive(0); }
  });
  $("#results").addEventListener("click", e => { const o = e.target.closest("[role=option]"); if (o) choose(+o.dataset.i); });
  $("#results").addEventListener("pointermove", e => { const o = e.target.closest("[role=option]"); if (o && +o.dataset.i !== active) setActive(+o.dataset.i); });
  document.addEventListener("keydown", e => {
    if ((e.ctrlKey || e.metaKey) && !e.altKey && e.key.toLowerCase() === "k") { e.preventDefault(); pal().open ? closeDlg(pal(), true) : openPalette(); return; }
    if (e.key !== "/" || e.ctrlKey || e.metaKey || e.altKey || document.querySelector("dialog[open]")) return;
    const t = e.target; if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    e.preventDefault();
    if (S.view === "modulo") $("#lib-q").focus(); else openPalette();
  });
}
