/* Escritas da colagem sobre qualquer uma das duas pontas do banco (recebe o banco; sem estado nem tela).
   Publicar é idempotente: o id do material é guardado no rascunho ANTES de criar o material, então repetir depois de
   um erro no meio reaproveita o mesmo material e só completa o que faltou. */
import { draftFromRow } from "../domain/import.js";
import { subjectFor } from "../domain/topic-edit.js";
import { isDrive } from "./text.js";
import { setLinksInArea } from "./topic-store.js";

/* Linhas "criar" viram rascunhos; linhas "ligar" acrescentam os assuntos do caminho ao material que já existe. */
export async function saveImport(db, rows, { links, topics, materials, now }) {
  const saved = { drafts: 0, linked: 0 };
  for (const row of rows) {
    if (row.action === "criar") {
      await db.collection("material_drafts").doc().set(draftFromRow(row, now));
      saved.drafts++;
    } else if (row.action === "ligar" && row.duplicate?.kind === "material") {
      await linkMore(db, row.duplicate.id, row.topicIds, { links, topics, materials });
      saved.linked++;
    }
  }
  return saved;
}

/* Acrescenta os assuntos do caminho (todos de uma matéria) ao material já publicado, sem tirar nenhum. */
async function linkMore(db, materialId, topicIds, { links, topics, materials }) {
  const material = materials.find(x => x.id === materialId), areaId = topics.find(t => t.id === topicIds[0])?.areaId;
  if (!material || !areaId) return;
  const inArea = new Set(topics.filter(t => t.areaId === areaId).map(t => t.id));
  const current = links.filter(l => l.materialId === materialId && inArea.has(l.topicId)).map(l => l.topicId);
  await setLinksInArea(db, { material, areaId, wanted: [...new Set([...current, ...topicIds])], links, topics });
}

export const updateDraft = (db, id, patch, now) => db.doc("material_drafts/" + id).update({ ...patch, updatedAt: now });

/* Id do material de um rascunho: o já reservado nele, ou o id do próprio rascunho. Assim dois clientes (ou duas
   tentativas) publicando o mesmo rascunho chegam ao MESMO material, sem depender de quem gravou primeiro. */
export const materialIdFor = draft => draft.materialId || draft.id;

/* Cria (ou completa) o material do rascunho, liga os assuntos e só então marca o rascunho como publicado.
   Cada passo pode ser repetido: o id vem do rascunho e é guardado antes; o material é criado só se ainda não existe
   (nunca sobrescreve ao retomar); as ligações são upsert; depois de qualquer erro, o estado é conferido no banco. */
export async function publishDraft(db, draft, { links, topics, now }) {
  const materialId = materialIdFor(draft);
  const ref = db.doc("material_drafts/" + draft.id), current = await ref.get();
  if (!current.exists) throw new Error("Este rascunho não existe mais.");
  if (current.data().status === "publicado") return current.data().materialId || materialId;
  if (current.data().status === "ignorado") throw new Error("Este rascunho foi ignorado; nada foi publicado.");
  if (!current.data().materialId) await updateDraft(db, draft.id, { materialId }, now);
  const subject = subjectFor(draft.topicIds, topics, draft.areaId);
  const source = draft.source || (isDrive(draft.url) ? "Google Drive" : "");
  await db.doc("materials/" + materialId).create({ title: draft.title.trim(), url: draft.url, areaId: draft.areaId, subject,
    period: draft.year || "", type: draft.type, tags: [], collectionIds: [], source, notes: "", status: "nao-iniciado", favorite: false, createdAt: now });
  if (!(await db.doc("materials/" + materialId).get()).exists) throw new Error("O material não foi criado; tente de novo.");
  await setLinksInArea(db, { material: { id: materialId, areaId: draft.areaId, subject }, areaId: draft.areaId, wanted: draft.topicIds, links, topics });
  await updateDraft(db, draft.id, { status: "publicado", materialId, problems: [] }, now);
  return materialId;
}
