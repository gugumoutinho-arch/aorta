/* Organizar › Colar links: cola-se uma linha por arquivo, vê-se a prévia linha a linha, salva-se como rascunho e
   publica-se um rascunho por vez. Nada lê o conteúdo do Drive nem muda permissões; o Aorta guarda só os links. */
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
const ACTION_LABEL = { criar: "Criar rascunho", ignorar: "Ignorar", ligar: "Ligar ao material que já existe" };
const DUP_TEXT = { material: t => `Já está no catálogo${t ? `: “${t}”` : ""}.`, rascunho: t => `Já há um rascunho deste arquivo${t ? `: “${t}”` : ""}.`, lote: () => "Repetida neste lote." };

let preview = null, watching = false;
const cards = new Map();
const ctx = () => ({ areas: S.areas, topics: S.topics, materials: S.materials, drafts: S.drafts, types: TYPES, links: S.links });
const options = (pairs, value) => pairs.map(([v, l]) => h("option", { value: v, text: l, selected: v === value }));
const places = () => treeOrder().filter(([a]) => isPlace(S.areas, a.id)).map(([a]) => [a.id, pathOf(a.id).map(x => x.name).join(" › ")]);

/* Rascunhos só são lidos quando alguém abre o Organizar (só quem edita tem acesso). */
function watchDrafts() {
  if (watching || !S.db) return;
  watching = true;
  S.db.collection("material_drafts").onSnapshot(s => { S.drafts = s.docs.map(d => ({ id: d.id, ...d.data() })); S.got.d = true; renderImport(); },
    e => { console.warn("Rascunhos indisponíveis.", e); S.got.d = true; S.draftsOff = true; renderImport(); });
}

/* ---------- prévia ---------- */
function rowItem(row, i) {
  const locked = row.errors.length || (row.duplicate && row.action === "ignorar" && !(row.duplicate.kind === "material" && row.topicIds.length));
  const allowed = row.errors.length ? ["ignorar"] : row.duplicate?.kind === "material" ? (row.topicIds.length ? ["ligar", "ignorar"] : ["ignorar"]) : row.duplicate ? ["ignorar"] : ["criar", "ignorar"];
  const choose = allowed.length > 1
    ? h("label", { class: "imp-action" }, h("span", { class: "sr", text: `O que fazer com a linha ${row.line}` }),
      h("select", { "data-row": String(i) }, options(allowed.map(a => [a, ACTION_LABEL[a]]), row.action)))
    : h("p", { class: "imp-action small muted", text: locked ? "Será ignorada." : ACTION_LABEL[row.action] });
  return h("li", { class: "imp-row" + (row.errors.length ? " bad" : ""), "data-line": String(row.line) },
    h("p", { class: "imp-head" }, h("span", { class: "mono", text: `Linha ${row.line}` }), h("b", { text: row.title || "(sem título)" })),
    h("p", { class: "imp-url small", text: row.url || "(sem link)" }),
    row.errors.length ? null : h("p", { class: "small", text: row.place ? `Vai para: ${row.place}` : "Matéria: a escolher no rascunho." }),
    row.errors.map(e => h("p", { class: "err", text: e })),
    row.duplicate ? h("p", { class: "imp-dup small", text: DUP_TEXT[row.duplicate.kind](row.duplicate.title) }) : null,
    row.problems.length && !row.errors.length ? h("ul", { class: "imp-problems small", "aria-label": `Pendências da linha ${row.line}` }, row.problems.map(p => h("li", { text: PROBLEM_TEXT[p] || p }))) : null,
    choose);
}
function renderPreview() {
  const box = $("#imp-preview");
  box.hidden = !preview;
  if (!preview) return;
  const n = a => preview.rows.filter(r => r.action === a).length;
  const errors = preview.rows.filter(r => r.errors.length).length;
  $("#imp-summary").textContent = `${plural(preview.rows.length, "linha", "linhas")}: ` + [plural(n("criar"), "rascunho novo", "rascunhos novos"),
    n("ligar") ? `${n("ligar")} para ligar a material existente` : "", n("ignorar") ? plural(n("ignorar"), "ignorada", "ignoradas") : "",
    errors ? `${errors} com erro` : ""].filter(Boolean).join(", ") + ".";
  $("#imp-rows").replaceChildren(...preview.rows.map(rowItem));
  $("#imp-save").disabled = !n("criar") && !n("ligar");
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
  if (!preview || S.busy) return;
  S.busy = true; $("#imp-save").disabled = true;
  let saved = null;
  const ok = await write(async () => { saved = await saveImport(S.db, preview.rows, { ...ctx(), now: nowIso() }); });
  S.busy = false;
  if (!ok) { renderPreview(); return; }
  preview = null; $("#imp-text").value = ""; renderPreview();
  toast([saved.drafts ? plural(saved.drafts, "rascunho salvo", "rascunhos salvos") : "", saved.linked ? plural(saved.linked, "material ligado", "materiais ligados") : ""].filter(Boolean).join(" · ") + ". Nada foi publicado ainda.");
  $("#h-drafts").focus();
}

