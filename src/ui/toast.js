/* Avisos curtos; o de remoção traz "Desfazer" e dura mais. */
import { $, $$, h } from "../core/dom.js";
import { reducedMotion } from "../core/state.js";

export function toast(msg, opts = {}) {
  const box = $("#toasts");
  const t = h("div", { class: "toast" + (opts.error ? " error" : "") }, h("p", { text: msg }));
  let timer;
  if (opts.action) t.append(h("button", { type: "button", text: opts.action.label, onclick: () => { clearTimeout(timer); t.remove(); opts.action.run(); } }));
  box.append(t);
  const dismiss = () => {
    if (t.matches(":hover") || t.contains(document.activeElement)) { timer = setTimeout(dismiss, 1000); return; }
    t.classList.add("leaving");
    setTimeout(() => t.remove(), reducedMotion() ? 0 : 180);
  };
  timer = setTimeout(dismiss, opts.action ? 10000 : 4000);
  // Um aviso de gravação nunca elimina um Desfazer ainda disponível.
  const plain = $$(".toast", box).filter(el => !el.querySelector("button"));
  while (plain.length > 3) plain.shift().remove();
}
