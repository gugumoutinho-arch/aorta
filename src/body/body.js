/* Conceito "corpo" (protótipo v4): corpo inteiro translúcido (pele do Visible Human Male, HuBMAP, CC BY 4.0),
   coração no peito e uma artéria por módulo, do coração até o destino (pé, mão, cérebro…). A cada batida o pulso
   corre do coração até os destinos dos módulos com material; apontar um módulo manda o pulso só para o destino dele.
   Mesmo contrato do coração (heart.js): resize, highlight, pause, visible, update, theme, dispose. */
import { WebGLRenderer, Scene, PerspectiveCamera, Group, Vector3, Color, ShaderMaterial, BufferGeometry, BufferAttribute, Mesh,
  CatmullRomCurve3, TubeGeometry, SphereGeometry, MeshBasicMaterial, AdditiveBlending, MathUtils, SRGBColorSpace } from "three";
import gsap from "gsap";
import { loadGLB } from "../heart/glb.js";
import { DESTINATIONS } from "./routes.js";

const IDLE_MS = 2600, DIST = 3.7;
const css = token => getComputedStyle(document.documentElement).getPropertyValue(token).trim();
const breathe = () => new Promise(r => ("scheduler" in window && scheduler.yield) ? scheduler.yield().then(r) : setTimeout(r, 0));

const RIM_VERTEX = "varying vec3 N;varying vec3 V;void main(){vec4 p=modelViewMatrix*vec4(position,1.);N=normalize(normalMatrix*normal);V=normalize(-p.xyz);gl_Position=projectionMatrix*p;}";
const RIM_FRAGMENT = "uniform vec3 base;uniform vec3 rim;uniform float alpha;uniform float kick;varying vec3 N;varying vec3 V;void main(){float f=pow(1.-abs(dot(normalize(N),normalize(V))),2.4);gl_FragColor=vec4(base*.85+rim*f*1.25*(1.+kick*.6),alpha*(.16+.84*f));}";
const TUBE_VERTEX = "varying vec2 UV;void main(){UV=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}";
const TUBE_FRAGMENT = "uniform vec3 col;uniform float flow;uniform float off;uniform float hot;uniform float grow;varying vec2 UV;void main(){if(UV.x>grow)discard;if(off>.5){if(fract(UV.x*40.)>.5)discard;gl_FragColor=vec4(col,.45+hot*.35);return;}float p=exp(-pow((UV.x-flow)*12.,2.));gl_FragColor=vec4(col*(.75+hot*.35)+vec3(1.,.75,.85)*p,.55+.4*hot+.4*p);}";

function meshGeometry(d, recenter) {
  const g = new BufferGeometry();
  g.setAttribute("position", new BufferAttribute(d.pos.slice(), 3));
  if (d.idx) g.setIndex(new BufferAttribute(d.idx, 1));
  g.computeVertexNormals();
  if (!recenter) return { geometry: g, center: new Vector3() };
  g.computeBoundingBox(); const c = g.boundingBox.getCenter(new Vector3()); g.translate(-c.x, -c.y, -c.z);
  return { geometry: g, center: c };
}

