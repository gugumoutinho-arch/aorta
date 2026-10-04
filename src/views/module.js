/* Página do módulo (ou de todo o acervo): numeral e artéria no cabeçalho, unidades como abas, matérias ao lado,
   materiais como folhas. Também é aqui que a transição a partir do coração termina. */
import gsap from "gsap";
import { S, ACERVOS, TYPES, STATUS, STATUS_LABEL, EMPTY_FILTERS, IN_PRODUCTION, ready, topicsReady, reducedMotion, collName, savePrefs, remember } from "../core/state.js";
import { $, $$, h, svg, ICON } from "../core/dom.js";
import { tokens, plural, cmpName, byKey } from "../core/text.js";
import { childrenOf, modules, moduleList, moduleNumber, pathOf, descIds, areaById, areasWithContent, areaLabel, treeOrder, acervoOf, inAcervo } from "../core/areas.js";
import { concept, syncConcept } from "./concept.js";
import { DESTINATIONS, partFor } from "../body/routes.js";
import { onThemeChange } from "../ui/theme.js";
import { syncAcervoTabs } from "../app.js";
import { slideIndicator } from "../ui/indicator.js";
import { revealIn } from "../ui/motion.js";
import { motionTokens } from "../ui/tokens.js";
import { enter } from "../ui/choreo.js";
import { CASES, tabContext, topicTabs, inTab, firstTopicName, areaRoute } from "../domain/topics.js";
import { renderTopicTabs } from "./topic-tabs.js";
let unitsInk = null;
/* Assuntos da matéria escolhida, montado uma vez por desenho (ver renderModule). */
let ctx = tabContext({ areaId: "", topics: [], links: [] });

/* ---------- órgão em destaque (conceito corpo) ---------- */
let organ = null, organKey = "", organBoot = 0;
export function moduleLeft() {
  organBoot++; organ?.dispose(); organ = null; organKey = "";
  $$(".flight").forEach(n => { gsap.killTweensOf(n); n.remove(); });
  gsap.killTweensOf($("#module-title")); gsap.set($("#module-title"), { clearProps: "opacity,transform" });
}
let organSupported;
const canOrgan = () => {
  if (S.concept !== "corpo" || reducedMotion() || navigator.connection?.saveData || navigator.deviceMemory <= 2) return false;
  if (organSupported !== undefined) return organSupported;
  try { const gl = document.createElement("canvas").getContext("webgl2"); organSupported = !!gl; gl?.getExtension("WEBGL_lose_context")?.loseContext(); }
  catch (_) { organSupported = false; }
  return organSupported;
};
function unitParts(modId) { const map = new Map(); childrenOf(modId).forEach(u => { const p = partFor(u.name); if (p) map.set(u.id, p.key); }); return map; }
function organActive(modId) { const parts = unitParts(modId); return S.unit && parts.has(S.unit) ? [parts.get(S.unit)] : null; }
async function syncOrgan(mod) {
  const box = $("#organ-view"), art = $(".mini-artery");
  const dest = mod && S.concept === "corpo" ? (() => { const list = moduleList(); concept().decorate(list); return list.find(x => x.id === mod.id)?.dest; })() : null;
  const keys = dest ? DESTINATIONS[dest]?.organ : null;
  if (!keys || !canOrgan()) { box.hidden = true; art.style.display = ""; organBoot++; organ?.dispose(); organ = null; organKey = ""; return; }
  box.hidden = false; art.style.display = "none";
  const key = mod.id + "|" + dest;
  if (organKey === key) { organ?.setActive(organActive(mod.id)); return; }
  organ?.dispose(); organ = null; organKey = key;
  const token = ++organBoot, brain = dest === "cerebro";
  try {
    const { createOrganView } = await import("../body/organ.js");
    if (token !== organBoot) return;
    const view = await createOrganView(box, { url: `${import.meta.env.BASE_URL}modelos/corpo.glb`, keys: brain ? [...keys, "spinal_cord"] : keys, frame: brain ? keys : null, yaw: brain ? -1.3 : 0,
      token: moduleList().find(x => x.id === mod.id)?.token || "--m1", isCurrent: () => token === organBoot,
      onPick: part => { const hit = [...unitParts(mod.id)].find(([, k]) => k === part); if (hit) { S.unit = hit[0]; S.subject = ""; S.tab = ""; setHash(S.unit); renderModule(); } } });
    if (token !== organBoot || !view) { view?.dispose(); return; }
    organ = view; organ.setActive(organActive(mod.id));
  } catch (e) { if (token !== organBoot) return; organKey = ""; console.warn("Órgão 3D indisponível:", e); box.hidden = true; art.style.display = ""; }
}
import { materialCard } from "./cards.js";
import { openForm } from "./form.js";
import { rememberModule } from "./home.js";

