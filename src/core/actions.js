/* Gravações no catálogo. Cada uma mostra o resultado; remover sempre oferece Desfazer e nunca apaga o arquivo original. */
import { S, STAINS, STATUS_LABEL, find } from "./state.js";
import { areaById, childrenOf, depthOf } from "./areas.js";
import { norm, nowIso } from "./text.js";
import { toast } from "../ui/toast.js";
import { renderAll } from "../app.js";

const failMsg = e => (e && e.code === "quota_exceeded") ? "O catálogo atingiu o limite de armazenamento. Remova itens antigos e tente de novo." : "Não foi possível salvar agora. Verifique a conexão e tente de novo.";
export async function write(fn, okMsg, opts) {
  if (!S.db) { toast("O catálogo não está disponível agora.", { error: true }); return false; }
  try { await fn(); if (okMsg) toast(okMsg, opts); return true; }
  catch (e) { console.error(e); toast(failMsg(e), { error: true }); return false; }
}

/* Escrita otimista: a tela muda na hora; se falhar, volta ao que era. Uma escrita por material de cada vez. */
export const materialWrites = new Map();
export async function updateMaterial(id, patch, message) {
  const m = find(id); if (!m || !S.db || materialWrites.has(id)) return;
  const before = Object.fromEntries(Object.keys(patch).map(k => [k, m[k]]));
  materialWrites.set(id, { patch });
  Object.assign(m, patch); renderAll();
  const ok = await write(() => S.db.doc("materials/" + id).update(patch), message);
  materialWrites.delete(id);
  const current = find(id);
  if (current) Object.assign(current, ok ? patch : before);
  renderAll();
}
/* Estrela que salta ao favoritar: quem for redesenhado durante o salto continua do ponto em que está. */
export const pop = { id: "", at: 0, ms: 280 };
export const popping = id => pop.id === id && performance.now() - pop.at < pop.ms;
export async function toggleFav(id) {
  const m = find(id); if (!m) return;
  const on = !m.favorite;
  if (on) { pop.id = id; pop.at = performance.now(); setTimeout(() => { if (pop.id === id) pop.id = ""; }, pop.ms * 2); }
  await updateMaterial(id, { favorite: on }, on ? "Adicionado aos favoritos" : "Removido dos favoritos");
}
export async function setStatus(id, s) {
  const m = find(id); if (!m || (m.status || "nao-iniciado") === s) return;
  await updateMaterial(id, { status: s, statusAt: nowIso() }, "Situação: " + STATUS_LABEL[s]);
}
export function markOpened(id) { if (S.db) S.db.doc("materials/" + id).update({ lastOpenedAt: nowIso() }).catch(e => console.error(e)); }
export async function removeMaterial(id) {
  const m = find(id); if (!m) return false; const { id: _id, ...body } = m;
  return write(() => S.db.doc("materials/" + id).delete(), "Removido do catálogo. O arquivo original não foi alterado.",
    { action: { label: "Desfazer", run: () => write(() => S.db.doc("materials/" + id).set(body), "Material restaurado") } });
}
export async function ensureCollection(name) {
  const n = name.trim(); if (!n) return "";
  const hit = S.collections.find(c => norm(c.name) === norm(n)); if (hit) return hit.id;
  const ref = S.db.collection("collections").doc(); await ref.set({ name: n, createdAt: nowIso() }); return ref.id;
}

export async function addArea(parentId, name) {
  name = name.trim(); if (!name) return false;
  if (childrenOf(parentId).some(a => norm(a.name) === norm(name))) { toast("Já existe um item com esse nome aqui.", { error: true }); return false; }
  const d = parentId ? depthOf(parentId) + 1 : 0;
  const used = S.areas.map(a => a.stain).filter(Boolean);
  const stain = d === 0 ? "" : STAINS.find(s => !used.includes(s)) || STAINS[S.areas.length % STAINS.length];
  return write(() => S.db.collection("areas").doc().set({ name, parentId: parentId || "", order: childrenOf(parentId).length + 1, stain, createdAt: nowIso() }), ["Módulo criado", "Unidade criada", "Matéria criada"][Math.min(d, 2)]);
}
export async function renameArea(id, name) {
  name = name.trim(); const a = areaById(id); if (!name || !a) return false;
  if (childrenOf(a.parentId).some(x => x.id !== id && norm(x.name) === norm(name))) { toast("Já existe um item com esse nome aqui.", { error: true }); return false; }
  return write(() => S.db.doc("areas/" + id).update({ name }), "Nome atualizado");
}
export async function deleteArea(id) {
  const a = areaById(id); if (!a) return false;
  const affected = S.materials.filter(m => m.areaId === id);
  return write(async () => {
    for (const m of affected) await S.db.doc("materials/" + m.id).update({ areaId: a.parentId || "" });
    await S.db.doc("areas/" + id).delete();
  }, `“${a.name}” excluído`);
}
export async function addColl(name) {
  name = name.trim(); if (!name) return false;
  if (S.collections.some(c => norm(c.name) === norm(name))) { toast("Já existe uma coleção com esse nome.", { error: true }); return false; }
  return write(() => S.db.collection("collections").doc().set({ name, createdAt: nowIso() }), "Coleção criada");
}
export async function renameColl(id, name) {
  name = name.trim(); if (!name) return false;
  if (S.collections.some(c => c.id !== id && norm(c.name) === norm(name))) { toast("Já existe uma coleção com esse nome.", { error: true }); return false; }
  return write(() => S.db.doc("collections/" + id).update({ name }), "Nome atualizado");
}
export async function deleteColl(id, name) {
  const affected = S.materials.filter(m => (m.collectionIds || []).includes(id));
  const ok = await write(async () => {
    for (const m of affected) await S.db.doc("materials/" + m.id).update({ collectionIds: (m.collectionIds || []).filter(c => c !== id) });
    await S.db.doc("collections/" + id).delete();
  }, `Coleção “${name}” excluída`);
  if (ok && S.f.coll === id) S.f = { ...S.f, coll: "" };
  return ok;
}
