/* Coração 3D: modelo HuBMAP translúcido (shader de borda), artérias sobre a superfície,
   batimento "lub-dub" e pulso de luz só nas artérias de módulos com material.
   Render sob demanda: só desenha quando algo muda; pausa fora da tela, com a aba escondida ou pelo botão. */
import { WebGLRenderer, Scene, PerspectiveCamera, Group, Vector3, Color, ShaderMaterial, MeshBasicMaterial, Mesh,
  CatmullRomCurve3, TubeGeometry, MathUtils, SRGBColorSpace } from "three";
import gsap from "gsap";
import { loadGLB } from "./glb.js";
import { ATRIA, VENTRICLES, VALVES, chamberGeometry, traceArtery } from "./geometry.js";
import { pathKey } from "../core/arteries.js";
/* Traçado pré-calculado (tools/arterias.mjs): achar a superfície por raio custa ~1,5 s num celular médio. */
import TRACED from "./arteries.json";

const IDLE_MS = 2600;
const css = token => getComputedStyle(document.documentElement).getPropertyValue(token).trim();
/* Devolve a vez ao navegador entre etapas pesadas: nenhuma tarefa longa trava toque ou rolagem enquanto o coração monta. */
const breathe = () => new Promise(r => ("scheduler" in window && scheduler.yield) ? scheduler.yield().then(r) : setTimeout(r, 0));

const RIM_VERTEX = "varying vec3 N;varying vec3 V;void main(){vec4 p=modelViewMatrix*vec4(position,1.);N=normalize(normalMatrix*normal);V=normalize(-p.xyz);gl_Position=projectionMatrix*p;}";
const RIM_FRAGMENT = "uniform vec3 base;uniform vec3 rim;uniform float kick;varying vec3 N;varying vec3 V;void main(){float f=pow(1.-max(dot(normalize(N),normalize(V)),0.),2.1);float key=max(dot(normalize(N),normalize(vec3(-.4,.7,.6))),0.);gl_FragColor=vec4(base*(.35+.65*key)+rim*f*(1.+kick*.5),.25+.53*f);}";
const TUBE_VERTEX = "varying vec2 UV;void main(){UV=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}";
const TUBE_FRAGMENT = "uniform vec3 col;uniform float flow;uniform float off;uniform float hot;varying vec2 UV;void main(){if(off>.5){if(fract(UV.x*24.)>.45)discard;gl_FragColor=vec4(col,.45+hot*.3);return;}float p=exp(-pow((UV.x-flow)*10.,2.));gl_FragColor=vec4(col*(1.+hot*.25)+vec3(.85,.45,.55)*p,.95);}";

export async function createHeart(o) {
  const glb = await loadGLB(o.model, o.onProgress);
  if (!o.isCurrent()) return null;
  const renderer = new WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.domElement.setAttribute("aria-hidden", "true");
  o.map.prepend(renderer.domElement);
  try { return await assemble(o, glb, renderer); }
  catch (e) { renderer.dispose(); renderer.domElement.remove(); throw e; }
}