/* ---------- escopo ---------- */
function resolvePending() {
  if (!S.pendingArea || !ready()) return true;
  const id = S.pendingArea; S.pendingArea = "";
  let scope = "todos", unit = "", subject = "";
  if (id !== "todos" && id !== "sem-area") {
    const p = pathOf(id);
    if (!p.length) { history.replaceState(null, "", "#todos"); }
    else { scope = p[0].id; unit = p[1]?.id || ""; subject = p[2]?.id || ""; }
  }
  if (scope !== S.scope) { S.q = ""; S.f = { ...EMPTY_FILTERS }; }
  if (S.pendingFilters) { S.q = ""; S.f = S.pendingFilters; S.pendingFilters = null; } // "Favoritos" e "Ver todos os casos"
  S.scope = scope; S.unit = unit; S.subject = subject;
  const askedTab = S.pendingTab; S.pendingTab = "";
  S.tab = subject ? askedTab : "";
  if (askedTab && !subject) setHash(unit); // aba só existe dentro de matéria: tira o "/aba" do endereço
  // Abrir uma área de outro acervo (pela busca ou por um link) leva junto o acervo.
  if (scope !== "todos" && acervoOf(scope) !== S.acervo) {
    S.acervo = acervoOf(scope); remember("aorta-acervo", S.acervo); document.body.dataset.acervo = S.acervo;
    syncConcept(); syncAcervoTabs();
  }
  return true;
}
const scopeRoot = () => S.unit || (S.scope === "todos" ? "" : S.scope);
function baseList() {
  const root = scopeRoot();
  if (!root) return S.materials.filter(m => inAcervo(m));
  const set = descIds(root); return S.materials.filter(m => set.has(m.areaId));
}
/* Matérias (folhas da árvore) disponíveis no recorte atual, com o caminho curto para desambiguar nomes iguais. */
function subjectsIn(root) {
  const inside = root ? descIds(root) : null;
  const roots = new Set(modules().map(m => m.id));
  return treeOrder().filter(([a, depth]) => depth === 2 && (inside ? inside.has(a.id) : roots.has(pathOf(a.id)[0]?.id))).map(([a]) => a);
}

/* ---------- filtros ---------- */
const activeFilters = () => [S.f.type, S.f.status, S.f.coll, S.f.fav].filter(Boolean).length;
const anyFilter = () => !!(S.q.trim() || activeFilters());
const haystack = m => [m.title, pathOf(m.areaId).map(a => a.name).join(" "), m.subject, m.type, (m.tags || []).join(" ")].join(" ");
const matchesAll = (m, toks) => { if (!toks.length) return true; const hs = haystack(m).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(); return toks.every(t => hs.includes(t)); };
function filtered(list) {
  const toks = tokens(S.q), sub = S.subject ? descIds(S.subject) : null, byTab = S.tab && topicsReady();
  return list.filter(m => {
    if (sub && !sub.has(m.areaId)) return false;
    if (byTab && !inTab(m, S.tab, ctx)) return false;
    if (S.f.type && m.type !== S.f.type) return false;
    if (S.f.status && (m.status || "nao-iniciado") !== S.f.status) return false;
    if (S.f.coll && !(m.collectionIds || []).includes(S.f.coll)) return false;
    if (S.f.fav && !m.favorite) return false;
    return matchesAll(m, toks);
  });
}
function sorter() {
  const t = m => m.createdAt || "";
  return { recent: (a, b) => t(b).localeCompare(t(a)), old: (a, b) => t(a).localeCompare(t(b)), az: (a, b) => cmpName(a.title || "", b.title || ""), za: (a, b) => cmpName(b.title || "", a.title || "") }[S.sort] || (() => 0);
}
function fillSelect(sel, options, value) {
  sel.replaceChildren(...options.map(([v, l]) => h("option", { value: v, text: l })));
  sel.value = options.some(o => o[0] === value) ? value : options[0][0];
}

