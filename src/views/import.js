/* Organizar › Colar links: cola-se uma linha por arquivo, vê-se a prévia linha a linha, salva-se como rascunho e
   publica-se um rascunho por vez. Nada lê o conteúdo do Drive nem muda permissões; o Aorta guarda só os links.
   Única ação que muda o catálogo sem rascunho: "ligar agora" uma duplicata ao material que já existe — só por escolha
   explícita na linha, e a tela diz isso antes e depois de salvar. */
import { S, TYPES, ready, topicsReady } from "../core/state.js";
import { $, h } from "../core/dom.js";
import { plural, nowIso } from "../core/text.js";
import { pathOf, treeOrder } from "../core/areas.js";
import { write } from "../core/actions.js";
import { parsePaste, planImport, blockers, isPlace, RIGHTS, DEFAULT_RIGHTS, PROBLEM_TEXT } from "../domain/import.js";
import { saveImport, updateDraft, publishDraft } from "../core/import-store.js";
import { topicPicker } from "./topic-picker.js";
import { toast } from "../ui/toast.js";

const RIGHTS_LABEL = { proprio: "Próprio", autorizado: "Autorizado pelo autor", "licenca-aberta": "Licença aberta", publico: "Público", pendente: "A definir" };
const ACTION_LABEL = { criar: "Criar rascunho", ignorar: "Ignorar", ligar: "Ligar agora ao material já publicado" };
const DUP_TEXT = { material: t => `Duplicata: já está no catálogo${t ? `: “${t}”` : ""}.`, rascunho: t => `Duplicata: já há um rascunho deste arquivo${t ? `: “${t}”` : ""}.`, lote: () => "Duplicata: repetida neste lote." };
const RIGHTS_HINT = "Serve para conferir se o material pode circular. Ainda não fica guardado no material e não muda nada no Drive.";

let preview = null, drawnPreview = null, watching = false;
const cards = new Map();
const ctx = () => ({ areas: S.areas, topics: S.topics, materials: S.materials, drafts: S.drafts, types: TYPES, links: S.links });
const options = (pairs, value) => pairs.map(([v, l]) => h("option", { value: v, text: l, selected: v === value }));
const places = () => treeOrder().filter(([a]) => isPlace(S.areas, a.id)).map(([a]) => [a.id, pathOf(a.id).map(x => x.name).join(" › ")]);
const say = text => { const s = $("#imp-status"); s.textContent = ""; requestAnimationFrame(() => { s.textContent = text; }); };

/* Rascunhos só são lidos quando alguém abre o Organizar (só quem edita tem acesso). */
function watchDrafts() {
  if (watching || !S.db) return;
  watching = true;
  S.db.collection("material_drafts").onSnapshot(s => { S.drafts = s.docs.map(d => ({ id: d.id, ...d.data() })); S.got.d = true; renderImport(); },
    e => { console.warn("Rascunhos indisponíveis.", e); S.got.d = true; S.draftsOff = true; renderImport(); });
}

