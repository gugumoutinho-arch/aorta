/* Banco: duas pontas com a mesma interface (collection/doc/onSnapshot/set/update/delete).
   - window.claude.use("db"): usada pelos testes em tools/, com dados fictícios.
   - Supabase: o site publicado. A chave abaixo é a chave PÚBLICA do projeto; o acesso aos dados é protegido
     pelas regras do banco (RLS: só os e-mails do dono leem e gravam). Nunca coloque aqui a chave secreta do servidor. */
import { S } from "./state.js";

const SUPA = { url: "https://rmqfduksayyplucshqea.supabase.co", key: "sb_publishable_EG4jEqDNIiD_-ow5L4qh8w_XkUG7eDZ" };
const COLS = {
  materials: ["title", "url", "areaId", "subject", "period", "type", "tags", "collectionIds", "source", "notes", "status", "favorite", "createdAt", "lastOpenedAt", "statusAt"],
  areas: ["name", "parentId", "order", "stain", "short", "createdAt"],
  collections: ["name", "createdAt"],
};
const toCol = k => k === "order" ? "sort_order" : k.replace(/[A-Z]/g, c => "_" + c.toLowerCase());
const toKey = c => c === "sort_order" ? "order" : c.replace(/_([a-z])/g, (_, x) => x.toUpperCase());
function rowOut(table, obj) { const r = {}; for (const k of COLS[table]) if (k in obj) r[toCol(k)] = /At$/.test(k) && !obj[k] ? null : obj[k]; return r; }
function rowIn(r) { const o = {}; for (const [c, v] of Object.entries(r)) if (c !== "id") o[toKey(c)] = v == null && c.endsWith("_at") ? "" : v; return o; }

function supaDb(sb) {
  const listeners = {};
  const refresh = async table => {
    const { data, error } = await sb.from(table).select("*");
    for (const l of listeners[table] || []) error ? l.err && l.err(error) : l.next({ docs: data.map(r => ({ id: r.id, data: () => rowIn(r) })) });
  };
  const check = ({ error }) => { if (error) throw error; };
  const ref = (table, id) => ({ id,
    async set(obj) { check(await sb.from(table).upsert({ id, ...rowOut(table, obj) })); refresh(table); },
    async update(obj) { check(await sb.from(table).update(rowOut(table, obj)).eq("id", id)); refresh(table); },
    async delete() { check(await sb.from(table).delete().eq("id", id)); refresh(table); } });
  return {
    doc: path => { const [table, id] = path.split("/"); return ref(table, id); },
    collection: table => ({
      doc: id => ref(table, id || crypto.randomUUID()),
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
