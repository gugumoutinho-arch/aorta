import { motionTokens } from "./tokens.js";
/* Movimento com continuidade: a resposta segue o gesto, entradas não disputam o layout. */
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { reducedMotion } from "../core/state.js";
import { spring } from "./spring.js";
gsap.registerPlugin(SplitText);
const splits = new Map(), counters = new Map(), pending = new Set(), entering = new Set(), revealed = new WeakSet();
/* Título por linhas. O tween é cancelado pela referência: cancelar pelos alvos (killTweensOf) às vezes deixava o tween
   vivo em trocas rápidas de acervo, e o onComplete dele apagava o registro do split ATUAL; o split órfão guardava o
   título do outro acervo e o devolvia na troca seguinte (tools/acervos.mjs, "Trocas rápidas…"). */
export function cancelHeadline(el) {
  const cur = splits.get(el);
  if (cur) { cur.tween.kill(); cur.split.revert(); splits.delete(el); }
}
export function revealHeadline(el, delay = 0) {
  if (!el) return;
  cancelHeadline(el);
  if (reducedMotion()) return;
  const split = SplitText.create(el, { type: "lines", mask: "lines", linesClass: "line", aria: "auto" });
  const tween = gsap.fromTo(split.lines, { yPercent: 85 }, { yPercent: 0, duration: motionTokens().enter, ease: "power3.out", stagger: .065, delay,
    onComplete: () => { split.revert(); if (splits.get(el)?.split === split) splits.delete(el); } });
  splits.set(el, { split, tween });
}
export function countTo(el, value) {
  if (!el) return;
  const old = counters.get(el);
  if (old?.target === value) return;
  old?.tween.kill();
  const state = { v: Number(el.textContent) || 0 };
  if (reducedMotion() || state.v === value) { el.textContent = String(value); counters.delete(el); return; }
  const tween = gsap.to(state, { v: value, duration: motionTokens().reveal, ease: "power2.out",
    onUpdate: () => { el.textContent = String(Math.round(state.v)); }, onComplete: () => counters.delete(el) });
  counters.set(el, { tween, target: value });
}
const io = new IntersectionObserver(entries => {
  const shown = entries.filter(e => e.isIntersecting).map(e => e.target);
  shown.forEach(el => { io.unobserve(el); pending.delete(el); entering.add(el); });
  if (shown.length) gsap.to(shown, { opacity: 1, y: 0, duration: motionTokens().reveal, ease: "power2.out", stagger: .035, overwrite: "auto", onComplete: () => shown.forEach(el => { entering.delete(el); gsap.set(el, { clearProps: el.matches(":hover") ? "opacity" : "opacity,transform" }); }) });
}, { rootMargin: "0px 0px -3% 0px" });
export function revealIn(root, selector) {
  if (!root || reducedMotion()) return;
  for (const el of pending) if (!el.isConnected) { io.unobserve(el); pending.delete(el); }
  const items = [...root.querySelectorAll(selector)].filter(el => !revealed.has(el) && !el.closest("[hidden]"));
  gsap.set(items, { opacity: 0, y: 12 });
  items.forEach(el => { revealed.add(el); pending.add(el); io.observe(el); });
}
export function wireMotion() {
  gsap.matchMedia().add("(prefers-reduced-motion: no-preference) and (hover: hover) and (pointer: fine)", () => {
    const abort = new AbortController(), listen = (el, type, fn) => el.addEventListener(type, fn, { signal: abort.signal, passive: true });
    let label = null, card = null;
    const offset = { x: 0, y: 0 }, tilt = { x: 0, y: 0 };
    const magnet = spring(offset, () => { if (label) gsap.set(label.children, { x: offset.x, y: offset.y }); });
    const lean = spring(tilt, () => { if (card) gsap.set(card, { rotateX: tilt.x, rotateY: tilt.y, transformPerspective: 1100 }); });
    const releaseLabel = (instant = false) => { if (label) gsap.to(label.children, { x: 0, y: 0, duration: instant ? 0 : motionTokens().release, ease: "power2.out", overwrite: "auto", clearProps: "x,y" }); label = null; magnet.settle({ x: 0, y: 0 }); };
    const releaseCard = (instant = false) => { if (card) { gsap.to(card, { rotateX: 0, rotateY: 0, duration: instant ? 0 : motionTokens().release, ease: "power2.out", overwrite: "auto", clearProps: "rotateX,rotateY,transformPerspective" }); card.style.removeProperty("--mx"); card.style.removeProperty("--my"); } card = null; lean.settle({ x: 0, y: 0 }); };
    const ring = document.createElement("div"); ring.className = "cursor-ring"; ring.setAttribute("aria-hidden", "true");
    const tag = document.createElement("span"); ring.append(tag); document.body.append(ring);
    const cursor = { x: 0, y: 0 }, follow = spring(cursor, () => gsap.set(ring, cursor), { stiffness: 520, damping: 43 });
    let seen = false, mode = "";
    listen(document, "pointermove", e => {
      const nextLabel = e.target.closest?.("#modules .mod");
      if (label !== nextLabel) { releaseLabel(); if (nextLabel) gsap.killTweensOf(nextLabel.children, "x,y"); }
      label = nextLabel;
      if (label) { const r = label.getBoundingClientRect(); magnet.to({ x: (e.clientX - r.left - r.width / 2) / r.width * 5, y: (e.clientY - r.top - r.height / 2) / r.height * 4 }); }
      const nextCard = e.target.closest?.(".mini-card, .book");
      if (card !== nextCard) { releaseCard(); if (nextCard) gsap.killTweensOf(nextCard, "rotateX,rotateY,transformPerspective"); }
      card = nextCard;
      if (card) {
        const r = card.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        card.style.setProperty("--mx", x * 100 + "%"); card.style.setProperty("--my", y * 100 + "%");
        lean.to({ x: (.5 - y) * 2.5, y: (x - .5) * 3 });
      }
      if (!seen) { follow.settle({ x: e.clientX, y: e.clientY }); seen = true; }
      follow.to({ x: e.clientX, y: e.clientY }); ring.classList.add("on");
      const hit = e.target.closest?.("#modules .mod, a, button, input, select, label");
      const next = !hit ? "" : hit.matches("#modules .mod") ? "open" : hit.matches("input, select") ? "text" : "link";
      if (next !== mode) { mode = next; ring.dataset.mode = next; tag.textContent = next === "open" ? "abrir" : ""; }
    });
    const leave = () => { ring.classList.remove("on"); seen = false; magnet.to({ x: 0, y: 0 }); lean.to({ x: 0, y: 0 }); };
    listen(document.documentElement, "pointerleave", leave);
    listen(window, "blur", leave);
    return () => { abort.abort(); releaseLabel(true); releaseCard(true); magnet.dispose(); lean.dispose(); follow.dispose(); ring.remove(); };
  });
  matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change", e => {
    if (!e.matches) return;
    for (const el of splits.keys()) cancelHeadline(el);
    for (const [el, c] of counters) { c.tween.kill(); el.textContent = String(c.target); } counters.clear();
    io.disconnect();
    const all = [...pending, ...entering];
    gsap.killTweensOf(all); gsap.set(all, { clearProps: "opacity,transform" }); pending.clear(); entering.clear();
  });
}
