/* Abas de assunto dentro da matéria (Todos · assuntos · Casos clínicos). Rolam na horizontal no celular;
   a pílula desliza até a ativa, que é trazida à vista sem mexer na rolagem da página. */
import { h } from "../core/dom.js";
import { IN_PRODUCTION } from "../core/state.js";
import { slideIndicator } from "../ui/indicator.js";

const EDGE = 16;
let ink = null;

function keepInView(box, el) {
  if (!el) return;
  const left = el.offsetLeft - EDGE, right = el.offsetLeft + el.offsetWidth + EDGE - box.clientWidth;
  if (box.scrollLeft > left) box.scrollLeft = left;
  else if (box.scrollLeft < right) box.scrollLeft = right;
}

export function renderTopicTabs(box, tabs, active) {
  box.hidden = !tabs.length;
  if (!tabs.length) { box.replaceChildren(); return; }
  box.replaceChildren(...tabs.map(t => h("button", { type: "button", "data-tab": t.key, "aria-pressed": String(t.key === active) },
    h("span", { text: t.label }),
    h("span", { class: "num", text: t.count ? String(t.count) : "—" }),
    t.count ? null : h("span", { class: "sr", text: IN_PRODUCTION }))));
  queueMicrotask(() => {
    ink ||= slideIndicator(box, '[aria-pressed="true"]', "tab-pill");
    ink();
    keepInView(box, box.querySelector('[aria-pressed="true"]'));
  });
}
