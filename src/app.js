/* Orquestra: rotas, desenho das telas e assinatura do banco. */
import { S, ready } from "./core/state.js";
import { $, $$ } from "./core/dom.js";
import { cmpName } from "./core/text.js";
import { materialWrites } from "./core/actions.js";
import { renderBanner } from "./views/banner.js";
import { renderHome, homeLeft, homeReturned } from "./views/home.js";
import { renderModule, moduleEntered } from "./views/module.js";
import { renderOrg } from "./views/organize.js";
import { renderDetail } from "./views/detail.js";
import { renderDatalists } from "./views/form.js";

export function renderNav() {
  document.body.dataset.view = S.view;
  $$(".view[data-view]").forEach(s => { s.hidden = s.dataset.view !== S.view; });
  $$("[data-nav]").forEach(a => {
    const on = a.dataset.nav === S.view || (a.dataset.nav === "todos" && S.view === "modulo" && S.scope === "todos");
    on ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current");
  });
  $$("[data-action='add']").forEach(b => { b.disabled = !ready(); });
}
/* Redesenhar troca os elementos; quem estava com o foco (teclado, leitor de tela) volta para o equivalente novo. */
const FOCUS_KEYS = ["fav", "mid", "module", "unit", "subject"];
function focusKey() {
  const el = document.activeElement; if (!el || el === document.body) return null;
  for (const k of FOCUS_KEYS) if (el.dataset?.[k] !== undefined) return `[data-${k}="${CSS.escape(el.dataset[k])}"]`;
  return null;
}
export function renderAll() {
  const key = focusKey();
  renderBanner(); renderNav();
  if (S.view === "inicio") renderHome();
  else if (S.view === "modulo") renderModule();
  else renderOrg();
  renderDatalists();
  if ($("#dlg-detail").open) renderDetail();
  if (key && (!document.activeElement || document.activeElement === document.body)) $$(key).find(e => !e.closest("[hidden],dialog:not([open])"))?.focus({ preventScroll: true });
}

/* Rotas: #inicio (coração), #todos (todos os materiais), #a-<área> (módulo; unidade e matéria já escolhidas
   quando a área é mais funda), #organizar. As rotas #a- antigas continuam valendo. */
export function route(focus) {
  let hs = "";
  try { hs = decodeURIComponent(location.hash.slice(1)); } catch (_) { /* endereço colado pela metade: vai para o início */ }
  const was = S.view;
  if (hs === "organizar") S.view = "organizar";
  else if (hs === "todos") { S.view = "modulo"; S.pendingArea = "todos"; }
  else if (hs.startsWith("a-")) { S.view = "modulo"; S.pendingArea = hs.slice(2); }
  else S.view = "inicio";
  if (was === "inicio" && S.view !== "inicio") homeLeft();
  renderAll();
  if (!focus) return;
  if (S.view === "modulo") moduleEntered();
  else if (S.view === "inicio" && was !== "inicio") homeReturned();
  else { window.scrollTo(0, 0); $("#main").focus({ preventScroll: true }); }
}

export function subscribe() {
  const onErr = e => { console.error(e); S.dbState = "unavailable"; renderAll(); };
  const map = snap => snap.docs.map(d => ({ id: d.id, ...d.data() }));
  S.db.collection("materials").onSnapshot(s => {
    S.materials = map(s).map(m => ({ ...m, ...(materialWrites.get(m.id)?.patch || {}) }));
    S.got.m = true; renderAll();
  }, onErr);
  S.db.collection("areas").onSnapshot(s => { S.areas = map(s); S.got.a = true; renderAll(); }, onErr);
  S.db.collection("collections").onSnapshot(s => { S.collections = map(s).sort((a, b) => cmpName(a.name, b.name)); S.got.c = true; renderAll(); }, onErr);
}
