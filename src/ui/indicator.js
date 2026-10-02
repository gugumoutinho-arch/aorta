/* Indicador que desliza até o item ativo (pílula das abas de acervo, sublinhado das unidades).
   Primeiro posicionamento sem animação; trocas com mola. Movimento reduzido: troca direta. */
import gsap from "gsap";
import { reducedMotion } from "../core/state.js";

export function slideIndicator(container, activeSelector, cls, { underline = false } = {}) {
  let ink = container.querySelector(":scope > ." + cls);
  if (!ink) { ink = document.createElement("span"); ink.className = cls; ink.setAttribute("aria-hidden", "true"); container.prepend(ink); }
  let placed = false;
  function move(animate = true) {
    if (ink.parentNode !== container) container.prepend(ink); // a lista pode ter sido redesenhada
    const el = container.querySelector(activeSelector);
    if (!el || !container.offsetWidth) { ink.style.opacity = "0"; return; }
    const c = container.getBoundingClientRect(), r = el.getBoundingClientRect();
    const to = { x: r.left - c.left + container.scrollLeft, y: underline ? r.bottom - c.top - 2 : r.top - c.top, width: r.width, height: underline ? 2 : r.height, opacity: 1 };
    if (!placed || !animate || reducedMotion()) { gsap.killTweensOf(ink); gsap.set(ink, to); placed = true; return; }
    gsap.to(ink, { ...to, duration: .55, ease: "elastic.out(1, .78)", overwrite: true });
  }
  new ResizeObserver(() => move(false)).observe(container);
  return move;
}
/* "Afundar" ao apertar: resposta tátil curta em qualquer controle principal. */
export function wirePress(root = document) {
  root.addEventListener("pointerdown", e => {
    const el = e.target.closest(".btn, .icon, .toggle, .search-plate, .acervo-tabs a, .units button, .subjects button, .segments label, .proto-switch a, .favorite");
    if (!el || reducedMotion()) return;
    gsap.fromTo(el, { scale: 1 }, { scale: .955, duration: .1, ease: "power2.out", overwrite: true,
      onComplete: () => gsap.to(el, { scale: 1, duration: .45, ease: "elastic.out(1, .5)", clearProps: "transform" }) });
  });
}
