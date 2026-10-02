/* Aparência: Sistema, Claro ou Escuro. O bootstrap síncrono no <head> (window.aortaTheme) evita piscar o tema;
   aqui só ligamos o diálogo e avisamos quem desenha com as cores do tema (o coração). */
import { $ } from "../core/dom.js";
import { openDlg } from "./dialogs.js";

const listeners = new Set();
export const onThemeChange = fn => listeners.add(fn);
const notify = () => listeners.forEach(fn => fn());

export function wireTheme() {
  const theme = window.aortaTheme;
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => requestAnimationFrame(notify));
  $("#theme-open").addEventListener("click", () => { theme.sync(); openDlg($("#dlg-theme")); });
  $("#dlg-theme").addEventListener("change", e => {
    if (!e.target.matches('input[name="theme"]')) return;
    const requested = e.target.value;
    theme.set(requested);
    $("#theme-note").textContent = document.documentElement.dataset.themePreference !== requested
      ? "Não foi possível salvar a preferência. Usando o tema do sistema." : "Sistema acompanha a aparência do dispositivo.";
    requestAnimationFrame(notify);
  });
  theme.sync();
}