async function assemble(o, glb, renderer) {
  const scene = new Scene(), camera = new PerspectiveCamera(30, 1, .1, 100);
  camera.position.set(0, 0, 13);
  const root = new Group(), heart = new Group(); scene.add(root); root.add(heart);
  const rim = (base, edge) => new ShaderMaterial({ transparent: true, depthWrite: false, vertexShader: RIM_VERTEX, fragmentShader: RIM_FRAGMENT,
    uniforms: { base: { value: new Color(css(base)) }, rim: { value: new Color(css(edge)) }, kick: { value: 0 } } });
  const mesh = (name, material) => {
    const d = glb[name]; if (!d) return null;
    const { geometry, center } = chamberGeometry(d);
    const m = new Mesh(geometry, material); m.position.copy(center); heart.add(m); return m;
  };
  const atria = [], ventricles = [], valves = [];
  for (const n of ATRIA) { const m = mesh(n, rim("--atrium", "--violet-2")); if (m) atria.push(m); await breathe(); }
  for (const n of VENTRICLES) { const m = mesh(n, rim("--ventricle", "--flow")); if (m) ventricles.push(m); await breathe(); }
  for (const n of VALVES) { const m = mesh(n, new MeshBasicMaterial({ color: css("--valve"), transparent: true, opacity: .18, depthWrite: false })); if (m) valves.push(m); }
  if (!atria.length || !ventricles.length) throw new Error("Modelo sem as câmaras esperadas");
  if (!o.isCurrent()) { renderer.dispose(); renderer.domElement.remove(); return null; }

  // Artérias: traçado pré-calculado; só um caminho novo (módulo além do oitavo) é calculado aqui, devolvendo a vez entre raios.
  heart.updateMatrixWorld(true);
  const surfaces = [...atria, ...ventricles];
  let live = o.modules.map(m => m.live);
  const vessels = [];
  for (const [i, m] of o.modules.entries()) {
    const known = TRACED[pathKey(m.path)];
    const pts = known ? known.map(([x, y, z]) => new Vector3(x, y, z)) : await traceArtery(m.path, surfaces, breathe);
    if (!o.isCurrent()) { renderer.dispose(); renderer.domElement.remove(); return null; }
    vessels.push(vessel(m, i, pts));
  }
  function vessel(m, i, pts) {
    if (pts.length < 4) return null;
    const curve = new CatmullRomCurve3(pts);
    const mat = new ShaderMaterial({ transparent: true, depthWrite: false, vertexShader: TUBE_VERTEX, fragmentShader: TUBE_FRAGMENT,
      uniforms: { col: { value: new Color(css(m.token)) }, flow: { value: -1 }, off: { value: live[i] ? 0 : 1 }, hot: { value: 0 } } });
    const tube = new Mesh(new TubeGeometry(curve, 90, live[i] ? .034 : .024, 7, false), mat);
    tube.renderOrder = 3; heart.add(tube);
    return { mat, tip: curve.getPoint(1), token: m.token };
  }
  await breathe();

  let destroyed = false, visible = true, onScreen = true, paused = false, frame = 0, timer = 0, beatTl = null, entered = false;
  const look = { x: 0, y: 0 };
  const canDraw = () => !destroyed && visible && onScreen && !document.hidden;
  const project = () => {
    const w = o.map.clientWidth, h = o.map.clientHeight; heart.updateMatrixWorld(true);
    o.onProject(vessels.map(v => { if (!v) return null; const p = heart.localToWorld(v.tip.clone()).project(camera); return { x: (p.x * .5 + .5) * w, y: (-p.y * .5 + .5) * h }; }));
  };
  const draw = () => { frame = 0; if (!canDraw()) return; root.rotation.set(look.y, look.x, 0); renderer.render(scene, camera); project(); };
  const request = () => { if (!frame && canDraw()) frame = requestAnimationFrame(draw); };
  let baseScale = 1;
  const resize = () => {
    const w = o.map.clientWidth, h = o.map.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    const visibleWidth = 2 * 13 * Math.tan(MathUtils.degToRad(15)) * camera.aspect;
    baseScale = Math.min(1.15, visibleWidth * (w < 560 ? .5 : .64) / 4.6);
    if (entered) heart.scale.setScalar(baseScale);
    heart.rotation.set(.1, -.12, .035); heart.position.set(0, .2, 0);
    request();
  };

  function beat(strength = .45, only = null) {
    if (paused || !canDraw()) return;
    beatTl?.kill();
    for (const m of [...atria, ...ventricles]) { gsap.killTweensOf(m.scale); m.scale.setScalar(1); }
    vessels.forEach(v => { if (v) v.mat.uniforms.flow.value = -1; });
    beatTl = gsap.timeline({ onUpdate: request });
    const k = strength;
    atria.forEach(a => beatTl.to(a.scale, { x: 1 - .05 * k, y: 1 - .05 * k, z: 1 - .05 * k, duration: .12, ease: "power2.out" }, 0).to(a.scale, { x: 1, y: 1, z: 1, duration: .35, ease: "power2.out" }, .12));
    ventricles.forEach(v => beatTl.to(v.scale, { x: 1 - .065 * k, y: 1 - .065 * k, z: 1 - .065 * k, duration: .14, ease: "power2.out" }, .16).to(v.scale, { x: 1, y: 1, z: 1, duration: .5, ease: "elastic.out(1,.6)" }, .3));
    [...atria, ...ventricles].forEach(m => beatTl.fromTo(m.material.uniforms.kick, { value: k }, { value: 0, duration: .6, ease: "power2.out" }, .16));
    vessels.forEach((v, i) => { if (v && live[i] && (only === null || only === i)) beatTl.fromTo(v.mat.uniforms.flow, { value: -.1 }, { value: 1.15, duration: 1.1, ease: "power1.in" }, .28); });
  }
  const stop = () => { clearTimeout(timer); timer = 0; beatTl?.pause(); if (frame) cancelAnimationFrame(frame); frame = 0; };
  const schedule = () => { clearTimeout(timer); if (!canDraw() || paused) return; timer = setTimeout(() => { beat(); schedule(); }, IDLE_MS); };
  const sync = () => { if (!canDraw()) stop(); else { beatTl?.resume(); request(); schedule(); } };

  const io = new IntersectionObserver(es => { onScreen = es[0].isIntersecting; sync(); }); io.observe(o.map);
  const ro = new ResizeObserver(resize); ro.observe(o.map);
  document.addEventListener("visibilitychange", sync);
  const pointer = e => {
    if (paused || !canDraw() || e.pointerType === "touch") return;
    const b = o.map.getBoundingClientRect();
    gsap.to(look, { x: ((e.clientX - b.left) / b.width - .5) * .24, y: ((e.clientY - b.top) / b.height - .5) * .12, duration: .6, ease: "power2.out", overwrite: true, onUpdate: request });
  };
  o.map.addEventListener("pointermove", pointer);
  const lost = e => { e.preventDefault(); api.dispose(); o.onLost?.(); };
  renderer.domElement.addEventListener("webglcontextlost", lost);

  const api = {
    resize,
    highlight(i, on) {
      const v = vessels[i]; if (!v) return;
      gsap.to(v.mat.uniforms.hot, { value: on ? 1 : 0, duration: .18, overwrite: true, onUpdate: request });
      if (on && live[i]) { beat(.8, i); schedule(); } // a próxima batida de repouso conta a partir desta
    },
    pause(p) {
      paused = p;
      if (p) { stop(); beatTl?.kill(); [...atria, ...ventricles].forEach(m => { m.scale.setScalar(1); m.material.uniforms.kick.value = 0; }); vessels.forEach(v => { if (v) v.mat.uniforms.flow.value = -1; }); request(); }
      else schedule();
    },
    visible(v) { visible = v; sync(); },
    update(next) { live = next; vessels.forEach((v, i) => { if (v) v.mat.uniforms.off.value = live[i] ? 0 : 1; }); request(); },
    theme() {
      atria.forEach(m => { m.material.uniforms.base.value.set(css("--atrium")); m.material.uniforms.rim.value.set(css("--violet-2")); });
      ventricles.forEach(m => { m.material.uniforms.base.value.set(css("--ventricle")); m.material.uniforms.rim.value.set(css("--flow")); });
      valves.forEach(m => m.material.color.set(css("--valve")));
      vessels.forEach(v => v?.mat.uniforms.col.value.set(css(v.token)));
      request();
    },
    dispose() {
      if (destroyed) return; destroyed = true; stop(); beatTl?.kill(); gsap.killTweensOf([look, heart.scale]);
      io.disconnect(); ro.disconnect(); document.removeEventListener("visibilitychange", sync);
      o.map.removeEventListener("pointermove", pointer); renderer.domElement.removeEventListener("webglcontextlost", lost);
      scene.traverse(n => { n.geometry?.dispose(); n.material?.dispose(); });
      renderer.dispose(); renderer.domElement.remove();
    },
  };
  // Shaders compilados fora da linha principal quando o navegador permite (sem travar na primeira imagem).
  resize();
  if (renderer.extensions.has("KHR_parallel_shader_compile")) await renderer.compileAsync(scene, camera).catch(() => {});
  if (!o.isCurrent()) { api.dispose(); return null; }
  // Entrada: o coração cresce até o tamanho certo e a primeira batida vem logo depois.
  heart.scale.setScalar(baseScale * .82);
  gsap.to(heart.scale, { x: baseScale, y: baseScale, z: baseScale, duration: 1.1, ease: "expo.out", onUpdate: request, onComplete: () => { entered = true; } });
  timer = setTimeout(() => { beat(.6); schedule(); }, 900);
  request();
  return api;
}
