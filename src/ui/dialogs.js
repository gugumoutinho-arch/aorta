/* Diálogos nativos (<dialog>): foco preso pelo navegador, Esc fecha, foco volta para quem abriu.
   Entrada e saída com GSAP; com movimento reduzido ou teclado, troca direta. */
import gsap from "gsap";
import { $$ } from "../core/dom.js";
import { reducedMotion } from "../core/state.js";

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
  gsap.fromTo(d, { x: o.x, y: o.y, opacity: 0 }, { x: 0, y: 0, opacity: 1, duration: .32, ease: "expo.out", overwrite: true, clearProps: "transform,opacity" });
}
export function closeDlg(d, immediate = false) {
  if (!d.open || closing.has(d)) return;
  gsap.killTweensOf(d);
  if (immediate || still()) { d.close(); return; }
  closing.add(d);
  const o = offset(d);
  gsap.to(d, { x: o.x, y: o.y, opacity: 0, duration: .18, ease: "power2.in", overwrite: true,
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
