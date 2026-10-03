/* Estado único da página e constantes do catálogo. */
export const TYPES = ["Slides", "Apostila", "Resumo", "Anotação", "Estudo dirigido", "Questões", "Prova", "Monitoria", "Caso clínico", "Imagem / lâmina", "Artigo", "Livro", "Link"];
export const STATUS = [["nao-iniciado", "Não iniciado"], ["em-estudo", "Em estudo"], ["revisado", "Revisado"]];
export const STATUS_LABEL = Object.fromEntries(STATUS);
export const STAINS = ["hema", "eosin", "giemsa", "masson", "pas", "safra"];
export const LEVEL = ["Módulo", "Unidade", "Matéria"];
export const SORTS = ["recent", "old", "az", "za"];
export const IN_PRODUCTION = "Em produção";
export const EMPTY_FILTERS = Object.freeze({ type: "", status: "", coll: "", fav: false });

/* Dois acervos: o do curso da IDOMED (módulos M1–M8) e o de medicina em geral (disciplinas: livros de referência,
   materiais próprios e materiais conhecidos da internet). A área raiz diz a que acervo pertence (campo "acervo";
   sem o campo, é IDOMED — tudo o que já existia continua onde estava). */
export const ACERVOS = {
  idomed: { label: "IDOMED", long: "Acervo IDOMED", unit: "módulo", units: "módulos", mapTitle: "Mapa do curso", indexTitle: "Módulos do curso" },
  geral: { label: "Medicina geral", long: "Medicina geral", unit: "disciplina", units: "disciplinas", mapTitle: "Mapa das disciplinas", indexTitle: "Disciplinas" },
};
/* Protótipo v4: o mesmo site em três conceitos visuais, para o dono comparar (?conceito=coracao | folha | corpo). */
export const CONCEPTS = ["coracao", "folha", "corpo"];
let savedAcervo = "idomed";
try { savedAcervo = localStorage.getItem("aorta-acervo") || "idomed"; } catch (_) { /* sem armazenamento */ }

export const S = {
  acervo: ACERVOS[savedAcervo] ? savedAcervo : "idomed",
  concept: savedAcervo === "geral" ? "corpo" : "coracao",
  db: null, dbState: "loading", user: "", sb: null,
  materials: [], areas: [], collections: [],
  /* assuntos da matéria e ligações material ↔ assunto; vazios quando o banco ainda não tem as tabelas */
  topics: [], links: [],
  /* t = assuntos, l = ligações; topicsOff = tabelas ausentes ou falha antes de carregar (segue sem abas) */
  got: { m: false, a: false, c: false, t: false, l: false }, topicsOff: false,
  view: "inicio", pendingArea: "", pendingTab: "", acervoSwitched: false,
  /* página de módulo: escopo (id do módulo ou "todos"), unidade, matéria e aba de assunto ("" = Todos) */
  scope: "", unit: "", subject: "", tab: "",
  q: "", f: { ...EMPTY_FILTERS }, sort: "recent",
  detailId: null, editId: null, busy: false,
};

try {
  const p = JSON.parse(localStorage.getItem("bm-prefs") || "{}");
  if (SORTS.includes(p.sort)) S.sort = p.sort;
} catch (_) { /* preferências são opcionais */ }
export const savePrefs = () => { try { localStorage.setItem("bm-prefs", JSON.stringify({ sort: S.sort })); } catch (_) { /* sem armazenamento: segue sem lembrar */ } };

export const remember = (key, value) => { try { localStorage.setItem(key, value); } catch (_) { /* sem armazenamento */ } };
export const ready = () => S.dbState === "ready" && S.got.m && S.got.a && S.got.c;
/* Assuntos e ligações chegaram (ou ficou decidido seguir sem eles). */
export const topicsReady = () => S.got.t && S.got.l;
export const find = id => S.materials.find(m => m.id === id);
export const collName = id => (S.collections.find(c => c.id === id) || {}).name || "";
export const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
