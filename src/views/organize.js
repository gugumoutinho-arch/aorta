/* Organizar: módulos › unidades › matérias e coleções (só para quem edita). Excluir nunca apaga materiais nem arquivos. */
import { S, LEVEL, ready } from "../core/state.js";
import { $, $$, h } from "../core/dom.js";
import { plural } from "../core/text.js";
import { childrenOf, areaById, countIn, stainOf, stainVar } from "../core/areas.js";
import { addArea, renameArea, deleteArea, addColl, renameColl, deleteColl } from "../core/actions.js";
import { toast } from "../ui/toast.js";
/* "Colar links" só carrega ao entrar em Organizar: fica fora do JS da primeira tela (orçamento de carga). */
let importView = null, importReady = false;
const loadImport = () => (importView ||= import("./import.js").then(m => { m.wireImport(); importReady = true; return m; }));

const ui = { editing: null, confirming: null, adding: null };
const later = fn => requestAnimationFrame(fn);
const reset = (patch = {}) => { Object.assign(ui, { editing: null, confirming: null, adding: null }, patch); renderOrg(); };

function renameForm(value, label, max, onSave) {
  const inp = h("input", { type: "text", value, maxlength: String(max), "aria-label": label });
  later(() => inp.focus());
  return h("form", { class: "inline-form", onsubmit: e => { e.preventDefault(); onSave(inp.value); } }, inp,
    h("button", { class: "btn primary", type: "submit", text: "Salvar" }), h("button", { class: "btn ghost", type: "button", text: "Cancelar", onclick: () => reset() }));
}
function confirmBox(text, onYes) {
  const yes = h("button", { class: "btn danger", type: "button", text: "Excluir", onclick: onYes });
  later(() => yes.focus());
  return h("div", { class: "confirm-inline", role: "alert" }, h("p", { text }), h("div", { class: "acts" }, yes, h("button", { class: "btn", type: "button", text: "Cancelar", onclick: () => reset() })));
}

function areaRow(a, d, disabled) {
  const li = h("li"), key = a.id, kids = childrenOf(a.id);
  if (ui.editing === key) {
    li.append(h("div", { class: "row", style: stainVar(stainOf(a.id)) }, renameForm(a.name, "Novo nome de " + a.name, 60, async v => { if (await renameArea(a.id, v)) reset(); })));
  } else {
    li.append(h("div", { class: "row", style: stainVar(stainOf(a.id)) },
      h("span", { class: "swatch", "aria-hidden": "true" }),
      h("a", { class: "name", href: "#a-" + a.id, text: a.name }),
      h("span", { class: "lvl", text: LEVEL[Math.min(d, 2)] }), h("span", { class: "count", text: plural(countIn(a.id), "item", "itens") }),
      d < 2 ? h("button", { class: "btn ghost", type: "button", disabled, text: d === 0 ? "+ Unidade" : "+ Matéria", onclick: () => reset({ adding: a.id }) }) : null,
      h("button", { class: "btn ghost", type: "button", disabled, text: "Renomear", "aria-label": "Renomear " + a.name, onclick: () => reset({ editing: key }) }),
      h("button", { class: "btn ghost", type: "button", disabled, text: "Excluir", "aria-label": "Excluir " + a.name, onclick: () => {
        if (kids.length) { toast(`${a.name} tem ${plural(kids.length, "subdivisão", "subdivisões")}. Exclua o que está dentro primeiro.`, { error: true }); return; }
        reset({ confirming: key });
      } })));
    if (ui.confirming === key) {
      const n = countIn(a.id), parent = areaById(a.parentId);
      li.append(confirmBox(`Excluir “${a.name}”? ${n ? plural(n, "material vai", "materiais vão") + " para " + (parent ? parent.name : "“sem área”") + "." : "Não há materiais aqui."} Nenhum arquivo é apagado.`,
        async () => { if (await deleteArea(a.id)) reset(); }));
    }
  }
  if (kids.length || ui.adding === a.id) {
    const ul = h("ul"); kids.forEach(k => ul.append(areaRow(k, d + 1, disabled)));
    if (ui.adding === a.id) {
      const inp = h("input", { type: "text", maxlength: "60", placeholder: d === 0 ? "Nome da unidade (ex.: CIS 3)" : "Nome da matéria (ex.: Fisiologia)", "aria-label": "Nome da nova " + (d === 0 ? "unidade" : "matéria") });
      later(() => inp.focus());
      ul.append(h("li", null, h("div", { class: "row" }, h("form", { class: "inline-form", onsubmit: async e => { e.preventDefault(); if (await addArea(a.id, inp.value)) reset(); } }, inp,
        h("button", { class: "btn primary", type: "submit", text: "Criar" }), h("button", { class: "btn ghost", type: "button", text: "Cancelar", onclick: () => reset() })))));
    }
    li.append(ul);
  }
  return li;
}

