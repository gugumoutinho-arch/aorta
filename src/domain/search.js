/* Linhas da busca rápida: caminho curto (unidade › matéria · assunto) e tipo à direita, para cada resultado caber em
   duas linhas no celular. Lógica pura, sem DOM. */
import { topicNorm } from "./topics.js";

const lastTwo = path => path.slice(-2).map(a => a.name).join(" › ");

/* path: áreas da raiz até a matéria; otherAcervo: rótulo do acervo quando o material não é do acervo atual. */
export function materialLine(material, path, { otherAcervo }) {
  const where = path.length ? lastTwo(path) : "Sem área definida";
  const subject = (material.subject || "").trim();
  const sameAsArea = path.length && topicNorm(subject) === topicNorm(path.at(-1).name);
  const sub = [otherAcervo, where, sameAsArea ? "" : subject].filter(Boolean).join(" · ");
  return { sub, right: material.type || "Link" };
}

/* Módulo, unidade ou matéria: o próprio nome em destaque; o caminho acima e a contagem embaixo. */
export function areaLine(path, count) {
  const above = path.slice(0, -1).map(a => a.name).join(" › ");
  return { title: path.at(-1)?.name || "", sub: [above, count].filter(Boolean).join(" · ") };
}

/* Mesma busca = mesma chave: sem acento, sem caixa e com espaços normalizados. */
export const searchKey = q => topicNorm(q);
