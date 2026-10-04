/* Diálogos nativos (<dialog>): foco preso pelo navegador, Esc fecha, foco volta para quem abriu.
   Entrada e saída com GSAP; com movimento reduzido ou teclado, troca direta. */
import gsap from "gsap";
import { $$ } from "../core/dom.js";
import { reducedMotion } from "../core/state.js";
import { motionTokens } from "./tokens.js";

let keyboardInput = false;
document.addEventListener("keydown", () => { keyboardInput = true; document.documentElement.dataset.input = "keyboard"; }, true);
document.addEventListener("pointerdown", () => { keyboardInput = false; delete document.documentElement.dataset.input; }, true);

const origins = new WeakMap();
const closing = new WeakSet();
const isSheet = d => d.classList.contains("sheet");
const mobile = () => matchMedia("(max-width: 760px)").matches;
const offset = d => isSheet(d) ? (mobile() ? { y: 48, x: 0 } : { x: 40, y: 0 }) : { y: 14, x: 0 };
const still = () => keyboardInput || reducedMotion();

export function openDlg(d, origin = document.activeElement) {
  gsap.killTweensOf(d);
  closing.delete(d);
  d.style.removeProperty("transform"); d.style.removeProperty("opacity");
  if (!d.open) { origins.set(d, origin); d.showModal(); }
  if (still()) return;
  const o = offset(d);
  const t = motionTokens();
  // Fora do celular, nasce de onde foi chamado: a escala (.96 → 1) parte do ponto do acionador (linha da lista, lupa,
  // placa de busca), com um deslocamento curto na mesma direção. No celular, a folha sobe da borda de baixo.
  const from = origin?.isConnected && !mobile() ? origin.getBoundingClientRect() : null;
  if (from && from.width) {
    const r = d.getBoundingClientRect(), ox = Math.min(Math.max(from.left + from.width / 2 - r.left, 0), r.width), oy = Math.min(Math.max(from.top + from.height / 2 - r.top, 0), r.height);
    gsap.fromTo(d, { x: o.x / 2, y: o.y / 2, scale: .96, opacity: 0, transformOrigin: `${ox}px ${oy}px` },
      { x: 0, y: 0, scale: 1, opacity: 1, duration: t.swap, ease: t.easeEnter, overwrite: true, clearProps: "transform,opacity,transformOrigin" });
    return;
  }
  gsap.fromTo(d, { x: o.x, y: o.y, opacity: 0 }, { x: 0, y: 0, opacity: 1, duration: t.swap, ease: t.easeEnter, overwrite: true, clearProps: "transform,opacity" });
}
export function closeDlg(d, immediate = false) {
  if (!d.open || closing.has(d)) return;
  gsap.killTweensOf(d);
  if (immediate || still()) { d.close(); return; }
  closing.add(d);
  const o = offset(d);
  const t = motionTokens();
  // Saída mais curta que a entrada e desacelerando (nada de ease-in na interface).
  gsap.to(d, { x: o.x, y: o.y, opacity: 0, duration: t.exit, ease: t.easeRespond, overwrite: true,
    onComplete: () => { closing.delete(d); d.close(); d.style.removeProperty("transform"); d.style.removeProperty("opacity"); } });
}
/* Quem abriu recebe o foco de volta; se foi redesenhado, quem cuida do diálogo indica um substituto. */
export function wireDialogs(fallbackFocus = () => null) {
  $$("dialog").forEach(d => {
    d.addEventListener("close", () => {
      const origin = origins.get(d);
      const back = origin && document.contains(origin) && !origin.closest("[hidden]") ? origin : fallbackFocus(d);
      if (back && !document.querySelector("dialog[open]")) back.focus({ preventScroll: true });
    });
    d.addEventListener("click", e => { if (e.target === d || e.target.closest("[data-close]")) closeDlg(d); });
    d.addEventListener("cancel", e => { e.preventDefault(); closeDlg(d, true); });
  });
}
