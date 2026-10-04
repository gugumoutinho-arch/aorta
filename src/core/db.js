/* Banco: duas pontas com a mesma interface (collection/doc/list/onSnapshot e get/set/create/update/delete).
   - window.claude.use("db"): usada pelos testes em tools/, com dados fictícios.
   - Supabase: o site publicado. A chave abaixo é a chave PÚBLICA do projeto; o acesso aos dados é protegido
     pelas regras do banco (RLS: só os e-mails do dono leem e gravam). Nunca coloque aqui a chave secreta do servidor. */
import { S } from "./state.js";
import { fetchAll } from "../domain/pagination.js";
import { linkId, parseLinkId } from "../domain/topic-edit.js";
import { COLS, KEYS } from "./schema.js";

const SUPA = { url: "https://rmqfduksayyplucshqea.supabase.co", key: "sb_publishable_EG4jEqDNIiD_-ow5L4qh8w_XkUG7eDZ" };
const toCol = k => k === "order" ? "sort_order" : k.replace(/[A-Z]/g, c => "_" + c.toLowerCase());
const toKey = c => c === "sort_order" ? "order" : c.replace(/_([a-z])/g, (_, x) => x.toUpperCase());
function rowOut(table, obj) { const r = {}; for (const k of COLS[table]) if (k in obj) r[toCol(k)] = /At$/.test(k) && !obj[k] ? null : obj[k]; return r; }
function rowIn(r) { const o = {}; for (const [c, v] of Object.entries(r)) if (c !== "id") o[toKey(c)] = v == null && c.endsWith("_at") ? "" : v; return o; }

/* Tabelas sem coluna id (material_topics): o id do site é linkId(material, assunto) e o SQL só vê as duas colunas. */
const keyCols = table => KEYS[table]?.map(toCol);
function keyOf(table, id) {
  const parts = parseLinkId(id);
  if (!parts) throw new Error(`Chave de ${table} inválida.`);
  return [[keyCols(table)[0], parts.materialId], [keyCols(table)[1], parts.topicId]];
}
const idOf = (table, r) => KEYS[table] ? linkId(r[keyCols(table)[0]], r[keyCols(table)[1]]) : r.id;
const byKey = (q, table, id) => KEYS[table] ? keyOf(table, id).reduce((x, [c, v]) => x.eq(c, v), q) : q.eq("id", id);
const docOf = (table, r) => ({ id: idOf(table, r), exists: true, data: () => rowIn(r) });
export function supaDb(sb) {
  const listeners = {}, seq = {};
  const page = table => (from, to) => (keyCols(table) || ["id"]).reduce((q, c) => q.order(c), sb.from(table).select("*")).range(from, to);
  const refresh = async table => {
    const mine = seq[table] = (seq[table] || 0) + 1;
    let data = null, error = null;
    try { data = await fetchAll(page(table)); } catch (e) { error = e; }
    if (mine !== seq[table]) return; // um pedido mais novo já está a caminho: este resultado é velho
    for (const l of listeners[table] || []) error ? l.err && l.err(error) : l.next({ docs: data.map(r => docOf(table, r)) });
  };
  const check = ({ error }) => { if (error) throw error; };
  const row = (table, id, obj) => KEYS[table] ? { ...rowOut(table, obj), ...Object.fromEntries(keyOf(table, id)) } : { id, ...rowOut(table, obj) };
  const conflict = table => (keyCols(table) || ["id"]).join(",");
  // Ligação já existente é mantida como está (o upsert da dupla não tem o que atualizar).
  const upsert = (table, id, obj) => KEYS[table]
    ? sb.from(table).upsert(row(table, id, obj), { onConflict: conflict(table), ignoreDuplicates: true })
    : sb.from(table).upsert(row(table, id, obj));
  const ref = (table, id) => ({ id,
    async get() { const { data, error } = await byKey(sb.from(table).select("*"), table, id).maybeSingle(); if (error) throw error; return data ? docOf(table, data) : { id, exists: false, data: () => undefined }; },
    async set(obj) { check(await upsert(table, id, obj)); refresh(table); },
    /* Cria só se ainda não existe: nunca sobrescreve (retomar uma gravação não apaga o que já estava lá). */
    async create(obj) { check(await sb.from(table).upsert(row(table, id, obj), { onConflict: conflict(table), ignoreDuplicates: true })); refresh(table); },
    async update(obj) {
      if (KEYS[table]) throw new Error("Uma ligação não se altera: apague e crie outra.");
      check(await byKey(sb.from(table).update(rowOut(table, obj)), table, id)); refresh(table);
    },
    async delete() { check(await byKey(sb.from(table).delete(), table, id)); refresh(table); } });
  return {
    doc: path => { const [table, id] = path.split("/"); return ref(table, id); },
    collection: table => ({
      doc: id => ref(table, id || crypto.randomUUID()),
      async list() { return (await fetchAll(page(table))).map(r => docOf(table, r)); },
      onSnapshot(next, err) {
        (listeners[table] ||= []).push({ next, err }); refresh(table);
        sb.channel("bm-" + table).on("postgres_changes", { event: "*", schema: "public", table }, () => refresh(table)).subscribe();
      } }),
  };
}

/* Devolve o banco pronto, ou null quando falta login / o e-mail não tem acesso (S.dbState diz qual). */
export async function startSupabase() {
  const { createClient } = await import("@supabase/supabase-js");
  const sb = createClient(SUPA.url, SUPA.key, { auth: { flowType: "pkce", persistSession: true, detectSessionInUrl: true } });
  S.sb = sb;
  const { data } = await sb.auth.getSession();
  if (/[?&]code=/.test(location.search)) history.replaceState(null, "", location.pathname + location.hash);
  if (!data.session) { S.dbState = "login"; return null; }
  S.user = data.session.user.email || "";
  const { data: allowed, error } = await sb.rpc("sou_bibliotecaria");
  if (error) throw error;
  if (!allowed) { S.dbState = "denied"; return null; }
  return supaDb(sb);
}
/* A ponta de testes só vale quando o banco fictício se identifica (tools/harness.mjs); qualquer outro window.claude é ignorado. */
export async function openDb() {
  if (window.claude?.aortaTest === true && typeof window.claude.use === "function") return window.claude.use("db");
  return startSupabase();
}
export async function signOut() { if (S.sb) await S.sb.auth.signOut(); location.reload(); }
export async function sendLoginLink(email) {
  return S.sb.auth.signInWithOtp({ email, options: { emailRedirectTo: location.origin + location.pathname } });
}
export async function verifyCode(email, token) { return S.sb.auth.verifyOtp({ email, token, type: "email" }); }