/* ---------- desenho ---------- */
function renderHeader(mod) {
  const title = $("#module-title"), meta = $("#artery-name"), sum = $("#module-summary");
  const view = $("#view-module");
  if (S.scope === "todos") {
    view.style.setProperty("--selected", "var(--violet-2)");
    const a = ACERVOS[S.acervo], list = moduleList(), all = S.materials.filter(m => inAcervo(m)).length;
    title.textContent = a.label; title.classList.toggle("long", a.label.length > 4); meta.textContent = `Todos os materiais · ${a.units}`;
    sum.textContent = `${plural(all, "material", "materiais")} · ${list.filter(m => m.live).length} de ${plural(list.length, a.unit, a.units)} com material`;
    $("#module-step").hidden = true; return;
  }
  view.style.setProperty("--selected", `var(${mod.token})`);
  title.textContent = mod.name;
  title.classList.toggle("long", mod.name.length > 4);
  title.classList.toggle("xlong", mod.name.length > 10);
  const c = concept();
  if (c.decorate) { const list = moduleList(); c.decorate(list); const d = list.find(x => x.id === mod.id); meta.textContent = `${c.labelTop(d)} · ${ACERVOS[S.acervo].label}`; }
  else meta.textContent = S.concept === "coracao" ? `${moduleNumber(mod.index)} · ${mod.art}` : `${moduleNumber(mod.index)} · ${ACERVOS[S.acervo].label}`;
  $("#back-home").textContent = concept().back;
  const units = childrenOf(mod.id), live = areasWithContent();
  const waiting = units.filter(u => !live.has(u.id));
  sum.textContent = mod.count
    ? [plural(mod.count, "material", "materiais"), units.length ? plural(units.length, "unidade", "unidades") : "", waiting.length ? `${waiting.map(u => u.name).join(", ")} em produção` : ""].filter(Boolean).join(" · ")
    : "Em produção · este módulo ainda não foi irrigado.";
  $("#module-step").hidden = modules().length < 2;
}
function renderUnits(mod) {
  const box = $("#units"), live = areasWithContent();
  const kids = S.scope === "todos" ? modules() : childrenOf(S.scope);
  box.setAttribute("aria-label", S.scope === "todos" ? ACERVOS[S.acervo].units : "Unidades");
  box.hidden = !kids.length;
  const all = S.scope === "todos" ? S.materials.filter(m => inAcervo(m)).length : mod?.count || 0;
  const tab = (id, label, n, on) => h("button", { type: "button", "data-unit": id, "aria-pressed": String(on) }, label, h("small", { text: n ? plural(n, "material", "materiais") : IN_PRODUCTION }));
  queueMicrotask(() => { unitsInk ||= slideIndicator(box, '[aria-pressed="true"]', "units-ink", { underline: true }); unitsInk(); });
  box.replaceChildren(tab("", S.scope === "todos" ? `Todos (${ACERVOS[S.acervo].units})` : "Todas as unidades", all, !S.unit),
    ...kids.map(u => { const n = live.has(u.id) ? baseCount(u.id) : 0; return tab(u.id, u.name, n, S.unit === u.id); }));
}
const baseCount = id => { const set = descIds(id); return S.materials.filter(m => set.has(m.areaId)).length; };
function renderSubjects(base) {
  const nav = $("#subjects"), root = scopeRoot(), subs = subjectsIn(root);
  nav.hidden = !subs.length;
  if (!subs.length) { nav.replaceChildren(); return; }
  const names = subs.map(s => s.name), dup = n => names.filter(x => x === n).length > 1;
  const item = (id, label, n, hint) => h("button", { type: "button", "data-subject": id, "aria-pressed": String(S.subject === id) },
    h("span", { class: "s-name" }, label, hint ? h("small", { text: hint }) : null), h("span", { class: "num", text: n ? String(n) : "—" }), n ? null : h("span", { class: "sr", text: IN_PRODUCTION }));
  nav.replaceChildren(h("h2", { class: "mono", text: "Matérias" }), item("", "Todas", base.length),
    ...subs.map(s => { const set = descIds(s.id), n = base.filter(m => set.has(m.areaId)).length; const p = pathOf(s.id);
      return item(s.id, s.name, n, dup(s.name) || !root ? p.slice(root ? pathOf(root).length : 0, -1).map(a => a.name).join(" › ") : ""); }));
}
function renderFilters() {
  const types = [...new Set([...S.materials.map(m => m.type).filter(Boolean), S.f.type].filter(Boolean))].sort((a, b) => TYPES.indexOf(a) - TYPES.indexOf(b));
  fillSelect($("#f-type"), [["", "Todos os tipos"], ...types.map(t => [t, t])], S.f.type);
  fillSelect($("#f-status"), [["", "Toda situação"], ...STATUS], S.f.status);
  fillSelect($("#f-coll"), [["", "Todas as coleções"], ...S.collections.map(c => [c.id, c.name])], S.f.coll);
  $("#f-coll").closest("label").hidden = !S.collections.length;
  $("#f-sort").value = S.sort;
  if ($("#lib-q").value !== S.q && document.activeElement !== $("#lib-q")) $("#lib-q").value = S.q;
  $("#f-fav").setAttribute("aria-pressed", String(!!S.f.fav));
  const extra = [S.f.type, S.f.status, S.f.coll].filter(Boolean).length + (S.sort !== "recent" ? 1 : 0);
  $("#f-count").textContent = extra ? ` · ${extra}` : "";
  const chips = [];
  if (S.q.trim()) chips.push([`Busca: “${S.q.trim()}”`, () => { S.q = ""; }]);
  if (S.f.type) chips.push([S.f.type, () => { S.f = { ...S.f, type: "" }; }]);
  if (S.f.status) chips.push([STATUS_LABEL[S.f.status] || S.f.status, () => { S.f = { ...S.f, status: "" }; }]);
  if (S.f.coll) chips.push(["Coleção: " + (collName(S.f.coll) || "removida"), () => { S.f = { ...S.f, coll: "" }; }]);
  if (S.f.fav) chips.push(["Favoritos", () => { S.f = { ...S.f, fav: false }; }]);
  const box = $("#active-filters"); box.hidden = !chips.length;
  box.replaceChildren(...chips.map(([label, clear]) => h("button", { class: "af", type: "button", "aria-label": "Remover filtro: " + label, onclick: () => { clear(); renderModule(); $("#lib-q").focus(); } }, label, svg(ICON.x))),
    chips.length > 1 ? h("button", { class: "af clear", type: "button", text: "Limpar tudo", onclick: clearFilters }) : null);
}
function emptyBlock(title, text, extra) { return h("div", { class: "empty" }, h("h2", { text: title }), h("p", { text }), extra); }
const addButton = areaId => S.db ? h("button", { class: "btn", type: "button", "data-edit": "", text: "Adicionar material aqui", onclick: () => openForm(null, areaId) }) : null;
function groupOf(list, from) {
  // Com uma matéria escolhida, divide por assunto (numa aba de assunto, um grupo só); senão, por matéria.
  const own = S.subject ? ctx.own : [];
  const tabLabel = S.tab && S.tab !== CASES ? ctx.bySlug.get(S.tab)?.name || "" : "";
  const by = new Map();
  for (const m of list) {
    const key = S.subject ? (tabLabel || firstTopicName(m, ctx)) : (m.areaId && areaById(m.areaId) ? m.areaId : "");
    if (!by.has(key)) by.set(key, []); by.get(key).push(m);
  }
  const keys = [...by.keys()];
  const rank = new Map(own.map((t, i) => [t.name, i]));
  if (S.subject) keys.sort((a, b) => (!a) - (!b) || (rank.get(a) ?? 1e6) - (rank.get(b) ?? 1e6) || byKey(a, b));
  else { const order = new Map(); let i = 0; const walk = pid => childrenOf(pid).forEach(a => { order.set(a.id, i++); walk(a.id); }); walk(""); keys.sort((a, b) => (order.get(a) ?? 1e6) - (order.get(b) ?? 1e6)); }
  const areaName = k => k ? (areaLabel(k, from) || areaById(k).name) : "Sem área definida";
  return keys.map(k => ({ key: k, label: S.subject ? (k || "Sem assunto") : areaName(k), items: by.get(k).sort(sorter()) }));
}
const skeleton = () => h("div", { class: "skel", "aria-hidden": "true" }, Array.from({ length: 3 }, () => h("div", { class: "skel-card" })));
function renderMaterials(base, mod) {
  const box = $("#materials"), line = $("#result-line");
  // Endereço com aba antes de os assuntos chegarem: espera, em vez de mostrar a matéria inteira e depois pular.
  if (S.tab && !topicsReady()) { line.textContent = ""; box.replaceChildren(skeleton()); return; }
  const list = filtered(base), toks = tokens(S.q), root = scopeRoot();
  line.textContent = anyFilter() ? (list.length ? `${plural(list.length, "material", "materiais")} de ${base.length}` : `Nada encontrado entre ${plural(base.length, "material", "materiais")}`) : "";
  if (!base.length) {
    const firstLive = moduleList().find(m => m.live);
    const scopeName = S.subject ? areaById(S.subject)?.name : S.unit ? areaById(S.unit)?.name : mod?.name;
    box.replaceChildren(emptyBlock(IN_PRODUCTION + ".", S.scope === "todos" ? "O acervo ainda não tem materiais. Quem edita cadastra o primeiro link pelo botão Adicionar."
      : `${scopeName || "Este módulo"} ainda não foi irrigado. Os materiais aparecem aqui quando forem publicados.`,
      h("div", { class: "acts" }, firstLive && firstLive.id !== S.scope ? h("a", { class: "btn", href: "#a-" + firstLive.id, text: `Ver ${firstLive.name}, que já tem material` }) : null, addButton(S.subject || root || ""))));
    return;
  }
  if (!list.length) {
    const emptyName = S.tab === CASES ? "Casos clínicos" : S.tab ? ctx.bySlug.get(S.tab)?.name : areaById(S.subject)?.name;
    box.replaceChildren(S.subject && !anyFilter()
      ? emptyBlock(IN_PRODUCTION + ".", `${emptyName || "Esta matéria"} ainda não tem material.`, h("div", { class: "acts" }, addButton(S.subject)))
      : emptyBlock("Nenhum material encontrado", "Nada combina com a busca e os filtros. A busca procura no título, matéria, assunto, tipo e etiquetas, não no texto dos arquivos.",
        h("button", { class: "btn", type: "button", text: "Limpar busca e filtros", onclick: clearFilters })));
    return;
  }
  const from = S.scope === "todos" ? "" : S.unit || S.scope;
  if (S.q.trim()) { box.replaceChildren(h("div", { class: "sheet-list" }, list.sort(sorter()).map(m => materialCard(m, { toks, from })))); return; }
  box.replaceChildren(...groupOf(list, from).map((g, i) => h("section", { class: "group", "aria-labelledby": "g-" + i },
    h("h2", { class: "group-h", id: "g-" + i }, h("span", { text: g.label }), h("span", { class: "num", text: String(g.items.length) })),
    h("div", { class: "sheet-list" }, g.items.map(m => materialCard(m, { toks, from, where: false }))))));
}

