/* Avisos curtos; o de remoção traz "Desfazer" e dura mais. O tempo pausa com cursor, dedo ou foco no aviso. */
import { $, $$, h } from "../core/dom.js";
import { reducedMotion } from "../core/state.js";
import { pausableTimer } from "./timer.js";

export function toast(msg, opts = {}) {
  const box = $("#toasts");
  const t = h("div", { class: "toast" + (opts.error ? " error" : "") }, h("p", { text: msg }));
  const leave = () => {
    t.classList.add("leaving");
    setTimeout(() => { t.remove(); syncSpace(); }, reducedMotion() ? 0 : 180);
  };
  const timer = pausableTimer(opts.action ? 10000 : 4000, leave);
  if (opts.action) t.append(h("button", { type: "button", text: opts.action.label, onclick: () => { timer.cancel(); t.remove(); syncSpace(); opts.action.run(); } }));
  // Pausa enquanto alguém está lendo ou prestes a tocar; retoma ao sair (sem contar o tempo parado).
  t.addEventListener("pointerenter", timer.pause);
  t.addEventListener("pointerleave", () => { if (!t.contains(document.activeElement)) timer.resume(); });
  t.addEventListener("focusin", timer.pause);
  t.addEventListener("focusout", e => { if (!t.contains(e.relatedTarget) && !t.matches(":hover")) timer.resume(); });
  box.append(t);
  syncSpace();
  // Um aviso de gravação nunca elimina um Desfazer ainda disponível.
  const plain = $$(".toast", box).filter(el => !el.querySelector("button"));
  while (plain.length > 3) plain.shift().remove();
}

/* Com aviso na tela, a página ganha espaço embaixo para o aviso não cobrir o fim da lista. */
function syncSpace() { document.body.classList.toggle("has-toast", !!$("#toasts .toast")); }
