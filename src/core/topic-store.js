/* Escritas de assuntos e ligações sobre qualquer uma das duas pontas do banco (recebe o banco; sem estado nem tela).
   As mensagens, o Desfazer e o estado da página ficam em topic-actions.js. */
import { linkDiff, linkId, planTopic, subjectFor } from "../domain/topic-edit.js";
import { topicNorm } from "../domain/topics.js";

const linkRef = (db, materialId, topicId) => db.doc("material_topics/" + linkId(materialId, topicId));

/* Liga o material exatamente a "wanted" DENTRO da matéria areaId: insere só os que faltam e remove os que saíram.
   Ligações com assuntos de outras matérias (ex.: um caso de Anatomia ligado a Ortopedia) ficam como estão. */
export async function saveMaterialTopics(db, { materialId, areaId, wanted, links, topics }) {
  const inArea = new Set(topics.filter(t => t.areaId === areaId).map(t => t.id));
  const foreign = wanted.filter(id => !inArea.has(id));
  if (foreign.length) throw new Error(`Assunto de outra matéria não entra aqui: ${foreign.join(", ")}.`);
  const current = links.filter(l => l.materialId === materialId && inArea.has(l.topicId)).map(l => l.topicId);
  const diff = linkDiff(current, wanted);
  for (const topicId of diff.add) await linkRef(db, materialId, topicId).set({ materialId, topicId });
  for (const topicId of diff.remove) await linkRef(db, materialId, topicId).delete();
  return diff;
}

/* Liga dentro da matéria areaId e acerta o texto antigo materials.subject = primeiro assunto da matéria PRINCIPAL do
   material (area_id). Material que nunca teve assunto da matéria principal conserva o texto antigo (pode ser livre).
   Devolve as ligações do material depois da gravação, para a página não esperar o banco avisar. */
export async function setLinksInArea(db, { material, areaId, wanted, links, topics }) {
  const diff = await saveMaterialTopics(db, { materialId: material.id, areaId, wanted, links, topics });
  const after = [...links.filter(l => !(l.materialId === material.id && diff.remove.includes(l.topicId))),
    ...diff.add.map(topicId => ({ materialId: material.id, topicId }))];
  const primary = new Set(topics.filter(t => t.areaId === material.areaId).map(t => t.id));
  const had = links.some(l => l.materialId === material.id && primary.has(l.topicId));
  const mine = after.filter(l => l.materialId === material.id).map(l => l.topicId);
  const subject = subjectFor(mine, topics, material.areaId);
  if ((had || subject) && (material.subject || "") !== subject) await db.doc("materials/" + material.id).update({ subject });
  return { diff, links: after, subject };
}

/* Devolve ligações guardadas antes de remover o material (o banco as apaga em cascata junto com ele). */
export async function restoreLinks(db, links) {
  for (const { materialId, topicId } of links) await linkRef(db, materialId, topicId).set({ materialId, topicId });
}

const isUnique = e => e && (e.code === "23505" || /duplicate key/i.test(e.message || ""));
const fresh = async db => (await db.collection("topics").list()).map(d => ({ id: d.id, ...d.data() }));

/* Cria o assunto (ou devolve o de mesmo nome) e só responde depois de CONFIRMAR no banco. Dois clientes com o mesmo
   nome chegam ao mesmo assunto; nomes diferentes que dão o mesmo slug recebem -2, -3…; resposta incerta (erro depois
   de gravar) é conferida relendo a tabela. */
export async function createTopicSafe(db, { areaId, name, topics, now }) {
  let list = topics;
  for (let attempt = 0; attempt < 4; attempt++) {
    const plan = planTopic(areaId, name, list);
    if (plan.error) throw new Error(plan.error);
    if (plan.existing) return plan.existing;
    const ref = db.collection("topics").doc();
    let failure = null;
    try { await ref.create({ ...plan.fields, createdAt: now }); } catch (e) { failure = e; }
    list = await fresh(db);
    const mine = list.find(t => t.id === ref.id);
    if (mine) return mine;
    const same = list.find(t => t.areaId === areaId && topicNorm(t.name) === topicNorm(plan.fields.name));
    if (same) return same;
    if (failure && !isUnique(failure)) throw failure;
  }
  throw new Error("Não foi possível criar o assunto agora (conflito repetido). Tente de novo.");
}
