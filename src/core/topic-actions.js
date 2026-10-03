/* Assuntos e ligações material ↔ assunto, com o estado da página e os avisos (as escritas em si ficam em topic-store.js). */
import { S, find } from "./state.js";
import { planTopic, subjectFor } from "../domain/topic-edit.js";
import { saveMaterialTopics, insertTopic } from "./topic-store.js";
import { toast } from "../ui/toast.js";
import { write } from "./actions.js";

/* Cria o assunto na matéria (ou devolve o de mesmo nome) e já o põe na página, sem esperar o banco avisar. */
export async function createTopic(areaId, name) {
  const plan = planTopic(areaId, name, S.topics);
  if (plan.error) { toast(plan.error, { error: true }); return null; }
  if (plan.existing) return plan.existing;
  let topic = null;
  const ok = await write(async () => { topic = await insertTopic(S.db, plan.fields); }, `Assunto “${plan.fields.name}” criado`);
  if (!ok || !topic) return null;
  if (!S.topics.some(t => t.id === topic.id)) S.topics = [...S.topics, topic];
  return topic;
}

/* Deixa o material ligado exatamente a estes assuntos e mantém o texto antigo (subject) = primeiro assunto ligado. */
export async function setMaterialTopics(materialId, topicIds, okMsg) {
  const wanted = [...new Set(topicIds)];
  return write(async () => {
    await saveMaterialTopics(S.db, { materialId, wanted, links: S.links });
    S.links = [...S.links.filter(l => l.materialId !== materialId), ...wanted.map(topicId => ({ materialId, topicId }))];
    const subject = subjectFor(wanted, S.topics), m = find(materialId);
    if (m && (m.subject || "") !== subject) await S.db.doc("materials/" + materialId).update({ subject });
  }, okMsg);
}
