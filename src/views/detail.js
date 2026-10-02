/* Ficha do material: folha que sobe no celular, painel lateral no computador. */
import gsap from "gsap";
import { S, STATUS, find, collName, reducedMotion } from "../core/state.js";
import { $, $$, h, svg, ICON } from "../core/dom.js";
import { fmtDate } from "../core/text.js";
import { pathOf } from "../core/areas.js";
import { toggleFav, setStatus, removeMaterial, materialWrites, popping, pop } from "../core/actions.js";
import { openDlg, closeDlg } from "../ui/dialogs.js";
import { openLink, moduleToken } from "./cards.js";
import { openForm } from "./form.js";

let confirmRemove = false, lastId = null;
const dlg = () => $("#dlg-detail");

export function openDetail(id, origin = document.activeElement) {
  S.detailId = id; lastId = id; confirmRemove = false;
  renderDetail();
  openDlg(dlg(), origin);
  requestAnimationFrame(() => $("#d-title")?.focus({ preventScroll: true }));
}
export function detailFallbackFocus(d) {
  if (d.id !== "dlg-detail" || !lastId) return null;
  return $$(`[data-mid="${lastId}"]`).find(b => !b.closest("[hidden]")) || $("#module-title");
}

export function renderDetail() {
  const m = find(S.detailId);
  if (!m) { if (dlg().open) closeDlg(dlg()); return; }
  const focused = document.activeElement, body = $("#d-body");
  const keep = focused && body.contains(focused) ? (focused.id || (focused.name === "d-status" ? "status:" + focused.value : "")) : "";
  const scroll = body.scrollTop, metaOpen = !!$("#d-body .d-meta[open]");
  const p = pathOf(m.areaId), pending = materialWrites.has(m.id), cur = m.status || "nao-iniciado";
  dlg().setAttribute("style", `--c:var(${moduleToken(m.areaId)})`);
  $("#d-type").textContent = m.type || "Link";

  const fav = h("button", { class: "favorite big" + (popping(m.id) && m.favorite ? " pop" : ""), type: "button", id: "d-fav", "aria-pressed": String(!!m.favorite), "aria-disabled": String(pending),
    "aria-label": m.favorite ? "Remover dos favoritos" : "Favoritar", onclick: () => { if (!pending) toggleFav(m.id); },
    style: popping(m.id) ? `--pop-delay:-${Math.round(performance.now() - pop.at)}ms` : null }, svg(ICON.star));
  const status = h("fieldset", { class: "segments", "aria-busy": String(pending) }, h("legend", { class: "sr", text: "Situação de estudo" }),
    STATUS.map(([v, l]) => h("label", null, h("input", { type: "radio", name: "d-status", value: v, checked: v === cur, "aria-disabled": String(pending),
      onchange: () => { if (materialWrites.has(m.id)) renderDetail(); else setStatus(m.id, v); } }), h("span", { text: l }))));
  const colls = (m.collectionIds || []).map(collName).filter(Boolean);
  const rows = [["Período", m.period], ["Coleções", colls.join(", ")]].filter(r => r[1]);
  const meta = [["Origem", m.source], ["Incluído em", fmtDate(m.createdAt)], ["Aberto por aqui em", fmtDate(m.lastOpenedAt)], ["Link", m.url]].filter(r => r[1]);
  const dl = list => h("dl", { class: "dl" }, list.map(([k, v]) => h("div", null, h("dt", { text: k }), h("dd", { text: v }))));

  const parts = [
    h("p", { class: "breadcrumb", text: p.map(a => a.name).join(" › ") || "Sem área definida" }),
    h("h2", { id: "d-title", tabindex: "-1", text: m.title || "(sem título)" }),
    m.subject ? h("p", { class: "detail-subject", text: m.subject }) : null,
    h("div", { class: "detail-rule" }),
    h("div", { class: "reading-head" }, h("span", { text: "Sua leitura" }), fav),
    status,
    h("p", { class: "save-state", role: "status", text: pending ? "Salvando alteração…" : "" }),
    openLink(m, "primary open-original", "Abrir original"),
    h("p", { class: "link-note", text: "O Aorta guarda o link. O arquivo continua onde está (por exemplo, no Google Drive)." }),
    rows.length ? dl(rows) : null,
    (m.tags || []).length ? h("div", { class: "tags", role: "list", "aria-label": "Etiquetas" }, m.tags.map(t => h("span", { class: "tag", role: "listitem", text: t }))) : null,
    m.notes ? h("div", { class: "notes" }, h("p", { class: "mono", text: "Observações" }), h("p", { text: m.notes })) : null,
    meta.length ? h("details", { class: "d-meta", open: metaOpen }, h("summary", { text: "Origem e datas" }), dl(meta)) : null,
    h("div", { class: "d-edit" },
      h("button", { class: "btn", type: "button", "data-edit": "", id: "d-edit", text: "Editar", disabled: pending, onclick: () => { closeDlg(dlg(), true); openForm(m.id); } }),
      h("button", { class: "btn ghost", type: "button", "data-edit": "", id: "d-remove", text: "Remover do catálogo", disabled: pending, onclick: () => { confirmRemove = true; renderDetail(); requestAnimationFrame(() => $("#d-rm-yes")?.focus()); } })),
    confirmRemove ? h("div", { class: "confirm-inline", role: "alert" },
      h("p", { text: "Remover este material do catálogo? Só o link sai daqui. O arquivo original (por exemplo, no Google Drive) não é apagado nem alterado." }),
      h("div", { class: "acts" },
        h("button", { class: "btn danger", type: "button", id: "d-rm-yes", text: "Remover do catálogo", onclick: async () => { confirmRemove = false; if (await removeMaterial(m.id)) closeDlg(dlg()); } }),
        h("button", { class: "btn", type: "button", text: "Manter", onclick: () => { confirmRemove = false; renderDetail(); $("#d-remove")?.focus(); } }))) : null,
  ];
  body.replaceChildren(...parts.filter(Boolean));
  body.scrollTop = scroll;
  if (keep.startsWith("status:")) $$('input[name="d-status"]', body).find(i => i.value === keep.slice(7))?.focus({ preventScroll: true });
  else if (keep) $("#" + keep, body)?.focus({ preventScroll: true });
}

/* Arrastar a alça para baixo fecha a folha (celular). */
function wireDrag() {
  const handle = $("#drag-handle"); let drag = null;
  handle.addEventListener("pointerdown", e => { if (reducedMotion()) return; drag = { y: e.clientY }; gsap.killTweensOf(dlg()); handle.setPointerCapture(e.pointerId); });
  handle.addEventListener("pointermove", e => { if (drag) dlg().style.transform = `translateY(${Math.max(0, e.clientY - drag.y)}px)`; });
  const end = e => {
    if (!drag) return; const y = e.clientY - drag.y; drag = null;
    if (y > 90) closeDlg(dlg()); else gsap.to(dlg(), { y: 0, duration: .25, ease: "expo.out", clearProps: "transform" });
  };
  handle.addEventListener("pointerup", end);
  handle.addEventListener("pointercancel", () => { drag = null; dlg().style.removeProperty("transform"); });
}

export function wireDetail() {
  document.addEventListener("click", e => {
    const t = e.target.closest("[data-mid]"); if (t) { openDetail(t.dataset.mid, t); return; }
    const f = e.target.closest("[data-fav]"); if (f && f.getAttribute("aria-disabled") !== "true") toggleFav(f.dataset.fav);
  });
  dlg().addEventListener("close", () => { S.detailId = null; confirmRemove = false; });
  dlg().addEventListener("animationend", e => e.target.classList?.remove("pop"));
  wireDrag();
}