export async function createBody(o) {
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
  if (!glb.skin || !glb.heart) throw new Error("Modelo do corpo incompleto");
  const scene = new Scene(), camera = new PerspectiveCamera(30, 1, .05, 50);
  camera.position.set(0, 0, DIST);
  const root = new Group(), body = new Group(); scene.add(root); root.add(body);
  const rim = (base, edge, alpha) => new ShaderMaterial({ transparent: true, depthWrite: false, vertexShader: RIM_VERTEX, fragmentShader: RIM_FRAGMENT,
    uniforms: { base: { value: new Color(css(base)) }, rim: { value: new Color(css(edge)) }, alpha: { value: alpha }, kick: { value: 0 } } });
  const skin = new Mesh(meshGeometry(glb.skin).geometry, rim("--atrium", "--violet-2", .72)); skin.renderOrder = 1; body.add(skin);
  await breathe();
  const h = meshGeometry(glb.heart, true), heart = new Mesh(h.geometry, rim("--ventricle", "--flow", 1)); heart.position.copy(h.center); heart.renderOrder = 4; body.add(heart);
  await breathe();

  let live = o.modules.map(m => m.live);
  const vessels = o.modules.map((m, i) => {
    const d = DESTINATIONS[m.dest] || DESTINATIONS.pe;
    const curve = new CatmullRomCurve3(d.route.map(p => new Vector3(...p)), false, "catmullrom", .3);
    const mat = new ShaderMaterial({ transparent: true, depthWrite: false, vertexShader: TUBE_VERTEX, fragmentShader: TUBE_FRAGMENT,
      uniforms: { col: { value: new Color(css(m.token)) }, flow: { value: -1 }, off: { value: live[i] ? 0 : 1 }, hot: { value: 0 }, grow: { value: 0 } } });
    const tube = new Mesh(new TubeGeometry(curve, 120, live[i] ? .0055 : .003, 6, false), mat); tube.renderOrder = 3; body.add(tube);
    const tip = curve.getPoint(1);
    const node = new Mesh(new SphereGeometry(.016, 16, 12), new MeshBasicMaterial({ color: css(m.token), transparent: true, opacity: live[i] ? .9 : .35, blending: AdditiveBlending, depthWrite: false }));
    node.position.copy(tip); node.scale.setScalar(.001); node.renderOrder = 5; body.add(node);
    return { mat, node, tip, token: m.token };
  });

  let destroyed = false, visible = true, onScreen = true, paused = false, frame = 0, timer = 0, beatTl = null;
  const look = { x: 0, y: 0 };
  const canDraw = () => !destroyed && visible && onScreen && !document.hidden;
  const project = () => {
    const w = o.map.clientWidth, hh = o.map.clientHeight; body.updateMatrixWorld(true);
    o.onProject(vessels.map(v => { const p = body.localToWorld(v.tip.clone()).project(camera); return { x: (p.x * .5 + .5) * w, y: (-p.y * .5 + .5) * hh }; }));
  };
  const draw = () => { frame = 0; if (!canDraw()) return; root.rotation.set(look.y * .08, look.x * .45, 0); renderer.render(scene, camera); project(); };
  const request = () => { if (!frame && canDraw()) frame = requestAnimationFrame(draw); };
  const resize = () => {
    const w = o.map.clientWidth, hh = o.map.clientHeight; if (!w || !hh) return;
    renderer.setSize(w, hh, false); camera.aspect = w / hh; camera.updateProjectionMatrix();
    // O corpo inteiro cabe na altura; em telas estreitas, também na largura entre as colunas de rótulos.
    const visH = 2 * DIST * Math.tan(MathUtils.degToRad(15)), visW = visH * camera.aspect;
    body.scale.setScalar(Math.min(visH * .94 / 1.83, visW * (w < 560 ? .56 : .5) / 1.05));
    request();
  };

  function beat(strength = .5, only = null) {
    if (paused || !canDraw()) return;
    beatTl?.kill(); gsap.killTweensOf(heart.scale); heart.scale.setScalar(1);
    vessels.forEach(v => { v.mat.uniforms.flow.value = -1; });
    beatTl = gsap.timeline({ onUpdate: request });
    beatTl.to(heart.scale, { x: 1 - .1 * strength, y: 1 - .1 * strength, z: 1 - .1 * strength, duration: .14, ease: "power2.out" }, 0)
      .to(heart.scale, { x: 1, y: 1, z: 1, duration: .55, ease: "elastic.out(1,.5)" }, .16)
      .fromTo(heart.material.uniforms.kick, { value: strength * 1.4 }, { value: 0, duration: .7 }, 0)
      .fromTo(skin.material.uniforms.kick, { value: strength * .35 }, { value: 0, duration: .9 }, .1);
    vessels.forEach((v, i) => {
      if (!live[i] || (only !== null && only !== i)) return;
      beatTl.fromTo(v.mat.uniforms.flow, { value: -.05 }, { value: 1.08, duration: only === null ? 1.5 : 1.1, ease: "power1.in" }, .2);
      // O destino acende quando o pulso chega.
      beatTl.fromTo(v.node.scale, { x: 1, y: 1, z: 1 }, { x: 1.9, y: 1.9, z: 1.9, duration: .25, ease: "power2.out", yoyo: true, repeat: 1 }, only === null ? 1.55 : 1.15);
    });
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
    gsap.to(look, { x: ((e.clientX - b.left) / b.width - .5) * 2, y: ((e.clientY - b.top) / b.height - .5) * 2, duration: .8, ease: "power2.out", overwrite: true, onUpdate: request });
  };
  o.map.addEventListener("pointermove", pointer);
  const lost = e => { e.preventDefault(); api.dispose(); o.onLost?.(); };
  renderer.domElement.addEventListener("webglcontextlost", lost);

  const api = {
    resize,
    highlight(i, on) {
      const v = vessels[i]; if (!v) return;
      gsap.to(v.mat.uniforms.hot, { value: on ? 1 : 0, duration: .2, overwrite: true, onUpdate: request });
      gsap.to(v.node.scale, { x: on ? 1.6 : 1, y: on ? 1.6 : 1, z: on ? 1.6 : 1, duration: .35, ease: "back.out(3)", overwrite: true, onUpdate: request });
      if (on && live[i]) { beat(.7, i); schedule(); }
    },
    pause(p) {
      paused = p;
      if (p) { stop(); beatTl?.kill(); heart.scale.setScalar(1); vessels.forEach(v => { v.mat.uniforms.flow.value = -1; }); request(); }
      else schedule();
    },
    visible(v) { visible = v; sync(); },
    update(next) { live = next; vessels.forEach((v, i) => { v.mat.uniforms.off.value = live[i] ? 0 : 1; v.node.material.opacity = live[i] ? .9 : .35; }); request(); },
    theme() {
      skin.material.uniforms.base.value.set(css("--atrium")); skin.material.uniforms.rim.value.set(css("--violet-2"));
      heart.material.uniforms.base.value.set(css("--ventricle")); heart.material.uniforms.rim.value.set(css("--flow"));
      vessels.forEach(v => { v.mat.uniforms.col.value.set(css(v.token)); v.node.material.color.set(css(v.token)); });
      request();
    },
    dispose() {
      if (destroyed) return; destroyed = true; stop(); beatTl?.kill(); gsap.killTweensOf([look, heart.scale]);
      io.disconnect(); ro.disconnect(); document.removeEventListener("visibilitychange", sync);
      o.map.removeEventListener("pointermove", pointer); renderer.domElement.removeEventListener("webglcontextlost", lost);
      scene.traverse(x => { x.geometry?.dispose(); x.material?.dispose(); });
      renderer.dispose(); renderer.domElement.remove();
    },
  };

  resize();
  if (!o.isCurrent()) { api.dispose(); return null; }
  // Entrada: o corpo aparece, as artérias crescem do coração até os destinos, um a um; depois a primeira batida.
  gsap.fromTo(skin.material.uniforms.alpha, { value: 0 }, { value: .72, duration: 1.2, ease: "power2.out", onUpdate: request });
  vessels.forEach((v, i) => {
    gsap.to(v.mat.uniforms.grow, { value: 1, delay: .3 + i * .1, duration: 1.1, ease: "power3.inOut", onUpdate: request });
    gsap.to(v.node.scale, { x: 1, y: 1, z: 1, delay: 1.2 + i * .1, duration: .5, ease: "back.out(3)", onUpdate: request });
  });
  timer = setTimeout(() => { beat(.6); schedule(); }, 1900);
  request();
  return api;
}
