/* Camada de movimento (protótipo v4). Tudo explica algo: o título entra por linhas, os números contam até o valor real,
   o conteúdo aparece em cascata quando entra na tela, rótulos e cartões respondem ao ponteiro, e um anel acompanha o
   cursor e cresce sobre o que é clicável. Movimento reduzido ou toque: nada disso roda. */
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { reducedMotion } from "../core/state.js";

gsap.registerPlugin(SplitText);
const fine = () => matchMedia("(hover: hover) and (pointer: fine)").matches;
const still = () => reducedMotion();

/* Título: linhas sobem de dentro de uma máscara (o leitor de tela lê o texto inteiro, sem os pedaços). */
let splits = new WeakMap();
export function revealHeadline(el, delay = 0) {
  if (!el || still()) return;
  splits.get(el)?.revert();
  const split = SplitText.create(el, { type: "lines", mask: "lines", linesClass: "line", aria: "auto" });
  splits.set(el, split);
  gsap.fromTo(split.lines, { yPercent: 105, rotate: 2 }, { yPercent: 0, rotate: 0, duration: 1.15, ease: "expo.out", stagger: .09, delay,
    onComplete: () => { split.revert(); splits.delete(el); } });
}

/* Números: contam do anterior (ou zero) até o valor, em tabulares. */
const last = new WeakMap();
export function countTo(el, value) {
  if (!el) return;
  const from = last.get(el) ?? 0; last.set(el, value);
  if (still() || from === value) { el.textContent = String(value); return; }
  const o = { v: from };
  gsap.to(o, { v: value, duration: .9, ease: "power3.out", overwrite: true, onUpdate: () => { el.textContent = String(Math.round(o.v)); } });
}

/* Cascata ao entrar na tela: só nos elementos presentes quando a tela é aberta (redesenhos depois não piscam). */
const io = typeof IntersectionObserver !== "undefined" ? new IntersectionObserver(entries => {
  const shown = entries.filter(e => e.isIntersecting).map(e => e.target);
  shown.forEach(t => io.unobserve(t));
  if (shown.length) gsap.to(shown, { opacity: 1, y: 0, duration: .8, ease: "expo.out", stagger: .06, overwrite: true, clearProps: "opacity,transform" });
}, { rootMargin: "0px 0px -8% 0px" }) : null;
export function revealIn(root, selector) {
  if (!root || !io || still()) return;
  const items = [...root.querySelectorAll(selector)].filter(el => !el.closest("[hidden]"));
  gsap.set(items, { opacity: 0, y: 26 });
  items.forEach(el => io.observe(el));
}

/* Rótulos magnéticos e cartões que inclinam, por delegação (sobrevivem aos redesenhos). */
function wireMagnetic() {
  let current = null;
  document.addEventListener("pointermove", e => {
    if (!fine() || still()) return;
    const label = e.target.closest?.("#modules .mod");
    if (current && current !== label) { gsap.to(current.children, { x: 0, y: 0, duration: .6, ease: "elastic.out(1, .45)", overwrite: true }); current = null; }
    if (!label) return;
    current = label;
    const r = label.getBoundingClientRect(), dx = (e.clientX - (r.left + r.width / 2)) / r.width, dy = (e.clientY - (r.top + r.height / 2)) / r.height;
    gsap.to(label.children, { x: dx * 10, y: dy * 6, duration: .35, ease: "power3.out", overwrite: true, stagger: .02 });
  }, { passive: true });
}
const TILT = ".mini-card, .book, .material, .resume";
function wireTilt() {
  let card = null;
  const release = () => { if (!card) return; gsap.to(card, { rotateX: 0, rotateY: 0, duration: .7, ease: "elastic.out(1, .55)", overwrite: "auto" }); card.style.removeProperty("--mx"); card = null; };
  document.addEventListener("pointermove", e => {
    if (!fine() || still()) return;
    const el = e.target.closest?.(TILT);
    if (el !== card) release();
    if (!el) return;
    card = el;
    const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    el.style.setProperty("--mx", (x * 100).toFixed(1) + "%"); el.style.setProperty("--my", (y * 100).toFixed(1) + "%");
    gsap.to(el, { rotateY: (x - .5) * 5, rotateX: (.5 - y) * 4, transformPerspective: 900, duration: .4, ease: "power2.out", overwrite: "auto" });
  }, { passive: true });
  document.addEventListener("pointerleave", release);
}

/* Anel que segue o cursor (o cursor do sistema continua lá): cresce sobre links e botões e diz "abrir" nos módulos. */
function wireCursor() {
  if (!fine() || still()) return;
  const ring = document.createElement("div"); ring.className = "cursor-ring"; ring.setAttribute("aria-hidden", "true");
  const tag = document.createElement("span"); ring.append(tag); document.body.append(ring);
  const x = gsap.quickTo(ring, "x", { duration: .45, ease: "power3.out" }), y = gsap.quickTo(ring, "y", { duration: .45, ease: "power3.out" });
  let mode = "";
  document.addEventListener("pointermove", e => {
    x(e.clientX); y(e.clientY); ring.classList.add("on");
    const hit = e.target.closest?.("#modules .mod, a, button, [role=option], label, summary, input, select");
    const next = !hit ? "" : hit.matches("#modules .mod") ? "open" : hit.matches("input, select") ? "text" : "link";
    if (next === mode) return; mode = next;
    ring.dataset.mode = mode; tag.textContent = mode === "open" ? "abrir" : "";
  }, { passive: true });
  document.addEventListener("pointerdown", () => gsap.fromTo(ring, { scale: .8 }, { scale: 1, duration: .5, ease: "elastic.out(1, .5)" }));
  document.documentElement.addEventListener("pointerleave", () => ring.classList.remove("on"));
}

export function wireMotion() { wireMagnetic(); wireTilt(); wireCursor(); }
