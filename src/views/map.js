/* Mapa do acervo (coração ou folha, ver concept.js): rótulos HTML dos módulos (links de verdade), linhas-guia até a
   ponta de cada caminho, mapa em linhas (SVG) como base sempre presente e o 3D por cima, carregado depois da primeira tela. */
import { S, ready, reducedMotion } from "../core/state.js";
import { $, $$, h } from "../core/dom.js";
import { moduleNumber, countLabel } from "../core/areas.js";
import { noteFlight } from "./module.js";
import { onThemeChange } from "../ui/theme.js";
import { concept } from "./concept.js";

const NS = "http://www.w3.org/2000/svg";
const modelUrl = () => `${import.meta.env.BASE_URL}modelos/${concept().model || "heart-hra-v1.3.glb"}`;
let probe = null, diving = false, diveId = 0, mapConcept = null, mods = [], signature = "", geometry = "", scene = null, sceneKey = "", boot = 0, started = false, paused = false, visible = true, tips = null, layoutFrame = 0;

export function cancelDive() {
  diveId++;
  if (diving) scene?.reset?.(true);
  diving = false;
  document.body.classList.remove("diving");
}

/* Caixa horizontal do desenho (contorno e caminhos, em unidades do SVG 600×560): o desenho é encaixado ENTRE as duas
   colunas de rótulos, para nenhuma ponta ficar embaixo de um rótulo. */
let box = [0, 600], labelCol = 0;
function flatBox() {
  const xs = [], c = concept();
  for (const d of [...c.outline(), ...mods.map(m => c.flat(m, mods.length).d)]) {
    const n = d.match(/-?\d+(\.\d+)?/g)?.map(Number) || [];
    for (let k = 0; k + 1 < n.length; k += 2) xs.push(n[k]);
  }
  return xs.length ? [Math.max(0, Math.min(...xs) - 12), Math.min(600, Math.max(...xs) + 12)] : [0, 600];
}
function flatTips() {
  const map = $("#map"), w = mapSize.w || map.clientWidth, hgt = mapSize.h || map.clientHeight;
  const region = w - 2 * labelCol, bw = box[1] - box[0], s = Math.min(region / bw, hgt / 560);
  const ox = labelCol + (region - bw * s) / 2 - box[0] * s, oy = (hgt - 560 * s) / 2, c = concept();
  return mods.map(m => { const [x, y] = c.flat(m, mods.length).tip; return { x: ox + x * s, y: oy + y * s }; });
}
function drawOutline() {
  $("#flat-outline").replaceChildren(...concept().outline().map(d => { const p = document.createElementNS(NS, "path"); p.setAttribute("d", d); return p; }));
}
/* Fração da largura do mapa livre para o desenho 3D (as cenas usam para escolher a escala). */
/* Série L: no coração 3D, o desenho pode avançar sob a borda interna das colunas de rótulos (eles têm placa). reach3d =
   fração da coluna reservada; medido com os 8 rótulos (seed-v4): sem guia cruzando nem atravessando rótulo com 0,85 a
   partir de 1200 px e 0,9 abaixo. O mapa em linhas e os outros conceitos mantêm a coluna inteira (ali, qualquer avanço
   cruzava duas guias). */
const reach3d = () => S.concept !== "coracao" ? 1 : innerWidth >= 1200 ? .85 : .9;
export const freeWidth = () => { const w = $("#map").clientWidth; return w ? Math.max(.4, (w - 2 * labelCol * reach3d()) / w) : 1; }; // largura atual (o 3D reescala antes do layout)

function buildLabels() {
  const nav = $("#modules"), focused = document.activeElement?.closest?.("#modules [data-module]")?.dataset.module;
  // O nome acessível é o próprio texto visível ("Art. 01 M1 4 materiais"), como pede o WCAG 2.5.3.
  // Coração (direção D): "ART. 01 · M1" no rótulo técnico e o nome da artéria em destaque; corpo: destino e disciplina.
  const artery = !concept().labelTop && S.concept === "coracao";
  nav.replaceChildren(...mods.map(m => h("a", { class: "mod" + (m.live ? "" : " off") + (!artery && m.name.length > 4 ? " long" : ""), href: "#a-" + m.id, "data-module": m.id, "data-name": m.name, "data-index": String(m.index), style: `--c:var(${m.token})` },
    h("span", { class: "mono", text: (concept().labelTop?.(m) || moduleNumber(m.index) + (artery ? " · " + m.name : "")) + " " }), h("b", { text: artery ? m.art.charAt(0).toLocaleUpperCase("pt-BR") + m.art.slice(1) : m.name }),
    h("small", { text: " " + countLabel(m.count) }))));
  $("#flat-arteries").replaceChildren(...mods.map(m => {
    const p = document.createElementNS(NS, "path");
    p.setAttribute("d", concept().flat(m, mods.length).d); p.dataset.flat = String(m.index);
    p.setAttribute("style", `stroke:var(${m.token})`);
    if (!m.live) p.setAttribute("class", "off");
    return p;
  }));
  $("#guides").replaceChildren(...mods.map(m => { const p = document.createElementNS(NS, "path"); p.dataset.guide = String(m.index); return p; }));
  if (focused) nav.querySelector(`[data-module="${focused}"]`)?.focus({ preventScroll: true });
  featureModule(featured);
}