export function renderModule() {
  if (!ready()) {
    $("#module-title").textContent = S.dbState === "loading" ? "…" : "";
    $("#artery-name").textContent = ""; $("#module-summary").textContent = S.dbState === "loading" ? "Carregando o acervo…" : "";
    $("#units").replaceChildren(); $("#subjects").replaceChildren(); $("#active-filters").hidden = true;
    $("#topic-tabs").replaceChildren(); $("#topic-tabs").hidden = true;
    $("#materials").replaceChildren(S.dbState === "loading" ? skeleton() : "");
    return;
  }
  resolvePending();
  const mod = S.scope === "todos" ? null : moduleList().find(m => m.id === S.scope);
  if (S.scope !== "todos" && !mod) { S.scope = "todos"; S.unit = S.subject = ""; history.replaceState(null, "", "#todos"); }
  if (S.unit && !areaById(S.unit)) S.unit = "";
  if (S.subject && !areaById(S.subject)) S.subject = "";
  if (!S.subject && S.tab) { S.tab = ""; setHash(S.unit); }
  ctx = tabContext({ areaId: S.subject, topics: S.topics, links: S.links });
  renderHeader(mod); renderUnits(mod); syncOrgan(mod);
  const base = baseList();
  renderSubjects(base); renderTopics(base); renderFilters(); renderMaterials(base, mod);
}
/* Abas da matéria escolhida. Aba que não existe mais (ou slug antigo) é corrigida no endereço. */
function renderTopics(base) {
  const set = S.subject ? descIds(S.subject) : null;
  const tabs = set ? topicTabs(ctx, base.filter(m => set.has(m.areaId))) : [];
  if (S.tab && topicsReady() && !tabs.some(t => t.key === S.tab)) {
    S.tab = ctx.bySlug.get(S.tab)?.slug || "";
    setHash(S.subject || S.unit);
  }
  renderTopicTabs($("#topic-tabs"), tabs, S.tab);
}
function clearFilters() { S.q = ""; S.f = { ...EMPTY_FILTERS }; renderModule(); $("#lib-q").focus(); }
const setHash = id => history.replaceState(null, "", "#" + (id ? areaRoute(id, id === S.subject ? S.tab : "") : S.scope === "todos" ? "todos" : "a-" + S.scope));

