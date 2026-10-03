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

/* Cria (ou completa) o material do rascunho, liga os assuntos e marca o rascunho como publicado. */
export async function publishDraft(db, draft, { links, topics, materials, now }) {
  let materialId = draft.materialId;
  if (!materialId) {
    materialId = db.collection("materials").doc().id;
    await updateDraft(db, draft.id, { materialId }, now);
  }
  if (!materials.some(m => m.id === materialId)) {
    const source = draft.source || (isDrive(draft.url) ? "Google Drive" : "");
    await db.doc("materials/" + materialId).set({ title: draft.title.trim(), url: draft.url, areaId: draft.areaId, subject: subjectFor(draft.topicIds, topics, draft.areaId),
      period: draft.year || "", type: draft.type, tags: [], collectionIds: [], source, notes: "", status: "nao-iniciado", favorite: false, createdAt: now });
  }
  await setLinksInArea(db, { material: { id: materialId, areaId: draft.areaId, subject: subjectFor(draft.topicIds, topics, draft.areaId) },
    areaId: draft.areaId, wanted: draft.topicIds, links, topics });
  await updateDraft(db, draft.id, { status: "publicado", materialId, problems: [] }, now);
  return materialId;
}
