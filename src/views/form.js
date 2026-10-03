/* Cadastro e edição de um link de material (só para quem edita). */
import { S, TYPES, STATUS, ready, find, topicsReady } from "../core/state.js";
import { $, $$, h } from "../core/dom.js";
import { cmpName, validUrl, isDrive, nowIso } from "../core/text.js";
import { pathOf, treeOrder } from "../core/areas.js";
import { write, ensureCollection } from "../core/actions.js";
import { openDlg, closeDlg } from "../ui/dialogs.js";
import { CASES, CASE_TYPE, tabContext } from "../domain/topics.js";
import { subjectFor } from "../domain/topic-edit.js";
import { saveMaterialTopics } from "../core/topic-store.js";
import { topicPicker, initialTopics } from "./topic-picker.js";

let picker = null;
/* O texto antigo "Assunto" só aparece onde não há fichas de assunto (área acima de matéria, ou banco sem assuntos). */
const syncSubjectField = () => { $("#m-subject-fld").hidden = picker.selection().mode === "on"; };

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
  // Aberto numa aba de assunto (ou em Casos clínicos) da própria matéria: o material novo já nasce nela.
  const onTab = !m && S.view === "modulo" && S.subject && S.tab && $("#m-area").value === S.subject ? S.tab : "";
  fillSelect($("#m-type"), [["", "Sem tipo"], ...TYPES.map(t => [t, t])], m?.type || (onTab === CASES ? CASE_TYPE : ""));
  const tabTopic = onTab && onTab !== CASES ? tabContext({ areaId: S.subject, topics: S.topics, links: [] }).bySlug.get(onTab) : null;
  picker.open($("#m-area").value, m ? initialTopics(m, $("#m-area").value) : tabTopic ? [tabTopic.id] : []);
  syncSubjectField();
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
  if ($("#dlg-form").open) { picker.render(); syncSubjectField(); }
  const uniq = arr => [...new Set(arr.map(s => (s || "").trim()).filter(Boolean))].sort(cmpName);
  $("#dl-subjects").replaceChildren(...uniq(S.materials.map(m => m.subject)).map(v => h("option", { value: v })));
  $("#dl-periods").replaceChildren(...uniq(S.materials.map(m => m.period)).map(v => h("option", { value: v })));
}

export function wireForm() {
  $$("[data-action='add']").forEach(b => b.addEventListener("click", () => openForm(null)));
  picker = topicPicker($("#m-topics-fld"), { base: "m" });
  $("#m-area").addEventListener("change", e => { picker.area(e.target.value); syncSubjectField(); });
  $("#m-url").addEventListener("blur", () => { const v = $("#m-url").value.trim(); if (v) fieldErr("url", validUrl(v) ? "" : BAD_URL); });
  $("#mat-form").addEventListener("submit", async e => {
    e.preventDefault(); if (S.busy) return;
    const title = $("#m-title").value.trim(), url = $("#m-url").value.trim();
    const okT = fieldErr("title", title ? "" : "Dê um título ao material.");
    const okU = fieldErr("url", !url ? "Cole o link do material." : validUrl(url) ? "" : BAD_URL);
    if (!okT || !okU) { (!okT ? $("#m-title") : $("#m-url")).focus(); return; }
    S.busy = true; $("#m-save").disabled = true;
    await picker.settled();
    const editing = S.editId, pick = picker.selection();
    // Sem assunto marcado e sem ligação anterior, o texto antigo "assunto" fica como estava (não se perde).
    const hadLinks = !!editing && S.links.some(l => l.materialId === editing);
    const subject = pick.mode === "on" && (pick.ids.length || hadLinks) ? subjectFor(pick.ids, S.topics) : $("#m-subject").value.trim();
    const ok = await write(async () => {
      const collIds = $$("#m-colls input:checked").map(i => i.value);
      const nc = $("#m-coll-new").value.trim();
      if (nc) { const cid = await ensureCollection(nc); if (cid && !collIds.includes(cid)) collIds.push(cid); }
      const tags = [...new Set($("#m-tags").value.split(",").map(t => t.trim()).filter(Boolean))];
      let source = $("#m-origin").value.trim(); if (!source && isDrive(url)) source = "Google Drive";
      const body = { title, url, areaId: $("#m-area").value, subject, period: $("#m-period").value.trim(), type: $("#m-type").value,
        tags, collectionIds: collIds, source, notes: $("#m-notes").value.trim(), status: $("#m-status").value, favorite: $("#m-fav").checked };
      let id = editing;
      if (editing) await S.db.doc("materials/" + editing).update(body);
      else { const ref = S.db.collection("materials").doc(); await ref.set({ ...body, createdAt: nowIso() }); id = ref.id; }
      // Assuntos: só com as ligações carregadas (senão a diferença sairia errada). Fora de matéria, nenhum assunto fica ligado.
      if (!topicsReady() || S.topicsOff) return;
      const wanted = pick.mode === "on" ? pick.ids : [];
      await saveMaterialTopics(S.db, { materialId: id, wanted, links: S.links });
      S.links = [...S.links.filter(l => l.materialId !== id), ...wanted.map(topicId => ({ materialId: id, topicId }))];
    }, editing ? "Alterações salvas" : "Material salvo");
    S.busy = false; $("#m-save").disabled = false;
    if (ok) closeDlg($("#dlg-form"));
  });
}