/* ---------- transição a partir do coração ---------- */
let flight = null;
export function noteFlight(rect, id, label) { flight = { rect, id, label, at: performance.now() }; }
export function moduleEntered() {
  $$(".flight").forEach(n => { gsap.killTweensOf(n); n.remove(); });
  window.scrollTo(0, 0);
  const title = $("#module-title");
  title.focus({ preventScroll: true });
  if (S.scope && S.scope !== "todos") rememberModule(S.scope);
  const f = flight; flight = null;
  if (reducedMotion()) return;
  requestAnimationFrame(() => revealIn($("#materials"), ".group-h, .material"));
  gsap.killTweensOf(title); gsap.set(title, { clearProps: "opacity,transform" });
  enter(".module-meta, #units", { y: 10 });
  if (!f || f.id !== S.scope || performance.now() - f.at > 1500 || !f.rect.width) return;
  // O nome do módulo sai do rótulo tocado e pousa no numeral do cabeçalho.
  $$(".flight").forEach(n => { gsap.killTweensOf(n); n.remove(); });
  const to = title.getBoundingClientRect(), fly = h("span", { class: "flight", "aria-hidden": "true", text: f.label });
  Object.assign(fly.style, { left: to.left + "px", top: to.top + "px", fontSize: getComputedStyle(title).fontSize });
  document.body.append(fly);
  gsap.set(title, { opacity: 0 });
  gsap.fromTo(fly, { x: f.rect.left - to.left, y: f.rect.top - to.top, scale: Math.max(.18, f.rect.height / to.height) },
    { x: 0, y: 0, scale: 1, duration: motionTokens().reveal, ease: "power3.out", overwrite: true,
      onComplete: () => { fly.remove(); gsap.to(title, { opacity: 1, duration: motionTokens().exit, ease: motionTokens().easeRespond, clearProps: "opacity" }); } });
}

