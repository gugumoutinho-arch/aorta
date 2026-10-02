import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/home.css";
import "./styles/module.css";
import "./styles/dialogs.css";
import "./styles/organize.css";
import "./styles/proto.css";

import { S, remember } from "./core/state.js";
import { $$ } from "./core/dom.js";
import { concept } from "./views/concept.js";
import { openDb } from "./core/db.js";
import { renderAll, route, subscribe } from "./app.js";
import { wireDialogs } from "./ui/dialogs.js";
import { wireTheme } from "./ui/theme.js";
import { wireHome } from "./views/home.js";
import { wireModule } from "./views/module.js";
import { wireDetail, detailFallbackFocus } from "./views/detail.js";
import { wireForm } from "./views/form.js";
import { wireOrg } from "./views/organize.js";
import { wirePalette } from "./views/palette.js";
import { wirePress } from "./ui/indicator.js";
import { wireMotion } from "./ui/motion.js";

/* Protótipo v4: aplica o conceito visual (coração ou folha) e lembra a escolha neste aparelho. */
function applyConcept() {
  const c = concept();
  document.body.dataset.concept = S.concept; remember("aorta-conceito", S.concept);
  document.title = c.title;
  $$(".brand-name").forEach(el => { el.textContent = c.brand; });
  $$(".brand").forEach(el => el.setAttribute("aria-label", `${c.brand}, início`));
  document.getElementById("footer-line").textContent = c.footer;
  // O corpo usa também a pele do HuBMAP: o crédito (CC BY 4.0) cita os dois modelos.
  if (S.concept === "corpo") {
    const link = document.querySelector(".credit-heart a");
    if (link) link.textContent = "3D Reference Organs: Skin, Male, v1.3 e Heart, Male, v1.3 (malhas simplificadas)";
  }
  $$("[data-concept-link]").forEach(a => {
    a.dataset.conceptLink === S.concept ? a.setAttribute("aria-current", "true") : a.removeAttribute("aria-current");
    a.addEventListener("click", e => { e.preventDefault(); location.href = `?conceito=${a.dataset.conceptLink}${location.hash}`; });
  });
}
applyConcept();
wireDialogs(detailFallbackFocus);
wirePress(); wireMotion();
wireTheme(); wireHome(); wireModule(); wireDetail(); wireForm(); wireOrg(); wirePalette();
window.addEventListener("hashchange", () => route(true));
route(false);

(async () => {
  let db = null;
  try { db = await openDb(); } catch (e) { console.error(e); }
  if (S.dbState === "login" || S.dbState === "denied") { renderAll(); return; }
  if (!db) { S.dbState = "unavailable"; renderAll(); return; }
  S.db = db; S.dbState = "ready"; renderAll(); subscribe();
})();
