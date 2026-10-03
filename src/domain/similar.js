/* Quase-duplicatas de assunto dentro da mesma matéria ("Membro sup." × "Membro superior"). Lógica pura.
   Só sugere: quem decide unir ou criar é o editor. Direções anatômicas opostas e números diferentes nunca são parecidos. */

/* Abreviações aprovadas pelo dono; valem só como palavra inteira, com ou sem ponto. Acrescentar aqui, com teste. */
export const ABBREVIATIONS = Object.freeze({ sup: "superior", inf: "inferior", mmss: "membros superiores", mmii: "membros inferiores" });
const ABBR = new RegExp(`\\b(${Object.keys(ABBREVIATIONS).join("|")})\\b\\.?`, "g");
/* Vocabulário explícito de plural → singular (só para sugerir; a unicidade do banco continua sendo topicNorm). */
export const PLURALS = Object.freeze({ membros: "membro", superiores: "superior", inferiores: "inferior", anteriores: "anterior",
  posteriores: "posterior", laterais: "lateral", mediais: "medial", proximais: "proximal", distais: "distal", ossos: "osso", musculos: "musculo" });
/* Conectivos não contam na comparação por palavras ("Cabeça e pescoço" = "Cabeça pescoço"). */
const CONNECTIVES = new Set(["e", "de", "da", "do", "das", "dos", "a", "o", "as", "os", "em", "na", "no"]);
/* Pares de direções opostas, com plural e gênero. */
const DIRECTIONS = {
  sup: /^superior(es)?$/, inf: /^inferior(es)?$/, med: /^medi(al|ais)$/, lat: /^later(al|ais)$/,
  dir: /^direit[oa]s?$/, esq: /^esquerd[oa]s?$/, ant: /^anterior(es)?$/, post: /^posterior(es)?$/,
  prox: /^proxim(al|ais)$/, dist: /^dist(al|ais)$/, cran: /^crani(al|ais)$/, caud: /^caud(al|ais)$/,
};
const OPPOSITES = [["sup", "inf"], ["med", "lat"], ["dir", "esq"], ["ant", "post"], ["prox", "dist"], ["cran", "caud"]];
const NUMBER = /^(\d+[ao]?|i|ii|iii|iv|v|vi|vii|viii|ix|x|xi|xii)$/;

/* NFC, espaços, minúsculas; depois sem acentos, ordinais "ª/º" como letras, abreviações expandidas, sem pontuação e
   plurais do vocabulário no singular. */
export function similarKey(value) {
  return String(value ?? "").normalize("NFC").replace(/\s+/g, " ").trim().toLowerCase()
    .normalize("NFD").replace(/\p{M}/gu, "").replace(/ª/g, "a").replace(/º/g, "o")
    .replace(ABBR, (_, w) => ABBREVIATIONS[w])
    .replace(/[^\p{L}\p{N}]+/gu, " ").trim()
    .split(" ").map(w => PLURALS[w] || w).join(" ");
}

export function levenshtein(a, b) {
  if (a === b) return 0;
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    for (let j = 1; j <= b.length; j++) row[j] = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = row;
  }
  return prev[b.length];
}

const words = key => key.split(" ").filter(Boolean);
const directionsOf = list => new Set(list.flatMap(w => Object.keys(DIRECTIONS).filter(d => DIRECTIONS[d].test(w))));
const numbersOf = list => list.filter(w => NUMBER.test(w)).map(w => w.replace(/[ao]$/, "")).join(" ");

/* Veto: "superior" de um lado e "inferior" do outro (sem o mesmo par dos dois lados), ou números diferentes. */
function vetoed(wa, wb) {
  if (numbersOf(wa) !== numbersOf(wb)) return true;
  const da = directionsOf(wa), db = directionsOf(wb);
  return OPPOSITES.some(([x, y]) => (da.has(x) && db.has(y) && !db.has(x)) || (da.has(y) && db.has(x) && !db.has(y)));
}
function jaccard(wa, wb) {
  const a = new Set(wa.filter(w => !CONNECTIVES.has(w))), b = new Set(wb.filter(w => !CONNECTIVES.has(w)));
  if (!a.size || !b.size) return 0;
  const both = [...a].filter(w => b.has(w)).length;
  return both / (a.size + b.size - both);
}

/* Distância de edição ≤ max(1, 12% do maior) OU Jaccard de palavras ≥ 0,8, salvo veto. Devolve a distância ou null. */
function closeness(ka, kb) {
  if (!ka || !kb) return null;
  const wa = words(ka), wb = words(kb);
  if (vetoed(wa, wb)) return null;
  const d = levenshtein(ka, kb);
  return d <= Math.max(1, 0.12 * Math.max(ka.length, kb.length)) || jaccard(wa, wb) >= 0.8 ? d : null;
}
export const areSimilar = (a, b) => closeness(similarKey(a), similarKey(b)) !== null;

/* Assuntos da mesma matéria parecidos com "name", do mais parecido ao menos. */
export function findSimilar(name, areaId, topics) {
  const key = similarKey(name);
  if (!key) return [];
  return topics.filter(t => t.areaId === areaId)
    .map(t => ({ t, d: closeness(key, similarKey(t.name)) }))
    .filter(x => x.d !== null).sort((x, y) => x.d - y.d).map(x => x.t);
}