export function renderOrg() {
  const tree = $("#tree"), disabled = !ready();
  const roots = childrenOf("");
  tree.replaceChildren(...(roots.length ? roots.map(r => areaRow(r, 0, disabled))
    : [h("li", { class: "muted small", text: disabled ? (S.dbState === "loading" ? "Carregando módulos…" : "Módulos indisponíveis agora.") : "Nenhum módulo ainda. Crie o primeiro abaixo." })]));
  const orphan = S.materials.filter(m => !areaById(m.areaId)).length;
  if (orphan) tree.append(h("li", { class: "muted small", text: `${plural(orphan, "material está", "materiais estão")} sem área definida. Encontre em Todos os materiais e edite o campo “Onde fica”.` }));

  const ul = $("#coll-rows");
  ul.replaceChildren(...(S.collections.length ? [] : [h("li", { class: "muted small", text: disabled ? (S.dbState === "loading" ? "Carregando coleções…" : "Coleções indisponíveis agora.") : "Nenhuma coleção ainda. Crie a primeira abaixo." })]));
  S.collections.forEach(c => {
    const n = S.materials.filter(m => (m.collectionIds || []).includes(c.id)).length, key = "c:" + c.id;
    if (ui.editing === key) { ul.append(h("li", { class: "row" }, renameForm(c.name, "Novo nome de " + c.name, 80, async v => { if (await renameColl(c.id, v)) reset(); }))); return; }
    ul.append(h("li", { class: "row" },
      h("button", { class: "name", type: "button", text: c.name, onclick: () => { S.scope = "todos"; S.unit = S.subject = ""; S.f = { type: "", status: "", fav: false, coll: c.id }; S.q = ""; location.hash = "todos"; } }),
      h("span", { class: "count", text: plural(n, "item", "itens") }),
      h("button", { class: "btn ghost", type: "button", disabled, text: "Renomear", "aria-label": "Renomear " + c.name, onclick: () => reset({ editing: key }) }),
      h("button", { class: "btn ghost", type: "button", disabled, text: "Excluir", "aria-label": "Excluir " + c.name, onclick: () => reset({ confirming: key }) })));
    if (ui.confirming === key) ul.append(h("li", null, confirmBox(`Excluir a coleção “${c.name}”? ${plural(n, "material sai", "materiais saem")} dela, mas continuam no catálogo.`, async () => { if (await deleteColl(c.id, c.name)) reset(); })));
  });
  $$("#mod-add input, #mod-add button, #coll-add input, #coll-add button").forEach(x => { x.disabled = disabled; });
  loadImport().then(m => { if (S.view === "organizar") m.renderImport(); });
}

export function wireOrg() {
  // Enquanto o módulo da colagem não chegou, o formulário não pode recarregar a página.
  $("#imp-form").addEventListener("submit", e => { if (!importReady) e.preventDefault(); });
  $("#mod-add").addEventListener("submit", async e => { e.preventDefault(); const i = $("#mod-new"); if (await addArea("", i.value)) i.value = ""; });
  $("#coll-add").addEventListener("submit", async e => { e.preventDefault(); const i = $("#coll-new"); if (!i.value.trim()) { i.focus(); return; } if (await addColl(i.value)) i.value = ""; });
}
