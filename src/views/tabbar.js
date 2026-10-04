/* Barra inferior do celular (direção D): Início, Mapa (o índice do curso), Favoritos e Buscar. O item ativo tem forma
   (traço acima do ícone) além da cor, e aria-current="page". Buscar abre a busca rápida (não é um lugar). */
import { S, reducedMotion } from "../core/state.js";
import { $, $$ } from "../core/dom.js";
import { goIndex, showAll } from "./home.js";

let indexInView = false;
export function syncTabbar() {
  const current = S.view === "inicio" ? (indexInView ? "mapa" : "inicio")
    : S.view === "modulo" && S.scope === "todos" && S.f.fav ? "favoritos" : "";
  $$("#tabbar [data-tab-nav]").forEach(a => a.dataset.tabNav === current ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current"));
}
export function wireTabbar() {
  const bar = $("#tabbar");
  bar.querySelector('[data-tab-nav="mapa"]').addEventListener("click", e => { e.preventDefault(); goIndex(); });
  bar.querySelector('[data-tab-nav="favoritos"]').addEventListener("click", e => { e.preventDefault(); showAll({ fav: true }); });
  // "Início" leva sempre ao topo do início (o palco), mesmo vindo de outra tela com a rolagem guardada no índice.
  const top = () => { window.scrollTo({ top: 0, behavior: reducedMotion() ? "auto" : "smooth" }); $("#main").focus({ preventScroll: true }); };
  bar.querySelector('[data-tab-nav="inicio"]').addEventListener("click", e => {
    e.preventDefault();
    if (S.view === "inicio") { top(); return; }
    addEventListener("hashchange", () => requestAnimationFrame(() => requestAnimationFrame(top)), { once: true });
    location.hash = "inicio";
  });
  // "Mapa" fica ativo enquanto o índice ocupa a tela; "Início", enquanto o palco está à vista.
  new IntersectionObserver(es => { indexInView = es[0].isIntersecting; syncTabbar(); }, { rootMargin: "-45% 0px -45% 0px" }).observe($("#indice"));
}