/* Duas colunas, cada rótulo do lado em que o caminho termina, na ordem da altura da ponta. Nada atravessa o desenho.
   Primeiro TODAS as leituras (tamanho do mapa e dos rótulos à vista), depois as escritas: um só cálculo de layout por
   quadro. As caixas ficam guardadas para as linhas-guia, que se redesenham a cada quadro do 3D sem ler o DOM. */
let placed = new Map(), mapSize = { w: 0, h: 0 };
function layout() {
  layoutFrame = 0;
  const map = $("#map"), nav = $("#modules"), w = nav.clientWidth, hgt = map.clientHeight, mapW = map.clientWidth, navLeft = nav.offsetLeft;
  if (!w || !hgt) return;
  const labels = $$("#modules .mod").filter(b => b.getClientRects().length); // no celular, só o rótulo em destaque
  const size = new Map(labels.map(b => [b.dataset.module, { w: b.offsetWidth, h: b.offsetHeight }]));
  const widthChanged = mapW !== mapSize.w;
  mapSize = { w: mapW, h: hgt };
  // Com mais de um rótulo à vista (fora do palco compacto do celular), as duas colunas ficam reservadas para eles.
  const col = labels.length > 1 ? Math.max(0, ...[...size.values()].map(x => x.w)) + 10 : 0, colChanged = col !== labelCol;
  labelCol = col;
  // Ordem de cada coluna = altura da ponta na tela (projetada), para as linhas-guia não se cruzarem.
  const ends = tips || flatTips(), y = m => ends[m.index]?.y ?? 0, body = concept().model === "corpo.glb";
  // Corpo: colunas equilibradas, mas pela posição da ponta (as mais à direita vão para a direita), para as guias não
  // atravessarem o corpo nem se cruzarem. Coração: o lado em que a ponta aparece na tela.
  const byX = [...mods].filter(m => size.has(m.id)).sort((a, b) => (ends[a.index]?.x ?? 0) - (ends[b.index]?.x ?? 0) || a.index - b.index);
  const rightSet = new Set(byX.slice(Math.ceil(byX.length / 2)).map(m => m.index));
  const isRight = m => body ? rightSet.has(m.index) : ends[m.index] ? ends[m.index].x > mapW / 2 : concept().side(m, mods.length) === "right";
  const next = new Map(), writes = [];
  for (const right of [false, true]) {
    // Cada rótulo tenta ficar na altura da sua ponta (linha-guia curta e quase reta); depois afasta os vizinhos
    // para não se sobreporem e devolve para dentro do mapa, de baixo para cima.
    const GAP = 8;
    let items = mods.filter(m => isRight(m) === right && size.has(m.id)).sort((a, b) => y(a) - y(b)).map(m => ({ m, ...size.get(m.id) }));
    const stack = list => {
      list.forEach((x, i) => { x.top = body ? 28 + i * (hgt - 56 - x.h) / Math.max(1, list.length - 1) : Math.max(4, y(x.m) - x.h * .62); });
      for (let k = 1; k < list.length; k++) list[k].top = Math.max(list[k].top, list[k - 1].top + list[k - 1].h + GAP);
      let limit = hgt - 4;
      for (let k = list.length - 1; k >= 0; k--) { list[k].top = Math.min(list[k].top, limit - list[k].h); limit = list[k].top - GAP; }
    };
    // Ordem pela altura da ponta; se duas guias vizinhas ainda se cruzam (ponta mais para fora e mais abaixo), troca as
    // duas e refaz. No máximo n² passadas (até 5 rótulos por coluna).
    const end = x => [navLeft + (right ? w - x.w - 14 : x.w + 14), Math.max(0, x.top) + x.h * .62];
    const cross = (a, b) => { const p = ends[a.m.index], q = ends[b.m.index]; if (!p || !q) return false;
      const o = (u, v, r) => Math.sign((v[0] - u[0]) * (r[1] - u[1]) - (v[1] - u[1]) * (r[0] - u[0])), a2 = end(a), b2 = end(b), pa = [p.x, p.y], qb = [q.x, q.y];
      return o(pa, a2, qb) * o(pa, a2, b2) < 0 && o(qb, b2, pa) * o(qb, b2, a2) < 0; };
    // Para quando não há cruzamento ou quando a troca não diminui o total (evita oscilar entre duas ordens).
    const total = list => list.reduce((n, a, i) => n + list.slice(i + 1).filter(b => cross(a, b)).length, 0);
    stack(items);
    for (let pass = 0, now = total(items); now && pass < items.length * items.length; pass++) {
      const k = items.findIndex((x, i) => i && cross(items[i - 1], x)); if (k < 1) break;
      const tried = [...items.slice(0, k - 1), items[k], items[k - 1], ...items.slice(k + 1)].map(x => ({ ...x }));
      stack(tried); const after = total(tried); if (after >= now) { stack(items); break; }
      items = tried; now = after;
    }
    for (const x of items) {
      const left = right ? w - x.w : 0, top = Math.max(0, x.top);
      next.set(x.m.index, { x: navLeft + left, y: top, w: x.w, h: x.h, right });
      writes.push([x.m.id, right, left, top]);
    }
  }
  for (const [id, right, left, top] of writes) {
    const b = nav.querySelector(`[data-module="${id}"]`);
    b.dataset.side = right ? "right" : "left";
    b.style.transform = `translate(${left}px, ${top}px)`;
  }
  placed = next;
  // O mapa em linhas vai para o espaço entre as colunas por TRANSFORM (não por tamanho): mudar o tamanho do SVG depois
  // da primeira pintura contava como deslocamento de layout (CLS 0,05 no computador). Base: viewBox 600×560 inteiro.
  const flat = $("#flat-map"), bw = box[1] - box[0], region = mapW - 2 * labelCol;
  const s0 = Math.min(mapW / 600, hgt / 560), s = Math.min(region / bw, hgt / 560), k = s / s0;
  const ox = labelCol + (region - bw * s) / 2 - box[0] * s, oy = (hgt - 560 * s) / 2;
  flat.style.transformOrigin = "0 0";
  flat.style.transform = `translate(${(ox - k * (mapW - 600 * s0) / 2).toFixed(1)}px, ${(oy - k * (hgt - 560 * s0) / 2).toFixed(1)}px) scale(${k.toFixed(4)})`;
  if (colChanged || widthChanged) scene?.resize?.(); // o 3D reescala para o espaço livre (colunas ou largura mudaram)
  $("#guides").setAttribute("viewBox", `0 0 ${mapW} ${hgt}`);
  guides(tips);
}
const requestLayout = () => { if (!layoutFrame) layoutFrame = requestAnimationFrame(layout); };
/* Linha-guia: da ponta do caminho até a borda do rótulo (a 62% da altura dele). Usa as caixas guardadas pelo layout. */
function guides(points) {
  tips = points || null;
  const base = points || flatTips();
  $$("#guides [data-guide]").forEach(g => {
    const i = +g.dataset.guide, p = base[i], box = placed.get(i);
    if (!p || !box) { g.removeAttribute("d"); return; }
    const x = box.right ? box.x : box.x + box.w, y = box.y + box.h * .62;
    g.setAttribute("d", `M${p.x.toFixed(1)} ${p.y.toFixed(1)} L${(x + (box.right ? -14 : 14)).toFixed(1)} ${y.toFixed(1)} H${x.toFixed(1)}`);
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
  // O contexto do teste vira o contexto do desenho (antes eram dois: o do teste e o do renderizador, ~190 ms cada com
  // CPU 4× no SwiftShader). Mesmos atributos que o renderizador pediria.
  if (!probe || probe.isContextLost()) {
    try { probe = document.createElement("canvas").getContext("webgl2", { alpha: true, antialias: true, powerPreference: "low-power", depth: true, stencil: false, premultipliedAlpha: true }); }
    catch (_) { probe = null; }
  }
  if (!probe) return what + " · este navegador não desenha 3D.";
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
    const gl = probe; probe = null; // o contexto passa a ser do desenho; o próximo teste cria outro
    const created = await create({
      map: $("#map"), modules: mods, model: modelUrl(), gl, free: freeWidth,
      // Content-Length pode vir comprimido e os bytes lidos, não: o número nunca passa de 100%.
      onProgress: (got, total) => { if (token !== boot) return; $("#load-text").textContent = c.loadingModel; $("#progress").textContent = total ? Math.min(100, Math.round(got / total * 100)) + "%" : Math.round(got / 1024) + " KB"; },
      onProject: points => guides(points),
      onLost: () => { if (token === boot) { scene = null; toFlat("O 3D foi interrompido pelo navegador. O mapa em linhas funciona do mesmo jeito."); } },
      isCurrent: () => token === boot,
    });
    // Contexto do teste que não virou desenho (cena abortada antes do renderizador): libera já.
    if (!created) gl?.getExtension("WEBGL_lose_context")?.loseContext();
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
  if (mapConcept !== concept()) {
    cancelDive(); stopHeart(); started = false; signature = "";
    mapConcept = concept(); drawOutline();
    $("#pause").textContent = concept().pause[paused ? 1 : 0];
  }
  const atlas = $("#atlas");
  atlas.dataset.empty = String(!list.length);
  mods = list;
  concept().decorate?.(list);
  const sig = JSON.stringify(list.map(m => [m.id, m.name, m.count, m.live, m.dest]));
  if (sig !== signature) { signature = sig; buildLabels(); box = flatBox(); }
  requestLayout();
  if (!ready() || !list.length) return;
  geometry = concept().geometryKey(list);
  // Mesma estrutura: só acende ou apaga artérias. Módulo novo ou removido: o coração é refeito.
  if (scene) { if (geometry !== sceneKey) scheduleHeart(); else scene.update(list.map(m => m.live)); }
  else if (!started) { started = true; scheduleHeart(); }
}
export function mapVisible(on) { visible = on; scene?.visible(on); if (on) { scene?.reset?.(false); requestLayout(); } }
/* Módulo em destaque (o do "Continuar" ou o primeiro com material). No celular, o palco compacto mostra só o rótulo dele;
   os outros continuam no índice logo abaixo. */
let featured = "";
export function featureModule(id = "") {
  featured = id || "";
  $$("#modules .mod").forEach(b => b.classList.toggle("featured", b.dataset.module === featured));
  const i = mods.find(m => m.id === featured)?.index;
  $$("#guides [data-guide]").forEach(g => g.classList.toggle("featured", +g.dataset.guide === i));
  requestLayout(); // no celular, o rótulo à vista mudou
}
export function focusModuleLabel(id) { const a = $(`#modules [data-module="${id}"]`); if (!a) return false; a.focus({ preventScroll: true }); return true; }

export function wireMap() {
  const nav = $("#modules");
  nav.addEventListener("pointerover", e => { const b = e.target.closest(".mod"); if (b && !b.contains(e.relatedTarget)) highlight(+b.dataset.index, true); });
  nav.addEventListener("pointerout", e => { const b = e.target.closest(".mod"); if (b && !b.contains(e.relatedTarget)) highlight(+b.dataset.index, false); });
  document.addEventListener("keydown", e => { if (e.key === "Escape") cancelDive(); });
  document.addEventListener("click", e => { if (diving && !e.target.closest("#modules .mod")) cancelDive(); }, true);
  nav.addEventListener("focusin", e => { const b = e.target.closest(".mod"); if (b) highlight(+b.dataset.index, true); });
  nav.addEventListener("focusout", e => { const b = e.target.closest(".mod"); if (b) highlight(+b.dataset.index, false); });
  // Setas andam entre as artérias; Enter abre (é um link).
  nav.addEventListener("keydown", e => {
    if (!["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Home", "End"].includes(e.key)) return;
    const bs = $$("#modules .mod").filter(b => b.offsetWidth), i = bs.indexOf(document.activeElement); if (i < 0) return; // só os rótulos à vista
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
      const token = ++diveId, rect = label.querySelector("b").getBoundingClientRect();
      diving = true; highlight(+label.dataset.index, true);
      document.body.classList.add("diving");
      const go = () => { if (!diving || token !== diveId) return; diving = false; document.body.classList.remove("diving"); noteFlight(rect, label.dataset.module, label.dataset.name || ""); location.hash = "a-" + label.dataset.module; };
      Promise.race([scene.focus(+label.dataset.index), new Promise(r => setTimeout(r, 900))]).then(go);
      return;
    }
    noteFlight(a.getBoundingClientRect(), a.dataset.module, a.dataset.name || a.querySelector("b")?.textContent || a.textContent);
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
  matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change", () => { cancelDive(); if (ready() && mods.length) startHeart(); });
}
