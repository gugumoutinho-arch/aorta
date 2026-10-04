import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/home.css";
import "./styles/stage.css";
import "./styles/index-list.css";
import "./styles/tabbar.css";
import "./styles/module.css";
import "./styles/dialogs.css";
import "./styles/organize.css";
import "./styles/proto.css";

import { S } from "./core/state.js";
import { syncConcept } from "./views/concept.js";
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
import { wireTabbar } from "./views/tabbar.js";

/* Protótipo v4: aplica o conceito visual (coração ou folha) e lembra a escolha neste aparelho. */
syncConcept();
wireDialogs(detailFallbackFocus);
wirePress(); wireMotion();
wireTheme(); wireHome(); wireModule(); wireDetail(); wireForm(); wireOrg(); wirePalette(); wireTabbar();
// Pedido de redesenho vindo de uma ação de navegação (ex.: "Favoritos" da barra inferior aplica o filtro e redesenha).
window.addEventListener("aorta:render", () => renderAll());
window.addEventListener("hashchange", () => route(true));
route(false);

(async () => {
  let db = null;
  try { db = await openDb(); } catch (e) { console.error(e); }
  if (S.dbState === "login" || S.dbState === "denied") { renderAll(); return; }
  if (!db) { S.dbState = "unavailable"; renderAll(); return; }
  S.db = db; S.dbState = "ready"; renderAll(); subscribe();
})();