/* ---------- prévia ---------- */
function rowItem(row, i) {
  const allowed = row.errors.length ? [] : row.duplicate ? (row.canLink ? ["ignorar", "ligar"] : []) : ["criar", "ignorar"];
  const name = `O que fazer com a linha ${row.line}${row.title ? `, ${row.title}` : ""}`;
  const choose = allowed.length > 1
    ? h("label", { class: "imp-action" }, h("span", { class: "sr", text: name }),
      h("select", { "data-row": String(i) }, options(allowed.map(a => [a, ACTION_LABEL[a]]), row.action)))
    : h("p", { class: "imp-action small muted", text: "Será ignorada." });
  return h("li", { class: "imp-row" + (row.errors.length ? " bad" : ""), "data-line": String(row.line) },
    h("p", { class: "imp-head" }, h("span", { class: "mono", text: `Linha ${row.line}` }), h("b", { text: row.title || "(sem título)" })),
    h("p", { class: "imp-url small", text: row.url || "(sem link)" }),
    row.errors.length ? null : h("p", { class: "small", text: row.place ? `Vai para: ${row.place}` : "Matéria: a escolher no rascunho." }),
    row.errors.map(e => h("p", { class: "err", text: e })),
    row.duplicate ? h("p", { class: "imp-dup small", text: DUP_TEXT[row.duplicate.kind](row.duplicate.title) }) : null,
    row.action === "ligar" ? h("p", { class: "imp-warn small", text: `Ao salvar, “${row.duplicate.title}” passa a aparecer também em ${row.place}, já publicado.` }) : null,
    // Pendências são de rascunho: linha com erro ou duplicata não vira rascunho.
    row.problems.length && !row.errors.length && !row.duplicate ? h("ul", { class: "imp-problems small", "aria-label": `Pendências da linha ${row.line}` }, row.problems.map(p => h("li", { text: PROBLEM_TEXT[p] || p }))) : null,
    choose);
}
const count = a => preview.rows.filter(r => r.action === a).length;
/* Redesenha só quando a prévia muda (um redesenho tiraria o foco do seletor em uso). */
function renderPreview() {
  const box = $("#imp-preview");
  box.hidden = !preview;
  if (!preview || drawnPreview === preview) return;
  drawnPreview = preview;
  const focused = document.activeElement?.dataset?.row;
  const errors = preview.rows.filter(r => r.errors.length).length, ignored = count("ignorar"), drafts = count("criar"), link = count("ligar");
  $("#imp-summary").textContent = `${plural(preview.rows.length, "linha", "linhas")}: ` + [plural(drafts, "rascunho novo", "rascunhos novos"),
    link ? `${plural(link, "material já publicado", "materiais já publicados")} ganha${link > 1 ? "m" : ""} assunto ao salvar` : "",
    ignored ? plural(ignored, "ignorada", "ignoradas") + (errors ? ` (${errors} por erro)` : "") : ""].filter(Boolean).join(", ") + ".";
  $("#imp-rows").replaceChildren(...preview.rows.map(rowItem));
  const save = $("#imp-save");
  save.textContent = [drafts ? `Salvar ${plural(drafts, "rascunho", "rascunhos")}` : "", link ? `${drafts ? "e ligar" : "Ligar"} ${plural(link, "material", "materiais")}` : ""].filter(Boolean).join(" ") || "Salvar rascunhos";
  save.disabled = !drafts && !link;
  if (focused !== undefined) $(`#imp-rows [data-row="${focused}"]`)?.focus();
}
function showPreview(e) {
  e.preventDefault();
  const parsed = parsePaste($("#imp-text").value), err = $("#imp-err");
  const msg = parsed.error || (!parsed.rows.length ? "Cole pelo menos um link." : "");
  err.textContent = msg; err.hidden = !msg;
  msg ? $("#imp-text").setAttribute("aria-invalid", "true") : $("#imp-text").removeAttribute("aria-invalid");
  if (msg) { preview = null; renderPreview(); $("#imp-text").focus(); return; }
  preview = { rows: planImport(parsed.rows, { ...ctx(), defaultRights: $("#imp-rights").value }) };
  renderPreview();
  $("#imp-preview-title").focus();
}
async function savePreview() {
  const btn = $("#imp-save");
  if (!preview || S.busy || btn.getAttribute("aria-disabled") === "true") return;
  S.busy = true; btn.setAttribute("aria-disabled", "true");
  let saved = null;
  const ok = await write(async () => { saved = await saveImport(S.db, preview.rows, { ...ctx(), now: nowIso() }); });
  S.busy = false; btn.removeAttribute("aria-disabled");
  if (!ok) { btn.focus(); return; }
  preview = null; $("#imp-text").value = ""; renderPreview();
  const parts = [saved.drafts ? plural(saved.drafts, "rascunho salvo", "rascunhos salvos") + " (nada novo publicado)" : "",
    saved.linked ? plural(saved.linked, "material já publicado ganhou", "materiais já publicados ganharam") + " assunto agora" : ""];
  toast(parts.filter(Boolean).join(" · ") + ".");
  $("#h-drafts").focus();
}

