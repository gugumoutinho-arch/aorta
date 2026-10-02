/* Mapa do acervo (coração ou folha, ver concept.js): rótulos HTML dos módulos (links de verdade), linhas-guia até a
   ponta de cada caminho, mapa em linhas (SVG) como base sempre presente e o 3D por cima, carregado depois da primeira tela. */
import { ready, reducedMotion } from "../core/state.js";
import { $, $$, h } from "../core/dom.js";
import { moduleNumber, countLabel } from "../core/areas.js";
import { noteFlight } from "./module.js";
import { onThemeChange } from "../ui/theme.js";
import { concept } from "./concept.js";

const NS = "http://www.w3.org/2000/svg";
const modelUrl = () => `${import.meta.env.BASE_URL}modelos/${concept().model || "heart-hra-v1.3.glb"}`;
let diving = false, mods = [], signature = "", geometry = "", scene = null, sceneKey = "", boot = 0, started = false, paused = false, visible = true, tips = null, layoutFrame = 0;

function flatTips() {
  const map = $("#map"), w = map.clientWidth, hgt = map.clientHeight, s = Math.min(w / 600, hgt / 560);
  const ox = (w - 600 * s) / 2, oy = (hgt - 560 * s) / 2, c = concept();
  return mods.map(m => { const [x, y] = c.flat(m, mods.length).tip; return { x: ox + x * s, y: oy + y * s }; });
}
function drawOutline() {
  $("#flat-outline").replaceChildren(...concept().outline().map(d => { const p = document.createElementNS(NS, "path"); p.setAttribute("d", d); return p; }));
}

function buildLabels() {
  const nav = $("#modules"), focused = document.activeElement?.closest?.("#modules [data-module]")?.dataset.module;
  // O nome acessível é o próprio texto visível ("Art. 01 M1 4 materiais"), como pede o WCAG 2.5.3.
  nav.replaceChildren(...mods.map(m => h("a", { class: "mod" + (m.live ? "" : " off") + (m.name.length > 4 ? " long" : ""), href: "#a-" + m.id, "data-module": m.id, "data-index": String(m.index), style: `--c:var(${m.token})` },
    h("span", { class: "mono", text: (concept().labelTop?.(m) || moduleNumber(m.index)) + " " }), h("b", { text: m.name }), h("small", { text: " " + countLabel(m.count) }))));
  $("#flat-arteries").replaceChildren(...mods.map(m => {
    const p = document.createElementNS(NS, "path");
    p.setAttribute("d", concept().flat(m, mods.length).d); p.dataset.flat = String(m.index);
    p.setAttribute("style", `stroke:var(${m.token})`);
    if (!m.live) p.setAttribute("class", "off");
    return p;
  }));
  $("#guides").replaceChildren(...mods.map(m => { const p = document.createElementNS(NS, "path"); p.dataset.guide = String(m.index); return p; }));
  if (focused) nav.querySelector(`[data-module="${focused}"]`)?.focus({ preventScroll: true });
}

/* Duas colunas, cada rótulo do lado em que o caminho termina, na ordem da altura da ponta. Nada atravessa o desenho. */
function layout() {
  layoutFrame = 0;
  const map = $("#map"), w = $("#modules").clientWidth, hgt = map.clientHeight;
  if (!w || !hgt) return;
  // Ordem de cada coluna = altura da ponta na tela (projetada), para as linhas-guia não se cruzarem.
  const ends = tips || flatTips(), y = m => ends[m.index]?.y ?? 0;
  for (const right of [false, true]) {
    // Lado = onde a ponta aparece na tela (vale para o 3D girado e para o mapa em linhas).
    const isRight = m => ends[m.index] ? ends[m.index].x > map.clientWidth / 2 : concept().side(m, mods.length) === "right";
    const side = mods.filter(m => isRight(m) === right).sort((a, b) => y(a) - y(b));
    // Cada rótulo tenta ficar na altura da sua ponta (linha-guia curta e quase reta); depois afasta os vizinhos
    // para não se sobreporem e devolve para dentro do mapa, de baixo para cima.
    const GAP = 8, items = side.map(m => ({ m, b: $(`#modules [data-module="${m.id}"]`) })).filter(x => x.b);
    items.forEach(x => { x.h = x.b.offsetHeight; x.top = Math.max(4, y(x.m) - x.h * .62); });
    for (let k = 1; k < items.length; k++) items[k].top = Math.max(items[k].top, items[k - 1].top + items[k - 1].h + GAP);
    let limit = hgt - 4;
    for (let k = items.length - 1; k >= 0; k--) { items[k].top = Math.min(items[k].top, limit - items[k].h); limit = items[k].top - GAP; }
    items.forEach(({ b, top }) => {
      b.dataset.side = right ? "right" : "left";
      b.style.transform = `translate(${right ? w - b.offsetWidth : 0}px, ${Math.max(0, top)}px)`;
    });
  }
  $("#guides").setAttribute("viewBox", `0 0 ${map.clientWidth} ${hgt}`);
  guides(tips);
}
const requestLayout = () => { if (!layoutFrame) layoutFrame = requestAnimationFrame(layout); };
function guides(points) {
  tips = points || null;
  const map = $("#map"), r = map.getBoundingClientRect(), base = points || flatTips();
  $$("#modules .mod").forEach(b => {
    const i = +b.dataset.index, p = base[i], g = $(`[data-guide="${i}"]`);
    if (!p || !g) return;
    const br = b.getBoundingClientRect(), right = b.dataset.side === "right";
    const x = right ? br.left - r.left : br.right - r.left, y = br.top - r.top + br.height * .62;
    g.setAttribute("d", `M${p.x.toFixed(1)} ${p.y.toFixed(1)} L${(x + (right ? -14 : 14)).toFixed(1)} ${y.toFixed(1)} H${x.toFixed(1)}`);
  });
}

