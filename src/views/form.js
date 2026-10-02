/* Cadastro e edição de um link de material (só para quem edita). */
import { S, TYPES, STATUS, ready, find } from "../core/state.js";
import { $, $$, h } from "../core/dom.js";
import { cmpName, validUrl, isDrive, nowIso } from "../core/text.js";
import { pathOf, treeOrder } from "../core/areas.js";
import { write, ensureCollection } from "../core/actions.js";
import { openDlg, closeDlg } from "../ui/dialogs.js";

const BAD_URL = "Este link não parece válido. Ele precisa começar com https:// e ter um endereço completo.";
function fillSelect(sel, options, value) {
  sel.replaceChildren(...options.map(([v, l]) => h("option", { value: v, text: l })));
  sel.value = options.some(o => o[0] === value) ? value : options[0][0];
}
function fieldErr(k, msg) {
  const i = $("#m-" + k), e = $("#m-" + k + "-err");
  if (msg) { e.textContent = msg; e.hidden = false; i.setAttribute("aria-invalid", "true"); } else { e.hidden = true; i.removeAttribute("aria-invalid"); }
  return !msg;
}

export function openForm(id, areaId) {
  if (!ready()) return;
  S.editId = id; const m = id ? find(id) : null;
  $("#form-title").textContent = m ? "Editar material" : "Adicionar material";
  $("#m-save").textContent = m ? "Salvar alterações" : "Salvar material";
  $("#m-title").value = m?.title || ""; $("#m-url").value = m?.url || "";
  const here = S.view === "modulo" ? (S.subject || S.unit || (S.scope !== "todos" ? S.scope : "")) : "";
  fillSelect($("#m-area"), [["", "Sem área"], ...treeOrder().map(([a]) => [a.id, pathOf(a.id).map(x => x.name).join(" › ")])], m ? m.areaId || "" : (areaId ?? here));
  fillSelect($("#m-type"), [["", "Sem tipo"], ...TYPES.map(t => [t, t])], m?.type || "");
  fillSelect($("#m-status"), STATUS, m?.status || "nao-iniciado");
  $("#m-subject").value = m?.subject || ""; $("#m-period").value = m?.period || "";
  $("#m-tags").value = m ? (m.tags || []).join(", ") : ""; $("#m-origin").value = m?.source || ""; $("#m-notes").value = m?.notes || "";
  $("#m-fav").checked = !!m?.favorite; $("#m-coll-new").value = "";
  const sel = new Set(m ? m.collectionIds || [] : (S.f.coll ? [S.f.coll] : []));
  $("#m-colls").replaceChildren(...(S.collections.length
    ? S.collections.map(c => h("label", null, h("input", { type: "checkbox", value: c.id, checked: sel.has(c.id) }), c.name))
    : [h("span", { class: "small muted", text: "Nenhuma coleção ainda. Crie uma no campo abaixo, se quiser." })]));
  ["title", "url"].forEach(k => fieldErr(k, ""));
  openDlg($("#dlg-form"));
  requestAnimationFrame(() => $("#m-title").focus());
}

export function renderDatalists() {
  const uniq = arr => [...new Set(arr.map(s => (s || "").trim()).filter(Boolean))].sort(cmpName);
  $("#dl-subjects").replaceChildren(...uniq(S.materials.map(m => m.subject)).map(v => h("option", { value: v })));
  $("#dl-periods").replaceChildren(...uniq(S.materials.map(m => m.period)).map(v => h("option", { value: v })));
}

export function wireForm() {
  $$("[data-action='add']").forEach(b => b.addEventListener("click", () => openForm(null)));
  $("#m-url").addEventListener("blur", () => { const v = $("#m-url").value.trim(); if (v) fieldErr("url", validUrl(v) ? "" : BAD_URL); });
  $("#mat-form").addEventListener("submit", async e => {
    e.preventDefault(); if (S.busy) return;
    const title = $("#m-title").value.trim(), url = $("#m-url").value.trim();
    const okT = fieldErr("title", title ? "" : "Dê um título ao material.");
    const okU = fieldErr("url", !url ? "Cole o link do material." : validUrl(url) ? "" : BAD_URL);
    if (!okT || !okU) { (!okT ? $("#m-title") : $("#m-url")).focus(); return; }
    S.busy = true; $("#m-save").disabled = true;
    const editing = S.editId;
    const ok = await write(async () => {
      const collIds = $$("#m-colls input:checked").map(i => i.value);
      const nc = $("#m-coll-new").value.trim();
      if (nc) { const cid = await ensureCollection(nc); if (cid && !collIds.includes(cid)) collIds.push(cid); }
      const tags = [...new Set($("#m-tags").value.split(",").map(t => t.trim()).filter(Boolean))];
      let source = $("#m-origin").value.trim(); if (!source && isDrive(url)) source = "Google Drive";
      const body = { title, url, areaId: $("#m-area").value, subject: $("#m-subject").value.trim(), period: $("#m-period").value.trim(), type: $("#m-type").value,
        tags, collectionIds: collIds, source, notes: $("#m-notes").value.trim(), status: $("#m-status").value, favorite: $("#m-fav").checked };
      if (editing) await S.db.doc("materials/" + editing).update(body);
      else await S.db.collection("materials").doc().set({ ...body, createdAt: nowIso() });
    }, editing ? "Alterações salvas" : "Material salvo");
    S.busy = false; $("#m-save").disabled = false;
    if (ok) closeDlg($("#dlg-form"));
  });
}
