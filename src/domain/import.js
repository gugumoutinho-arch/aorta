/* Importação por colagem (Organizar › Colar links): lê as linhas, reconhece links do Drive, acha matéria e assunto
   pelo caminho e marca duplicatas e pendências. Lógica pura: nada lê o conteúdo do Drive nem muda permissões, e nenhum
   campo vazio é preenchido com valor inventado (vira pendência). */
import { topicNorm } from "./topics.js";

export const MAX_ROWS = 100;
export const HEADER = ["url", "caminho", "tipo", "titulo", "fonte", "ano", "direitos"];
export const RIGHTS = ["proprio", "autorizado", "licenca-aberta", "publico", "pendente"];
/* Decisão do dono: os materiais dele são públicos; dá para mudar no lote ou em cada rascunho. */
export const DEFAULT_RIGHTS = "publico";

/* Texto de cada pendência, para a tela. */
export const PROBLEM_TEXT = {
  "sem-titulo": "Falta o título.",
  "sem-tipo": "Falta o tipo.",
  "tipo-desconhecido": "Tipo fora da lista; escolha um.",
  "sem-materia": "Falta escolher a matéria.",
  "caminho-desconhecido": "Caminho não encontrado na estrutura do curso; escolha a matéria. Nada é criado sozinho.",
  "caminho-ambiguo": "Mais de um destino com esse caminho; escolha qual aqui ou depois, no rascunho.",
  "assunto-desconhecido": "Assunto do caminho não existe nesta matéria; escolha ou crie no rascunho.",
  "ano-invalido": "Ano precisa ter 4 dígitos (ex.: 2026).",
  "direitos-pendentes": "Defina os direitos de uso.",
  "livro-no-drive": "Livro deve apontar para editora ou biblioteca, não para PDF no Drive. Ignore este rascunho e cole o link da editora.",
  "ja-no-catalogo": "Este arquivo já está no catálogo. Ignore este rascunho.",
};

const clean = v => String(v ?? "").replace(/[\u0000-\u001f\u007f]/g, "").trim();
const parseUrl = v => { try { return new URL(v); } catch (_) { return null; } };
/* Só os hosts exatos do Google Drive e do Google Docs (nada de subdomínio ou domínio parecido). */
const DRIVE_HOSTS = ["drive.google.com", "docs.google.com"];
const isGoogle = host => DRIVE_HOSTS.includes(String(host).toLowerCase());