function highlight(i, on) {
  $(`[data-guide="${i}"]`)?.classList.toggle("hot", on);
  $(`[data-flat="${i}"]`)?.classList.toggle("hot", on);
  $(`#modules [data-index="${i}"]`)?.classList.toggle("hot", on);
  scene?.highlight(i, on);
}

function setState(text) { $("#model-state").textContent = text; }
function canUse3D() {
  const what = concept().flatWhat;
  if (reducedMotion()) return what + " · movimento reduzido.";
  if ((navigator.deviceMemory && navigator.deviceMemory <= 2) || navigator.connection?.saveData) return what + " · modo econômico do aparelho.";
  try { const c = document.createElement("canvas"); const gl = c.getContext("webgl2"); if (!gl) return what + " · este navegador não desenha 3D."; gl.getExtension("WEBGL_lose_context")?.loseContext(); }
  catch (_) { return what + " · este navegador não desenha 3D."; }
  return "";
}
function stopHeart() { boot++; scene?.dispose(); scene = null; sceneKey = ""; $("#map").classList.remove("ready"); $("#loader").hidden = true; $("#pause").hidden = true; tips = null; requestLayout(); }
/* Volta ao mapa em linhas (falha de carga ou contexto WebGL perdido), sem tentar de novo sozinho até recarregar. */
function toFlat(message) { stopHeart(); setState(message); }
async function startHeart() {
  const why = canUse3D();
  if (why) { stopHeart(); setState(why); return; }
  const token = ++boot, key = geometry;
  scene?.dispose(); scene = null;
  const c = concept();
  $("#loader").hidden = false; $("#progress").textContent = ""; $("#load-text").textContent = c.loading;
  setState(c.state3d);
  try {
    const create = await c.load();
    if (token !== boot) return;
    const created = await create({
      map: $("#map"), modules: mods, model: modelUrl(),
      // Content-Length pode vir comprimido e os bytes lidos, não: o número nunca passa de 100%.
      onProgress: (got, total) => { if (token !== boot) return; $("#load-text").textContent = c.loadingModel; $("#progress").textContent = total ? Math.min(100, Math.round(got / total * 100)) + "%" : Math.round(got / 1024) + " KB"; },
      onProject: points => guides(points),
      onLost: () => { if (token === boot) { scene = null; toFlat("O 3D foi interrompido pelo navegador. O mapa em linhas funciona do mesmo jeito."); } },
      isCurrent: () => token === boot,
    });
    if (token !== boot) { created?.dispose(); return; }
    if (!created) { toFlat("Modelo 3D indisponível agora. O mapa em linhas funciona do mesmo jeito."); return; }
    scene = created; sceneKey = key;
    $("#loader").hidden = true; $("#map").classList.add("ready");
    $("#pause").hidden = false; scene.pause(paused); scene.visible(visible);
    setTimeout(requestLayout, 120); // reordena os rótulos pelas pontas projetadas do 3D
  } catch (e) {
    if (token !== boot) return;
    console.warn("Coração 3D indisponível:", e);
    toFlat("Modelo 3D indisponível agora. O mapa em linhas funciona do mesmo jeito.");
  }
}
let idleStart = 0;
/* O coração só começa depois que a página terminou de carregar e o navegador está ocioso: a primeira tela vem antes. */
function scheduleHeart() {
  if (idleStart) return;
  idleStart = -1;
  const run = () => { idleStart = 0; startHeart(); };
  const idle = () => "requestIdleCallback" in window ? requestIdleCallback(run, { timeout: 2500 }) : setTimeout(run, 600);
  if (document.readyState === "complete") idle(); else addEventListener("load", idle, { once: true });
}

