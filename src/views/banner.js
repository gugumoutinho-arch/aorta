/* Estados do catálogo: carregando, entrar, e-mail sem acesso, banco fora do ar. */
import { S, ready } from "../core/state.js";
import { $, h } from "../core/dom.js";
import { signOut, sendLoginLink, verifyCode } from "../core/db.js";

function loginPanel() {
  const email = h("input", { type: "email", id: "login-email", autocomplete: "email", inputmode: "email", autocapitalize: "none", required: true, placeholder: "seu e-mail" });
  const code = h("input", { type: "text", id: "login-code", inputmode: "numeric", autocomplete: "one-time-code", maxlength: "10", placeholder: "código do e-mail" });
  const msg = h("p", { class: "small muted", role: "status" });
  const step2 = h("form", { class: "inline-form", hidden: true, onsubmit: async e => {
    e.preventDefault(); if (!code.value.trim()) return;
    const { error } = await verifyCode(email.value.trim(), code.value.trim());
    if (error) msg.textContent = "Código inválido ou vencido. Peça um novo link."; else location.reload();
  } }, h("label", { class: "sr", for: "login-code", text: "Código recebido por e-mail" }), code, h("button", { class: "btn primary", type: "submit", text: "Entrar" }));
  const step1 = h("form", { class: "inline-form", onsubmit: async e => {
    e.preventDefault(); const v = email.value.trim(); if (!v) { email.focus(); return; }
    msg.textContent = "Enviando…";
    const { error } = await sendLoginLink(v);
    if (error) { msg.textContent = "Não foi possível enviar agora. Confira o e-mail e tente de novo em um minuto."; return; }
    msg.textContent = `Enviamos um link de acesso para ${v}. Abra o link neste mesmo navegador. Se o e-mail trouxer um código, digite-o abaixo.`;
    step2.hidden = false;
  } }, h("label", { class: "sr", for: "login-email", text: "E-mail" }), email, h("button", { class: "btn primary", type: "submit", text: "Enviar link" }));
  return h("div", { class: "notice login" }, h("h2", { text: "Entrar no Aorta" }),
    h("p", { class: "muted", text: "Por enquanto o catálogo é privado: só os e-mails do dono têm acesso. Você entra sem senha, por um link enviado ao e-mail." }), step1, step2, msg);
}
const notice = (title, text, button) => h("div", { class: "notice error", role: "alert" }, h("h2", { text: title }), h("p", { text }), button);

export function renderBanner() {
  const b = $("#state-banner");
  if (S.dbState === "login") { if (b.dataset.state !== "login") { b.hidden = false; b.replaceChildren(loginPanel()); } }
  else if (S.dbState === "denied") {
    b.hidden = false;
    b.replaceChildren(notice("Este e-mail não tem acesso", `Você entrou como ${S.user || "um e-mail sem permissão"}, que não é um dos e-mails com acesso a este catálogo.`,
      h("button", { class: "btn", type: "button", text: "Sair e usar outro e-mail", onclick: signOut })));
  } else if (S.dbState === "unavailable") {
    b.hidden = false;
    b.replaceChildren(notice("O acervo não chegou", "O banco de dados não respondeu. Verifique a conexão e tente de novo.",
      h("button", { class: "btn", type: "button", text: "Tentar de novo", onclick: () => location.reload() })));
  } else if (!ready()) { b.hidden = false; b.replaceChildren(h("p", { class: "sr", role: "status", text: "Carregando o acervo…" })); }
  else b.hidden = true;
  b.dataset.state = S.dbState; document.body.dataset.state = S.dbState;
  const acc = $("#account"); acc.hidden = !S.user;
  if (S.user) acc.replaceChildren(`Conectado como ${S.user}. `, h("button", { class: "btn ghost", type: "button", text: "Sair", onclick: signOut }));
}
