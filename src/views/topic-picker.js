/* Escolha de assuntos de uma matéria: fichas de múltipla escolha, "Novo assunto" (cria na hora e já marca) e o aviso
   de nome parecido ("Já existe 'Membro superior'. Usar esse?"). Usado no formulário de material e nos rascunhos da colagem.
   Os ids internos nascem de "base" (ex.: "m" → #m-topics, #m-topic-new). Só matérias têm assuntos. */
import { S, topicsReady } from "../core/state.js";
import { h } from "../core/dom.js";
import { depthOf } from "../core/areas.js";
import { topicNorm } from "../domain/topics.js";
import { planTopic, linkedTopics } from "../domain/topic-edit.js";
import { findSimilar } from "../domain/similar.js";
import { createTopic } from "../core/topic-actions.js";

const byOrder = (a, b) => (a.order ?? 0) - (b.order ?? 0);
/* "on": matéria; "off": área acima de matéria (ou nenhuma); "none": banco sem as tabelas de assunto. */
export const topicMode = areaId => S.topicsOff ? "none" : areaId && depthOf(areaId) === 2 ? "on" : "off";

/* Assuntos marcados ao abrir um material: os ligados; sem ligação, o texto antigo se ele for o nome de um assunto. */
export function initialTopics(material, areaId) {
  if (!material || topicMode(areaId) !== "on") return [];
  const own = S.topics.filter(t => t.areaId === areaId);
  const linked = linkedTopics(material.id, S.links, own).map(t => t.id);
  if (linked.length || !material.subject) return linked;
  const same = own.find(t => topicNorm(t.name) === topicNorm(material.subject));
  return same ? [same.id] : [];
}