export function wireModule() {
  matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change", () => {
    gsap.killTweensOf(".module-meta, #units"); gsap.set(".module-meta, #units", { clearProps: "opacity,transform" });
    moduleLeft(); if (S.view === "modulo") renderModule();
  });
  onThemeChange(() => organ?.theme());
  // Passar por uma unidade que é parte do órgão acende a parte (prévia); sair volta ao que está escolhido.
  $("#units").addEventListener("pointerover", e => { const b = e.target.closest("[data-unit]"); if (!b || !organ) return; const k = unitParts(S.scope).get(b.dataset.unit); if (k) organ.setActive([k]); });
  $("#units").addEventListener("pointerleave", () => { if (organ) organ.setActive(organActive(S.scope)); });
  $("#units").addEventListener("click", e => {
    const b = e.target.closest("[data-unit]"); if (!b) return;
    S.unit = b.dataset.unit; S.subject = ""; S.tab = ""; setHash(S.unit); renderModule(); revealIn($("#materials"), ".group-h, .material");
    $(`#units [data-unit="${S.unit}"]`)?.focus({ preventScroll: true });
  });
  $("#subjects").addEventListener("click", e => {
    const b = e.target.closest("[data-subject]"); if (!b) return;
    S.subject = b.dataset.subject; S.tab = ""; setHash(S.subject || S.unit); renderModule(); revealIn($("#materials"), ".group-h, .material");
    $(`#subjects [data-subject="${S.subject}"]`)?.focus({ preventScroll: true });
  });
  $("#topic-tabs").addEventListener("click", e => {
    const b = e.target.closest("[data-tab]"); if (!b) return;
    S.tab = b.dataset.tab; setHash(S.subject || S.unit); renderModule(); revealIn($("#materials"), ".group-h, .material");
    $(`#topic-tabs [data-tab="${CSS.escape(S.tab)}"]`)?.focus({ preventScroll: true });
  });
  let qTimer;
  $("#lib-q").addEventListener("input", e => { clearTimeout(qTimer); qTimer = setTimeout(() => { S.q = e.target.value; renderModule(); }, 120); });
  $("#f-type").addEventListener("change", e => { S.f = { ...S.f, type: e.target.value }; renderModule(); });
  $("#f-status").addEventListener("change", e => { S.f = { ...S.f, status: e.target.value }; renderModule(); });
  $("#f-coll").addEventListener("change", e => { S.f = { ...S.f, coll: e.target.value }; renderModule(); });
  $("#f-sort").addEventListener("change", e => { S.sort = e.target.value; savePrefs(); renderModule(); });
  $("#f-fav").addEventListener("click", () => { S.f = { ...S.f, fav: !S.f.fav }; renderModule(); });
  $("#f-more").addEventListener("click", () => {
    const open = $(".filters").classList.toggle("open");
    $("#f-more").setAttribute("aria-expanded", String(open));
    if (open) $("#f-type").focus();
  });
  for (const [id, delta] of [["prev-module", -1], ["next-module", 1]]) $("#" + id).addEventListener("click", () => {
    const list = modules(), i = list.findIndex(m => m.id === S.scope); if (i < 0) return;
    location.hash = "a-" + list[(i + delta + list.length) % list.length].id;
  });
  // Setas: do campo de busca para a primeira folha e entre as folhas; Esc volta ao campo.
  $("#view-module").addEventListener("keydown", e => {
    if (!["ArrowDown", "ArrowUp", "Escape"].includes(e.key) || document.querySelector("dialog[open]")) return;
    const items = $$("#materials [data-mid]");
    if (e.target.id === "lib-q") { if (e.key === "ArrowDown" && items.length) { e.preventDefault(); items[0].focus(); } return; }
    const i = items.indexOf(e.target); if (i < 0) return;
    e.preventDefault();
    if (e.key === "Escape") { $("#lib-q").focus(); return; }
    const next = items[i + (e.key === "ArrowDown" ? 1 : -1)];
    if (next) next.focus(); else if (e.key === "ArrowUp") $("#lib-q").focus();
  });
}