/* ---------- rascunhos ---------- */
function field(label, control, id) { return h("div", { class: "fld" }, h("label", { for: id, text: label }), control); }
function draftCard(d) {
  const base = "dr-" + d.id.replace(/[^\w-]/g, "");
  const title = h("input", { id: base + "-title", type: "text", maxlength: "200", value: d.title });
  const type = h("select", { id: base + "-type" }, options([["", "Sem tipo"], ...TYPES.map(t => [t, t])], d.type));
  const rights = h("select", { id: base + "-rights" }, options(RIGHTS.map(r => [r, RIGHTS_LABEL[r]]), d.rights));
  const area = h("select", { id: base + "-area" }, options([["", "Escolher a matéria"], ...places()], d.areaId));
  const source = h("input", { id: base + "-source", type: "text", maxlength: "120", value: d.source });
  const year = h("input", { id: base + "-year", type: "text", inputmode: "numeric", maxlength: "4", value: d.year, placeholder: "AAAA" });
  const topicsBox = h("div", { class: "fld topics-fld" });
  const blockBox = h("div", { class: "imp-block small", role: "status" });
  const card = { el: null, updatedAt: d.updatedAt, dirty: false };
  const picker = topicPicker(topicsBox, { base, onChange: () => touch() });
  const values = () => ({ title: title.value.trim(), type: type.value, rights: rights.value, areaId: area.value, source: source.value.trim(), year: year.value.trim(),
    topicIds: picker.selection().ids });
  // Sempre sobre a versão mais nova do banco: depois de um erro no meio, ela já traz o materialId (repetir não duplica
  // e o material criado por este rascunho não conta como "já no catálogo").
  const current = () => ({ ...(S.drafts.find(x => x.id === d.id) || d), ...values() });
  const showBlockers = () => {
    const list = blockers(current(), ctx());
    blockBox.replaceChildren(list.length ? h("p", { text: "Falta para publicar: " + list.map(p => PROBLEM_TEXT[p] || p).join(" ") }) : h("p", { text: "Pronto para publicar." }));
    return list;
  };
  function touch() { card.dirty = true; showBlockers(); }
  [title, source, year].forEach(i => i.addEventListener("input", touch));
  [type, rights].forEach(i => i.addEventListener("change", touch));
  area.addEventListener("change", () => { picker.area(area.value); touch(); });
  const save = async (msg, extra = {}) => {
    await picker.settled();
    const v = values(), problems = blockers(current(), ctx());
    return write(() => updateDraft(S.db, d.id, { ...v, problems, ...extra }, nowIso()), msg);
  };
  const saveBtn = h("button", { class: "btn", type: "button", text: "Salvar rascunho", onclick: async () => { if (await save("Rascunho salvo")) card.dirty = false; } });
  const publishBtn = h("button", { class: "btn primary", type: "button", text: "Publicar", onclick: async () => {
    if (S.busy) return;
    await picker.settled();
    const list = showBlockers();
    if (list.length) { blockBox.setAttribute("role", "alert"); blockBox.focus(); return; }
    S.busy = true; publishBtn.disabled = true;
    const draft = current(), now = nowIso();
    const ok = await write(async () => {
      await updateDraft(S.db, d.id, { ...values(), problems: [] }, now);
      await publishDraft(S.db, draft, { ...ctx(), now });
    }, `Publicado: “${draft.title}”`);
    S.busy = false; publishBtn.disabled = false;
    if (!ok) { card.dirty = true; return; }
    cards.delete(d.id); renderImport(); $("#h-drafts").focus();
  } });
  const ignoreBtn = h("button", { class: "btn ghost", type: "button", text: "Ignorar", onclick: async () => {
    if (await write(() => updateDraft(S.db, d.id, { status: "ignorado" }, nowIso()), "Rascunho ignorado. O arquivo original não foi alterado.")) { cards.delete(d.id); renderImport(); $("#h-drafts").focus(); }
  } });
  blockBox.tabIndex = -1;
  card.el = h("li", { class: "imp-draft", "data-draft": d.id },
    field("Título", title, title.id),
    h("p", { class: "imp-url small" }, h("a", { href: d.url, target: "_blank", rel: "noopener noreferrer", text: d.url }), d.path ? h("span", { class: "muted", text: ` · caminho colado: ${d.path}` }) : null),
    field("Onde fica", area, area.id), topicsBox,
    h("div", { class: "two" }, field("Tipo", type, type.id), field("Direitos de uso", rights, rights.id)),
    h("div", { class: "two" }, field("Fonte", source, source.id), field("Ano", year, year.id)),
    blockBox, h("div", { class: "acts" }, publishBtn, saveBtn, ignoreBtn));
  card.render = () => { picker.render(); if (!card.dirty) showBlockers(); };
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
  note.textContent = open.length ? `${plural(open.length, "rascunho", "rascunhos")} esperando revisão${done ? ` · ${plural(done, "publicado", "publicados")}` : ""}.`
    : `Nenhum rascunho esperando revisão${done ? ` · ${plural(done, "publicado", "publicados")}` : ""}.`;
  // Cartão com edição em andamento não é refeito (perderia o que foi digitado); os outros acompanham o banco.
  for (const id of [...cards.keys()]) if (!open.some(d => d.id === id)) cards.delete(id);
  for (const d of open) {
    const c = cards.get(d.id);
    if (!c || (!c.dirty && c.updatedAt !== d.updatedAt)) cards.set(d.id, draftCard(d));
    else c.render();
  }
  const els = open.map(d => cards.get(d.id).el);
  if (els.length !== list.children.length || els.some((el, i) => list.children[i] !== el)) list.replaceChildren(...els);
}

export function renderImport() {
  const disabled = !ready();
  $("#import").hidden = !S.db && S.dbState !== "loading";
  $("#imp-form").querySelectorAll("textarea, select, button").forEach(x => { x.disabled = disabled; });
  if (disabled) return;
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
    $(`#imp-rows [data-row="${i}"]`)?.focus();
  });
}