export function topicPicker(root, { base, label = "Assuntos", onChange = () => {} }) {
  const id = s => `${base}-${s}`;
  let st = { areaId: "", selected: [], busy: false }, creating = Promise.resolve();
  const set = patch => { st = { ...st, ...patch }; };

  const lbl = h("span", { class: "lbl", id: id("topics-lbl"), text: label });
  const chips = h("div", { class: "topic-chips", id: id("topics"), role: "group", "aria-labelledby": id("topics-lbl"), "aria-describedby": id("topics-hint") });
  const hint = h("span", { class: "hint", id: id("topics-hint") });
  const input = h("input", { id: id("topic-new"), type: "text", maxlength: "80", autocomplete: "off", enterkeyhint: "done", placeholder: "Nome do assunto", "aria-describedby": id("topic-err") });
  const add = h("button", { class: "btn", type: "button", id: id("topic-add"), text: "Novo assunto" });
  const row = h("div", { class: "topic-new", id: id("topic-row") }, h("label", { class: "sr", for: id("topic-new"), text: "Nome do novo assunto desta matéria" }), input, add);
  const err = h("span", { class: "err", id: id("topic-err"), hidden: true });
  const similarBox = h("div", { class: "topic-similar", id: id("topic-similar"), hidden: true });
  const status = h("p", { class: "sr", id: id("topics-status"), role: "status" });
  root.replaceChildren(lbl, chips, hint, row, err, similarBox, status);

  const own = () => S.topics.filter(t => t.areaId === st.areaId).sort(byOrder);
  const say = text => { status.textContent = text; };
  const showError = msg => { err.textContent = msg; err.hidden = !msg; msg ? input.setAttribute("aria-invalid", "true") : input.removeAttribute("aria-invalid"); };
  const hideSimilar = () => { similarBox.hidden = true; similarBox.replaceChildren(); };

  /* Redesenhar (dados novos do banco) mantém o foco na mesma ficha. */
  function render() {
    const mode = topicMode(st.areaId), on = mode === "on", loading = on && !topicsReady();
    root.hidden = mode === "none";
    row.hidden = !on;
    // Enquanto cria, o campo fica só leitura (não "disabled"), para o foco não se perder.
    const wait = loading || st.busy;
    input.readOnly = wait; wait ? input.setAttribute("aria-disabled", "true") : input.removeAttribute("aria-disabled");
    add.disabled = wait;
    hint.textContent = !on ? "Assuntos ficam dentro de uma matéria. Escolha uma matéria em “Onde fica” para marcar assuntos."
      : loading ? "Carregando os assuntos da matéria…" : "Marque um ou mais. O material aparece na aba de cada assunto marcado. Assunto novo fica na matéria mesmo se você cancelar.";
    const focused = chips.contains(document.activeElement) ? document.activeElement.dataset.topic : "";
    chips.hidden = !on || loading;
    if (chips.hidden) { chips.replaceChildren(); return; }
    const list = own(), chosen = new Set(st.selected);
    chips.replaceChildren(...(list.length ? list.map(t => h("label", { class: "topic-chip" },
      h("input", { type: "checkbox", value: t.id, "data-topic": t.id, checked: chosen.has(t.id) }), h("span", { text: t.name })))
      : [h("span", { class: "small muted", text: "Esta matéria ainda não tem assuntos. Crie o primeiro abaixo." })]));
    if (focused) chips.querySelector(`[data-topic="${CSS.escape(focused)}"]`)?.focus({ preventScroll: true });
  }
  function mark(topicId) {
    if (!st.selected.includes(topicId)) set({ selected: [...st.selected, topicId] });
    render(); onChange();
  }
  function showSimilar(name, similar) {
    const names = similar.map(t => `“${t.name}”`).join(", ");
    const use = similar.map(t => h("button", { class: "btn primary", type: "button", "data-use": t.id, text: `Usar “${t.name}”` }));
    similarBox.replaceChildren(
      h("p", { text: similar.length === 1 ? `Já existe ${names}. Usar esse?` : `Já existem assuntos parecidos: ${names}. Usar um deles?` }),
      h("div", { class: "acts" }, use, h("button", { class: "btn ghost", type: "button", "data-force": "", text: `Criar “${name}” mesmo assim` })));
    similarBox.hidden = false;
    say(similarBox.firstChild.textContent);
    requestAnimationFrame(() => use[0].focus());
  }
  /* Novo assunto: nome igual marca o existente; parecido pergunta antes; senão cria e marca. */
  async function addTopic(force) {
    if (st.busy) return;
    const plan = planTopic(st.areaId, input.value, S.topics);
    if (plan.error) { showError(plan.error); say(plan.error); input.focus(); return; }
    showError("");
    if (plan.existing) { mark(plan.existing.id); input.value = ""; hideSimilar(); say(`“${plan.existing.name}” já existe e foi marcado.`); return; }
    const similar = force ? [] : findSimilar(plan.fields.name, st.areaId, S.topics).slice(0, 3);
    if (similar.length) { showSimilar(plan.fields.name, similar); return; }
    input.focus(); hideSimilar();
    set({ busy: true }); render();
    let done;
    creating = new Promise(r => { done = r; });
    const topic = await createTopic(st.areaId, plan.fields.name);
    set({ busy: false });
    if (topic) { input.value = ""; mark(topic.id); say(`Assunto “${topic.name}” criado e marcado.`); }
    else { render(); const msg = "Não deu para criar o assunto agora. Tente de novo."; showError(msg); say(msg); }
    done();
    input.focus();
  }

  chips.addEventListener("change", e => {
    const t = e.target.dataset?.topic; if (!t) return;
    set({ selected: e.target.checked ? [...st.selected, t] : st.selected.filter(x => x !== t) }); onChange();
  });
  add.addEventListener("click", () => addTopic(false));
  input.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); addTopic(false); } });
  input.addEventListener("input", () => { hideSimilar(); showError(""); });
  // Esc no aviso fecha só o aviso (não o formulário inteiro) e volta ao campo.
  similarBox.addEventListener("keydown", e => {
    if (e.key !== "Escape") return;
    e.preventDefault(); e.stopPropagation(); input.focus(); hideSimilar(); say("");
  });
  similarBox.addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    if (!b.dataset.use) { input.focus(); addTopic(true); return; }
    const t = S.topics.find(x => x.id === b.dataset.use);
    mark(b.dataset.use); input.value = ""; hideSimilar();
    say(`“${t?.name || "Assunto"}” marcado.`); input.focus();
  });

  return {
    /* Abre (ou troca de matéria). Outra matéria começa sem assunto marcado. */
    open(areaId, selected = []) { set({ areaId, selected: [...selected] }); input.value = ""; showError(""); hideSimilar(); say(""); render(); },
    area(areaId) { if (areaId === st.areaId) return; set({ areaId, selected: [] }); hideSimilar(); showError(""); render(); },
    /* Modo e assuntos marcados, na ordem da matéria. */
    selection() { const ids = new Set(st.selected); return { mode: topicMode(st.areaId), ids: own().filter(t => ids.has(t.id)).map(t => t.id) }; },
    render,
    /* Espera um "Novo assunto" em andamento (salvar antes disso deixaria o material sem ele). */
    settled: () => creating,
  };
}