/* ---------- rascunhos ---------- */
function field(label, control, id, hint) {
  return h("div", { class: "fld" }, h("label", { for: id, text: label }), control, hint ? h("span", { class: "hint", id: id + "-hint", text: hint }) : null);
}
/* Depois de publicar ou ignorar, o foco vai ao próximo rascunho (num lote grande, não volta ao topo). */
function focusAfter(id) {
  const ids = [...cards.keys()], i = ids.indexOf(id), next = ids[i + 1] || ids[i - 1];
  cards.delete(id); renderImport();
  const target = next && cards.get(next)?.el.querySelector("h4");
  (target || $("#h-drafts")).focus();
}
function draftCard(d) {
  const base = "dr-" + d.id.replace(/[^\w-]/g, "");
  const heading = h("h4", { id: base + "-h", tabindex: "-1", text: d.title || "(sem título)" });
  const title = h("input", { id: base + "-title", type: "text", maxlength: "200", value: d.title });
  const type = h("select", { id: base + "-type" }, options([["", "Sem tipo"], ...TYPES.map(t => [t, t])], d.type));
  const rights = h("select", { id: base + "-rights", "aria-describedby": base + "-rights-hint" }, options(RIGHTS.map(r => [r, RIGHTS_LABEL[r]]), d.rights));
  const area = h("select", { id: base + "-area" }, options([["", "Escolher a matéria"], ...places()], d.areaId));
  const source = h("input", { id: base + "-source", type: "text", maxlength: "120", value: d.source });
  const year = h("input", { id: base + "-year", type: "text", inputmode: "numeric", maxlength: "4", value: d.year, placeholder: "AAAA" });
  const topicsBox = h("div", { class: "fld topics-fld" });
  // Fora de região viva: muda a cada tecla. A recusa de "Publicar" é anunciada uma vez em #imp-status.
  const blockBox = h("div", { class: "imp-block small", id: base + "-block", tabindex: "-1" });
  const card = { el: null, updatedAt: d.updatedAt, dirty: false };
  const picker = topicPicker(topicsBox, { base, onChange: () => touch() });
  const values = () => ({ title: title.value.trim(), type: type.value, rights: rights.value, areaId: area.value, source: source.value.trim(), year: year.value.trim(),
    topicIds: picker.selection().ids });
  // Sempre sobre a versão mais nova do banco: depois de um erro no meio, ela já traz o materialId (repetir não duplica
  // e o material criado por este rascunho não conta como "já no catálogo").
  const current = () => ({ ...(S.drafts.find(x => x.id === d.id) || d), ...values() });
  const showBlockers = () => {
    const list = blockers(current(), ctx());
    const text = list.length ? "Falta para publicar: " + list.map(p => PROBLEM_TEXT[p] || p).join(" ") : "Pronto para publicar.";
    if (blockBox.textContent !== text) blockBox.textContent = text;
    return list;
  };
  function touch() { card.dirty = true; showBlockers(); }
  [title, source, year].forEach(i => i.addEventListener("input", touch));
  title.addEventListener("input", () => { heading.textContent = title.value.trim() || "(sem título)"; });
  [type, rights].forEach(i => i.addEventListener("change", touch));
  area.addEventListener("change", () => { picker.area(area.value); touch(); });
  /* Botões ocupados ficam aria-disabled (não disabled), para o foco não cair no corpo da página. */
  const busy = b => { if (S.busy || b.getAttribute("aria-disabled") === "true") return true; S.busy = true; b.setAttribute("aria-disabled", "true"); return false; };
  const free = b => { S.busy = false; b.removeAttribute("aria-disabled"); };
  // Gravação própria: o cartão já mostra o que foi gravado e não precisa ser refeito (o foco fica onde está).
  const saveBtn = h("button", { class: "btn", type: "button", text: "Salvar rascunho", onclick: async () => {
    if (busy(saveBtn)) return;
    await picker.settled();
    const now = nowIso(), ok = await write(() => updateDraft(S.db, d.id, { ...values(), problems: blockers(current(), ctx()) }, now), "Rascunho salvo");
    free(saveBtn);
    if (ok) { card.dirty = false; card.updatedAt = now; }
    saveBtn.focus();
  } });
  const publishBtn = h("button", { class: "btn primary", type: "button", text: "Publicar", "aria-describedby": blockBox.id, onclick: async () => {
    if (busy(publishBtn)) return;
    await picker.settled();
    const list = showBlockers();
    if (list.length) { free(publishBtn); say(`Não dá para publicar “${title.value.trim() || "(sem título)"}” ainda. ${blockBox.textContent}`); blockBox.focus(); return; }
    const draft = current(), now = nowIso();
    const ok = await write(async () => {
      await updateDraft(S.db, d.id, { ...values(), problems: [] }, now);
      await publishDraft(S.db, draft, { ...ctx(), now });
    }, `Publicado: “${draft.title}”`);
    free(publishBtn);
    if (!ok) { card.dirty = true; publishBtn.focus(); return; }
    focusAfter(d.id);
  } });
  const ignoreBtn = h("button", { class: "btn ghost", type: "button", text: "Ignorar", onclick: async () => {
    if (busy(ignoreBtn)) return;
    const undo = () => write(() => updateDraft(S.db, d.id, { status: "rascunho" }, nowIso()), "Rascunho de volta");
    const ok = await write(() => updateDraft(S.db, d.id, { status: "ignorado" }, nowIso()), "Rascunho ignorado. O arquivo original não foi alterado.", { action: { label: "Desfazer", run: undo } });
    free(ignoreBtn);
    if (ok) focusAfter(d.id); else ignoreBtn.focus();
  } });
  card.el = h("li", { class: "imp-draft", "data-draft": d.id, "aria-labelledby": heading.id },
    heading,
    h("p", { class: "imp-url small" }, h("a", { href: d.url, target: "_blank", rel: "noopener noreferrer", text: d.url }), d.path ? h("span", { class: "muted", text: ` · caminho colado: ${d.path}` }) : null),
    field("Título", title, title.id),
    field("Onde fica", area, area.id), topicsBox,
    h("div", { class: "two" }, field("Tipo", type, type.id), field("Direitos de uso", rights, rights.id, RIGHTS_HINT)),
    h("div", { class: "two" }, field("Fonte", source, source.id), field("Ano", year, year.id)),
    blockBox, h("div", { class: "acts" }, publishBtn, saveBtn, ignoreBtn));
  card.render = () => { picker.render(); showBlockers(); };
  picker.open(d.areaId, d.topicIds || []);
  showBlockers();
  return card;
}
function renderDrafts() {
  const list = $("#imp-drafts"), note = $("#imp-drafts-note");
  if (S.draftsOff) { note.textContent = "Rascunhos indisponíveis agora (o banco ainda não tem a tabela de rascunhos ou recusou o acesso)."; list.replaceChildren(); return; }
  if (!S.got.d) { note.textContent = "Carregando rascunhos…"; return; }
  const open = S.drafts.filter(d => d.status === "rascunho").sort((a, b) => (a.createdAt || "").localeCompare(b.createdAt || ""));
  const done = S.drafts.filter(d => d.status === "publicado").length;
  const text = (open.length ? `${plural(open.length, "rascunho", "rascunhos")} esperando revisão` : "Nenhum rascunho esperando revisão") + (done ? ` · ${plural(done, "publicado", "publicados")}` : "") + ".";
  if (note.textContent !== text) note.textContent = text;
  // Cartão com edição em andamento não é refeito (perderia o que foi digitado); os outros acompanham o banco.
  const focusId = list.contains(document.activeElement) ? document.activeElement.id : "";
  for (const id of [...cards.keys()]) if (!open.some(d => d.id === id)) cards.delete(id);
  for (const d of open) {
    const c = cards.get(d.id);
    if (!c || (!c.dirty && c.updatedAt !== d.updatedAt)) cards.set(d.id, draftCard(d));
    else c.render();
  }
  // Troca só os nós que mudaram, para não tirar o foco de quem está digitando em outro cartão.
  const els = open.map(d => cards.get(d.id).el);
  [...list.children].forEach(el => { if (!els.includes(el)) el.remove(); });
  els.forEach((el, i) => { if (list.children[i] !== el) list.insertBefore(el, list.children[i] || null); });
  if (focusId && !list.contains(document.activeElement)) document.getElementById(focusId)?.focus({ preventScroll: true });
}

export function renderImport() {
  const disabled = !ready() || S.draftsOff;
  $("#import").hidden = !S.db && S.dbState !== "loading";
  $("#imp-form").querySelectorAll("textarea, select, button").forEach(x => { x.disabled = disabled; });
  if (!ready()) return;
  watchDrafts();
  if (topicsReady()) renderDrafts();
  renderPreview();
}

export function wireImport() {
  $("#imp-rights").replaceChildren(...options(RIGHTS.filter(r => r !== "pendente").map(r => [r, RIGHTS_LABEL[r]]), DEFAULT_RIGHTS));
  $("#imp-form").addEventListener("submit", showPreview);
  $("#imp-save").addEventListener("click", savePreview);
  $("#imp-clear").addEventListener("click", () => { preview = null; renderPreview(); $("#imp-text").focus(); });
  $("#imp-rows").addEventListener("change", e => {
    const i = e.target.dataset?.row; if (i === undefined || !preview) return;
    preview = { rows: preview.rows.map((r, k) => k === +i ? { ...r, action: e.target.value } : r) };
    renderPreview();
  });
}
