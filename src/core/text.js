import { h } from "./dom.js";

export const norm = s => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
export const tokens = q => norm(q).split(/\s+/).filter(Boolean);
export const cmpName = (a, b) => String(a).localeCompare(String(b), "pt-BR", { sensitivity: "base", numeric: true });
export const validDate = iso => !!iso && !isNaN(new Date(iso));
export const fmtDate = iso => validDate(iso) ? new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }) : "";
export const plural = (n, a, b) => `${n} ${n === 1 ? a : b}`;
export const nowIso = () => new Date().toISOString();
export const pad2 = n => String(n).padStart(2, "0");

export function validUrl(v) {
  try { const u = new URL(String(v).trim()); return (u.protocol === "https:" || u.protocol === "http:") && u.hostname.includes("."); }
  catch (_) { return false; }
}
export const isDrive = v => { try { return /(^|\.)(drive|docs)\.google\.com$/.test(new URL(v).hostname); } catch (_) { return false; } };

/* Ordem do curso para assuntos: "1ª semana" antes de "1ª e 2ª semanas", que vem antes de "2ª semana"; depois, alfabética. */
const ordKey = s => { const n = [...String(s || "").matchAll(/(\d+)\s*[ªº°]/g)].map(x => +x[1]); return n.length ? n[0] * 100 + (n[n.length - 1] - n[0]) : 1e6; };
export const byKey = (a, b) => (a === "") - (b === "") || ordKey(a) - ordKey(b) || cmpName(a, b);

/* Grifo: marca no texto original os trechos que combinam com a busca, ignorando acentos e maiúsculas. */
export function marked(text, toks) {
  const s = String(text || "");
  if (!toks || !toks.length || !s) return [s];
  let flat = ""; const at = [];
  for (let i = 0; i < s.length; i++) for (const ch of s[i].normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()) { flat += ch; at.push(i); }
  const hit = new Array(s.length).fill(false);
  for (const t of toks) { let p = flat.indexOf(t); while (p !== -1) { for (let k = p; k < p + t.length; k++) hit[at[k]] = true; p = flat.indexOf(t, p + t.length); } }
  const out = []; let i = 0;
  while (i < s.length) { let j = i; while (j < s.length && hit[j] === hit[i]) j++; out.push(hit[i] ? h("mark", { class: "hit", text: s.slice(i, j) }) : s.slice(i, j)); i = j; }
  return out;
}
