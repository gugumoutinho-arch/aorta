/* Ficha fixa (direção D): a partir de 1200 px, na página do módulo, a ficha vira um painel à direita da lista, dentro da
   grade da página (diálogo NÃO modal): não cobre a lista, não troca de tela e a lista continua navegável por teclado.
   Trocar de material troca só o conteúdo do painel (swap curto). Esc no painel fecha e devolve o foco à linha.
   Abaixo de 1200 px (ou fora do módulo), a ficha continua a folha/painel modal de sempre (detail.js). */
import { S } from "../core/state.js";
import { $, $$ } from "../core/dom.js";
import { swap, enter } from "../ui/choreo.js";

const wide = matchMedia("(min-width: 1200px)");
const dlg = () => $("#dlg-detail");
export const canDock = () => wide.matches && S.view === "modulo";
export const isDocked = () => dlg().open && dlg().classList.contains("docked");

/* Marca a linha aberta (forma + cor; ver list.css) e tira a marca das outras. */
export function markRow(id) {
  $$("#materials .material").forEach(r => { if (id && r.dataset.row === id) r.setAttribute("aria-current", "true"); else r.removeAttribute("aria-current"); });
}
export function dockOpen(render, id) {
  const d = dlg(), body = $(".module-body");
  if (!d.open && d.parentElement !== body) body.append(d); // só fechado o diálogo pode mudar de lugar
  d.classList.add("docked"); d.classList.remove("sheet-modal"); body.classList.add("has-panel");
  if (d.open) swap($("#d-body"), render);
  else { render(); d.show(); enter(d, { x: 24, y: 0, stagger: false }); }
  markRow(id);
}
/* Volta a ser a folha modal: fecha se estiver aberta e devolve o elemento ao fim do <body>. */
export function undock() {
  const d = dlg();
  if (d.open && d.classList.contains("docked")) d.close();
  d.classList.remove("docked"); $(".module-body")?.classList.remove("has-panel"); markRow(null);
  if (d.parentElement !== document.body) document.body.append(d);
}
export function wireDock() {
  const d = dlg();
  d.addEventListener("close", () => { if (d.classList.contains("docked")) { $(".module-body")?.classList.remove("has-panel"); markRow(null); } });
  // Diálogo não modal não recebe "cancel" pelo Esc: o painel trata o Esc e devolve o foco à linha de onde veio.
  d.addEventListener("keydown", e => {
    if (e.key !== "Escape" || !isDocked()) return;
    e.preventDefault(); const id = S.detailId; d.close();
    $(`#materials [data-mid="${CSS.escape(id || "")}"]`)?.focus({ preventScroll: true });
  });
  // Ficou estreito (girou o tablet, encolheu a janela) ou saiu do módulo: o painel fixo some sem deixar nada preso.
  wide.addEventListener("change", () => { if (!wide.matches) undock(); });
}
