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
    if (!placed || !animate || reducedMotion()) { gsap.killTweensOf(ink); gsap.set(ink, { ...to, scaleX: 1, scaleY: 1 }); placed = true; return; }
    const before = ink.getBoundingClientRect();
    gsap.set(ink, { width: to.width, height: to.height, scaleX: before.width / (to.width || 1), scaleY: before.height / (to.height || 1), transformOrigin: "0 0" });
    gsap.to(ink, { x: to.x, y: to.y, scaleX: 1, scaleY: 1, opacity: 1, duration: .32, ease: "power3.out", overwrite: true });
  }
  new ResizeObserver(() => move(false)).observe(container);
  matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change", () => move(false));
  return move;
}
/* "Afundar" ao apertar: resposta tátil curta em qualquer controle principal. */
export function wirePress(root = document) {
  let pressed = null;
  const release = () => {
    if (!pressed) return;
    gsap.to(pressed, { scale: 1, duration: reducedMotion() ? 0 : .24, ease: "power2.out", overwrite: "auto", clearProps: "transform" });
    pressed = null;
  };
  root.addEventListener("pointerdown", e => {
    if (e.button !== 0) return;
    const el = e.target.closest(".btn, .icon, .toggle, .search-plate, .acervo-tabs a, .units button, .subjects button, .segments label, .proto-switch a, .favorite");
    if (!el || reducedMotion()) return;
    release(); pressed = el;
    gsap.to(el, { scale: .975, duration: .1, ease: "power2.out", overwrite: "auto" });
  });
  root.addEventListener("pointerup", release);
  root.addEventListener("pointercancel", release);
  window.addEventListener("blur", release);
  matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change", release);
}