/* ID do arquivo do Drive (/file/d/<id>/, /document/d/<id>/…, open?id=, uc?id=), resourcekey e se é pasta. */
export function driveInfo(raw) {
  const u = parseUrl(raw), none = { fileId: "", resourceKey: "", folder: false };
  if (!u || !isGoogle(u.hostname.toLowerCase())) return none;
  const resourceKey = u.searchParams.get("resourcekey") || "";
  if (/\/folders\//.test(u.pathname)) return { ...none, folder: true };
  const byPath = u.pathname.match(/\/d\/([\w-]+)/);
  const byQuery = /^\/(open|uc)$/.test(u.pathname) ? u.searchParams.get("id") : "";
  return { fileId: (byPath && byPath[1]) || byQuery || "", resourceKey, folder: false };
}

/* Para comparar URLs: host em minúsculas, sem "#", sem "usp" (rastreio do Drive) e sem barra final. */
export function normalizeUrl(raw) {
  const u = parseUrl(raw); if (!u) return clean(raw);
  u.hash = ""; u.hostname = u.hostname.toLowerCase(); u.searchParams.delete("usp");
  const path = u.pathname.replace(/\/+$/, "");
  return `${u.protocol}//${u.host}${path}${u.searchParams.toString() ? "?" + u.searchParams : ""}`;
}

function checkUrl(url) {
  if (!url) return "Linha sem link.";
  const u = parseUrl(url);
  if (!u || !u.hostname.includes(".")) return "Isto não parece um link. Cole o endereço completo, começando com https://.";
  if (u.username || u.password) return "Link com usuário ou senha embutidos não é aceito. Copie o link de compartilhamento do arquivo.";
  if (u.protocol !== "https:") return "Só links https:// são aceitos.";
  if (driveInfo(url).folder) return "Link de pasta do Drive: cole os links dos arquivos, um por linha.";
  return "";
}

/* Lê o texto colado: só URLs, ou TSV com o cabeçalho de HEADER (inteiro ou só as primeiras colunas). Mais de MAX_ROWS linhas recusa o lote inteiro. */
export function parsePaste(text) {
  const lines = String(text ?? "").split(/\r?\n/).map((raw, i) => ({ raw, line: i + 1 })).filter(l => l.raw.trim());
  const head = lines[0] && lines[0].raw.split("\t").map(c => topicNorm(c));
  // Cabeçalho: as colunas de HEADER na ordem, podendo parar antes (ex.: só "url, caminho, tipo, titulo").
  const tsv = !!head && head.filter(Boolean).length > 1 && head.every((c, i) => !c || c === HEADER[i]) && head[0] === "url";
  // Cabeçalho digitado com vírgulas: as colunas só se separam por tabulação, que é o que vem ao copiar da planilha.
  const commaHead = !tsv && lines[0] && lines[0].raw.split(",").map(c => topicNorm(c));
  if (commaHead && commaHead.length > 1 && commaHead[0] === "url" && commaHead.every((c, i) => !c || c === HEADER[i])) {
    return { error: "O cabeçalho veio separado por vírgulas. Copie as colunas direto da planilha (elas vão separadas por tabulação) ou cole só os links, um por linha.", rows: [] };
  }
  const body = tsv ? lines.slice(1) : lines;
  if (body.length > MAX_ROWS) return { error: `Máximo de ${MAX_ROWS} linhas por vez; este lote tem ${body.length}. Divida em partes.`, rows: [] };
  const rows = body.map(({ raw, line }) => {
    const cells = raw.split("\t").map(clean);
    const [url, path = "", type = "", title = "", source = "", year = "", rights = ""] = tsv ? cells : [clean(raw)];
    const commaRow = !tsv && cells.length === 1 && /^https?:\/\/\S+,\s/.test(raw.trim())
      ? "Linha com vírgula depois do link: cole só o link, ou copie as colunas direto da planilha (separadas por tabulação)." : "";
    const columnsError = commaRow || (!tsv && cells.length > 1 ? "Linha com colunas, mas sem o cabeçalho (url, caminho, tipo, titulo, fonte, ano, direitos)." : "");
    const error = columnsError || checkUrl(url);
    const { fileId, resourceKey } = error ? { fileId: "", resourceKey: "" } : driveInfo(url);
    return { line, url, path, type, title, source, year, rights, driveFileId: fileId, resourceKey, errors: error ? [error] : [] };
  });
  return { rows };
}

/* ---------- caminho → matéria e assunto ---------- */
const kids = (areas, pid) => areas.filter(a => (a.parentId || "") === (pid || ""));
const depth = (areas, id) => { let d = -1, a = areas.find(x => x.id === id), guard = 0; while (a && guard++ < 8) { d++; a = areas.find(x => x.id === a.parentId); } return d; };
/* Lugar de material: matéria (3º nível) ou área sem subdivisões (ex.: disciplina de medicina geral). */
export const isPlace = (areas, id) => !!id && areas.some(a => a.id === id) && (depth(areas, id) === 2 || !kids(areas, id).length);
const sameName = (a, seg) => topicNorm(a.name) === seg || (a.short && topicNorm(a.short) === seg);

/* Segue o caminho segmento a segmento, sempre dentro do pai. Nomes iguais no mesmo nível abrem um ramo cada. */
function walk(areas, topics, level, segs, names) {
  if (!segs.length) return [{ areaId: "", topicIds: [], names, problems: ["sem-materia"] }];
  const hits = level.filter(a => sameName(a, segs[0]));
  if (!hits.length) return [{ areaId: "", topicIds: [], names, problems: ["caminho-desconhecido", "sem-materia"] }];
  return hits.flatMap(hit => {
    const nm = [...names, hit.name], rest = segs.slice(1);
    return isPlace(areas, hit.id) ? [finish(areas, hit, rest, nm, topics)] : walk(areas, topics, kids(areas, hit.id), rest, nm);
  });
}
function finish(areas, area, segs, names, topics) {
  if (!segs.length) return { areaId: area.id, topicIds: [], names, problems: [] };
  const topic = topics.find(t => t.areaId === area.id && topicNorm(t.name) === segs[0]);
  // Assunto que falta só numa matéria de verdade; depois de uma unidade sem matérias, o caminho é que não existe.
  if (!topic && depth(areas, area.id) !== 2) return { areaId: "", topicIds: [], names, problems: ["caminho-desconhecido", "sem-materia"] };
  if (!topic) return { areaId: area.id, topicIds: [], names, problems: ["assunto-desconhecido"] };
  return { areaId: area.id, topicIds: [topic.id], names: [...names, topic.name], problems: segs.length > 1 ? ["caminho-desconhecido"] : [] };
}
/* Caminho → matéria e assunto. Nada é criado: desconhecido fica pendente; mais de um destino possível volta como
   "caminho-ambiguo", com os candidatos (destino completo) para a escolha explícita na prévia. */
export function resolvePath(path, areas, topics) {
  let segs = String(path || "").split(/[\\/›]/).map(s => topicNorm(s)).filter(Boolean);
  if (segs[0] === "aorta") segs = segs.slice(1);
  let acervo = "";
  if (segs[0] === "idomed") { acervo = "idomed"; segs = segs.slice(1); }
  else if (segs[0] === "medicina geral") { acervo = "geral"; segs = segs.slice(1); }
  if (!segs.length) return { areaId: "", topicIds: [], names: [], problems: ["sem-materia"], candidates: [] };
  const roots = kids(areas, "").filter(a => !acervo || (a.acervo === "geral" ? "geral" : "idomed") === acervo);
  const found = walk(areas, topics, roots, segs, []), valid = found.filter(r => r.areaId);
  if (found.length === 1) return { ...found[0], candidates: [] };
  // Ramos sem saída não contam: um só destino possível é o destino; nenhum é caminho desconhecido.
  if (valid.length === 1) return { ...valid[0], candidates: [] };
  if (!valid.length) return { areaId: "", topicIds: [], names: [], problems: ["caminho-desconhecido", "sem-materia"], candidates: [] };
  const candidates = valid.map(r => ({ areaId: r.areaId, topicIds: r.topicIds, place: r.names.join(" › "), problems: r.problems }));
  return { areaId: "", topicIds: [], names: [], problems: ["caminho-ambiguo", "sem-materia"], candidates };
}

/* ---------- prévia do lote ---------- */
const keyOf = v => topicNorm(v).replace(/\s+/g, "-");
function pickType(raw, types) {
  if (!raw) return { type: "", problem: "sem-tipo" };
  const hit = types.find(t => topicNorm(t) === topicNorm(raw));
  return hit ? { type: hit, problem: "" } : { type: "", problem: "tipo-desconhecido" };
}
function pickRights(raw, fallback) {
  if (!raw) return { rights: fallback, problem: fallback === "pendente" ? "direitos-pendentes" : "" };
  const k = keyOf(raw);
  return RIGHTS.includes(k) && k !== "pendente" ? { rights: k, problem: "" } : { rights: "pendente", problem: "direitos-pendentes" };
}
const sameFile = (a, b) => (a.driveFileId && a.driveFileId === b.driveFileId) || normalizeUrl(a.url) === normalizeUrl(b.url);
const asDoc = m => ({ url: m.url, driveFileId: m.driveFileId ?? driveInfo(m.url).fileId });

/* Cada linha ganha matéria, assuntos, pendências, duplicata e a ação sugerida: criar (linha nova) ou ignorar (erro ou
   duplicata). canLink diz se a duplicata pode, por escolha explícita, ligar os assuntos do caminho ao material existente. */
export function planImport(rows, { areas, topics, materials = [], drafts = [], types, defaultRights = DEFAULT_RIGHTS }) {
  const seen = [];
  return rows.map(row => {
    if (row.errors.length) return { ...row, areaId: "", topicIds: [], place: "", candidates: [], problems: [], duplicate: null, canLink: false, action: "ignorar" };
    const where = resolvePath(row.path, areas, topics);
    const { type, problem: typeProblem } = pickType(row.type, types);
    const { rights, problem: rightsProblem } = pickRights(row.rights, defaultRights);
    const year = /^\d{4}$/.test(row.year) ? row.year : "";
    const book = type === "Livro" && (row.driveFileId || isGoogle(parseUrl(row.url)?.hostname || ""));
    const problems = [...new Set([...(row.title ? [] : ["sem-titulo"]), ...(typeProblem ? [typeProblem] : []), ...where.problems,
      ...(row.year && !year ? ["ano-invalido"] : []), ...(rightsProblem ? [rightsProblem] : []), ...(book ? ["livro-no-drive"] : [])])];
    const me = { url: row.url, driveFileId: row.driveFileId };
    const mat = materials.find(m => sameFile(me, asDoc(m)));
    const draft = !mat && drafts.find(d => d.status !== "ignorado" && sameFile(me, asDoc(d)));
    const dup = mat ? { kind: "material", id: mat.id, title: mat.title || "" } : draft ? { kind: "rascunho", id: draft.id, title: draft.title || "" }
      : seen.some(s => sameFile(me, s)) ? { kind: "lote", id: "", title: "" } : null;
    seen.push(me);
    // Duplicata nunca vem marcada para mudar o catálogo: ligar ao material já publicado é escolha explícita na linha.
    const canLink = dup?.kind === "material" && where.topicIds.length > 0;
    return { ...row, type, rights, year, areaId: where.areaId, topicIds: where.topicIds, place: where.areaId ? where.names.join(" › ") : "", candidates: where.candidates, problems,
      duplicate: dup, canLink, action: dup ? "ignorar" : "criar" };
  });
}

/* Linha da prévia → rascunho em material_drafts (só o que veio na linha; o resto fica vazio e pendente). */
export function draftFromRow(row, now) {
  const problems = row.problems.filter(p => p !== "ja-no-catalogo");
  return { url: row.url, path: row.path, type: row.type, title: row.title, source: row.source, year: row.year, rights: row.rights,
    areaId: row.areaId, topicIds: [...row.topicIds], driveFileId: row.driveFileId, status: "rascunho", materialId: null, problems,
    createdAt: now, updatedAt: now };
}

/* O que impede publicar o rascunho agora (recalculado dos campos atuais, não das pendências da colagem). */
export function blockers(d, { areas, materials = [], types }) {
  const out = [];
  if (!clean(d.title)) out.push("sem-titulo");
  if (!d.type) out.push("sem-tipo"); else if (types && !types.includes(d.type)) out.push("tipo-desconhecido");
  if (!isPlace(areas, d.areaId)) out.push("sem-materia");
  if (!RIGHTS.includes(d.rights) || d.rights === "pendente") out.push("direitos-pendentes");
  if (d.year && !/^\d{4}$/.test(d.year)) out.push("ano-invalido");
  if (d.type === "Livro" && (d.driveFileId || isGoogle(parseUrl(d.url)?.hostname || ""))) out.push("livro-no-drive");
  // O material deste rascunho (id reservado ou o próprio id do rascunho) não conta como duplicata.
  const own = d.materialId || d.id;
  if (materials.some(m => m.id !== own && sameFile(d, asDoc(m)))) out.push("ja-no-catalogo");
  return out;
}