export function drawMap(list) {
  const atlas = $("#atlas");
  atlas.dataset.empty = String(!list.length);
  mods = list;
  concept().decorate?.(list);
  const sig = JSON.stringify(list.map(m => [m.id, m.name, m.count, m.live, m.dest]));
  if (sig !== signature) { signature = sig; buildLabels(); }
  requestLayout();
  if (!ready() || !list.length) return;
  geometry = concept().geometryKey(list);
  // Mesma estrutura: só acende ou apaga artérias. Módulo novo ou removido: o coração é refeito.
  if (scene) { if (geometry !== sceneKey) scheduleHeart(); else scene.update(list.map(m => m.live)); }
  else if (!started) { started = true; scheduleHeart(); }
}
export function mapVisible(on) { visible = on; scene?.visible(on); if (on) { scene?.reset?.(false); requestLayout(); } }
export function focusModuleLabel(id) { const a = $(`#modules [data-module="${id}"]`); if (!a) return false; a.focus({ preventScroll: true }); return true; }

export function wireMap() {
  const nav = $("#modules");
  nav.addEventListener("pointerover", e => { const b = e.target.closest(".mod"); if (b) highlight(+b.dataset.index, true); });
  nav.addEventListener("pointerout", e => { const b = e.target.closest(".mod"); if (b) highlight(+b.dataset.index, false); });
  nav.addEventListener("focusin", e => { const b = e.target.closest(".mod"); if (b) highlight(+b.dataset.index, true); });
  nav.addEventListener("focusout", e => { const b = e.target.closest(".mod"); if (b) highlight(+b.dataset.index, false); });
  // Setas andam entre as artérias; Enter abre (é um link).
  nav.addEventListener("keydown", e => {
    if (!["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Home", "End"].includes(e.key)) return;
    const bs = $$("#modules .mod"), i = bs.indexOf(document.activeElement); if (i < 0) return;
    e.preventDefault();
    const j = e.key === "Home" ? 0 : e.key === "End" ? bs.length - 1 : (i + (["ArrowRight", "ArrowDown"].includes(e.key) ? 1 : bs.length - 1)) % bs.length;
    bs[j].focus();
  });
  // A partir de qualquer link de módulo do início, a página do módulo nasce do lugar tocado.
  $("#view-home").addEventListener("click", e => {
    const a = e.target.closest("a[data-module]"); if (!a) return;
    // Com o corpo em 3D, clicar num rótulo do mapa mergulha a câmera até o destino antes de abrir o módulo.
    const label = a.closest("#modules .mod");
    if (label && scene?.focus && !reducedMotion() && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
      e.preventDefault();
      if (diving) return;
      diving = true; highlight(+label.dataset.index, true);
      document.body.classList.add("diving");
      const go = () => { if (!diving) return; diving = false; document.body.classList.remove("diving"); noteFlight(label.getBoundingClientRect(), label.dataset.module, label.querySelector("b")?.textContent || ""); location.hash = "a-" + label.dataset.module; };
      Promise.race([scene.focus(+label.dataset.index), new Promise(r => setTimeout(r, 1100))]).then(go);
      return;
    }
    noteFlight(a.getBoundingClientRect(), a.dataset.module, a.querySelector("b")?.textContent || a.textContent);
  });
  $("#pause").hidden = true;
  $("#pause").textContent = concept().pause[0];
  drawOutline();
  $("#pause").addEventListener("click", () => {
    paused = !paused;
    $("#pause").setAttribute("aria-pressed", String(paused));
    $("#pause").textContent = concept().pause[paused ? 1 : 0];
    scene?.pause(paused);
  });
  new ResizeObserver(requestLayout).observe($("#map"));
  onThemeChange(() => scene?.theme());
  matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change", () => { if (ready() && mods.length) startHeart(); });
}
