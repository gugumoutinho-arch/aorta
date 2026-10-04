/* Assuntos e ligações material ↔ assunto, com o estado da página e os avisos (as escritas em si ficam em topic-store.js). */
import { S, find } from "./state.js";
import { planTopic } from "../domain/topic-edit.js";
import { setLinksInArea, createTopicSafe } from "./topic-store.js";
import { nowIso } from "./text.js";
import { toast } from "../ui/toast.js";
import { write } from "./actions.js";

/* Cria o assunto na matéria (ou devolve o de mesmo nome) depois de CONFIRMAR no banco, e já o põe na página. */
export async function createTopic(areaId, name) {
  const plan = planTopic(areaId, name, S.topics);
  if (plan.error) { toast(plan.error, { error: true }); return null; }
  if (plan.existing) return plan.existing;
  let topic = null;
  const ok = await write(async () => { topic = await createTopicSafe(S.db, { areaId, name, topics: S.topics, now: nowIso() }); }, `Assunto “${plan.fields.name}” pronto`);
  if (!ok || !topic) return null;
  if (!S.topics.some(t => t.id === topic.id)) S.topics = [...S.topics, topic];
  return topic;
}

/* Deixa o material ligado exatamente a estes assuntos DA MATÉRIA areaId (os de outras matérias ficam) e mantém o texto
   antigo (subject) pelo primeiro assunto da matéria principal do material. */
export async function setMaterialTopics(materialId, areaId, topicIds, okMsg) {
  const material = find(materialId);
  if (!material) return false;
  return write(async () => {
    const r = await setLinksInArea(S.db, { material, areaId, wanted: [...new Set(topicIds)], links: S.links, topics: S.topics });
    S.links = r.links;
  }, okMsg);
}
