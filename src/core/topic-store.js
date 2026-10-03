/* Escritas de assuntos e ligações sobre qualquer uma das duas pontas do banco (recebe o banco; sem estado nem tela).
   As mensagens, o Desfazer e o estado da página ficam em topic-actions.js. */
import { linkDiff, linkId } from "../domain/topic-edit.js";
import { nowIso } from "./text.js";

const linkRef = (db, materialId, topicId) => db.doc("material_topics/" + linkId(materialId, topicId));

/* Liga o material exatamente aos assuntos "wanted": insere só os que faltam e depois remove os que saíram. */
export async function saveMaterialTopics(db, { materialId, wanted, links }) {
  const current = links.filter(l => l.materialId === materialId).map(l => l.topicId);
  const diff = linkDiff(current, wanted);
  for (const topicId of diff.add) await linkRef(db, materialId, topicId).set({ materialId, topicId });
  for (const topicId of diff.remove) await linkRef(db, materialId, topicId).delete();
  return diff;
}

/* Devolve ligações guardadas antes de remover o material (o banco as apaga em cascata junto com ele). */
export async function restoreLinks(db, links) {
  for (const { materialId, topicId } of links) await linkRef(db, materialId, topicId).set({ materialId, topicId });
}

/* Grava um assunto já calculado por planTopic e devolve o assunto com o id. */
export async function insertTopic(db, fields) {
  const ref = db.collection("topics").doc();
  const topic = { ...fields, createdAt: nowIso() };
  await ref.set(topic);
  return { id: ref.id, ...topic };
}
