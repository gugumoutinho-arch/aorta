/* Folha 3D (protótipo v4): lâmina translúcida com borda iluminada, nervura central e uma nervura por módulo;
   a seiva (pulso de luz) corre de tempos em tempos só nas nervuras com material. Mesmo contrato do coração
   (heart.js): resize, highlight, pause, visible, update, theme, dispose; render sob demanda. */
import { WebGLRenderer, Scene, PerspectiveCamera, Group, Vector2, Vector3, Color, ShaderMaterial, PlaneGeometry, BufferAttribute, Mesh,
  CatmullRomCurve3, TubeGeometry, DoubleSide, AdditiveBlending, MathUtils, SRGBColorSpace } from "three";
import gsap from "gsap";
import { LEAF_L, leafHalfWidth, leafVein, quad } from "../views/concept.js";

const IDLE_MS = 3200;
const css = token => getComputedStyle(document.documentElement).getPropertyValue(token).trim();
const bend = (x, y) => -.16 * x * x + .22 * Math.sin(y * .55) - .04 * y;

const BLADE_VERTEX = "attribute float aEdge;varying float vEdge;varying vec2 vXY;varying vec3 vN;void main(){vEdge=aEdge;vXY=position.xy;vN=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}";
const BLADE_FRAGMENT = `uniform vec3 deep;uniform vec3 mid;uniform vec3 rim;uniform vec2 light;uniform float glow;uniform float reveal;varying float vEdge;varying vec2 vXY;varying vec3 vN;
void main(){float t=(vXY.y+${LEAF_L.toFixed(2)})/${(2 * LEAF_L).toFixed(2)};
vec3 col=mix(deep,mid,smoothstep(0.,1.,t)*.85+.15*(1.-vEdge));
float fine=smoothstep(.46,.5,abs(fract((vXY.y*1.15+abs(vXY.x)*.95)*3.2)-.5))*(1.-vEdge)*.10;
float cell=smoothstep(.47,.5,abs(fract((vXY.y*3.1-abs(vXY.x)*2.3)*1.6)-.5))*.045;
col+=rim*(fine+cell);float r=smoothstep(.72,1.,vEdge);col=mix(col,rim,r*.55);
col+=rim*exp(-distance(vXY,light)*.75)*(.18+glow*.3);col+=rim*pow(1.-abs(vN.z),2.)*.3;
gl_FragColor=vec4(col,(.82+r*.12)*reveal);}`;
const TUBE_VERTEX = "varying vec2 UV;void main(){UV=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}";
const TUBE_FRAGMENT = "uniform vec3 col;uniform float flow;uniform float off;uniform float hot;uniform float grow;varying vec2 UV;void main(){if(UV.x>grow)discard;if(off>.5){if(fract(UV.x*22.)>.5)discard;gl_FragColor=vec4(col,.5+hot*.3);return;}float p=exp(-pow((UV.x-flow)*9.,2.));gl_FragColor=vec4(col*(1.+hot*.25)+vec3(.75,.95,.7)*p*.8,.95);}";

export async function createLeaf(o) {
  const renderer = new WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.domElement.setAttribute("aria-hidden", "true");
  o.map.prepend(renderer.domElement);
  try { return await assemble(o, renderer); }
  catch (e) { renderer.dispose(); renderer.domElement.remove(); throw e; }
}

async function assemble(o, renderer) {
  const scene = new Scene(), camera = new PerspectiveCamera(30, 1, .1, 100);
  camera.position.set(0, 0, 14.5);
  const root = new Group(), leaf = new Group(); scene.add(root); root.add(leaf);

  // Lâmina: grade deformada pela meia-largura analítica e por uma curvatura leve (folha côncava).
  const geo = new PlaneGeometry(2, 2 * LEAF_L, 36, 120);
  const pos = geo.attributes.position, edge = new Float32Array(pos.count);
  for (let i = 0; i < pos.count; i++) { const u = pos.getX(i), y = pos.getY(i), x = u * leafHalfWidth(y); pos.setXYZ(i, x, y, bend(x, y)); edge[i] = Math.abs(u); }
  geo.setAttribute("aEdge", new BufferAttribute(edge, 1)); geo.computeVertexNormals();
  const blade = { deep: { value: new Color(css("--atrium")) }, mid: { value: new Color(css("--ventricle")) }, rim: { value: new Color(css("--violet-2")) },
    light: { value: new Vector2(0, .5) }, glow: { value: 0 }, reveal: { value: 0 } };
  leaf.add(new Mesh(geo, new ShaderMaterial({ uniforms: blade, transparent: true, depthWrite: false, side: DoubleSide, vertexShader: BLADE_VERTEX, fragmentShader: BLADE_FRAGMENT })));

  const curveOn = pts => new CatmullRomCurve3(pts.map(([x, y, lift = .03]) => new Vector3(x, y, bend(x, y) + lift)));
  const tube = (curve, r, token, isOff) => {
    const mat = new ShaderMaterial({ transparent: true, depthWrite: false, vertexShader: TUBE_VERTEX, fragmentShader: TUBE_FRAGMENT,
      uniforms: { col: { value: new Color(css(token)) }, flow: { value: -1 }, off: { value: isOff ? 1 : 0 }, hot: { value: 0 }, grow: { value: 0 } } });
    const m = new Mesh(new TubeGeometry(curve, 80, r, 8, false), mat); m.renderOrder = 3; leaf.add(m); return mat;
  };
  const midrib = tube(curveOn([[0, -LEAF_L - .45], [.02, -LEAF_L], [-.02, -1], [.03, 1.2], [0, LEAF_L - .12]]), .022, "--leaf", false);
  let live = o.modules.map(m => m.live);
  const n = o.modules.length;
  const veins = o.modules.map((m, i) => {
    const v = leafVein(i, n), curve = curveOn(Array.from({ length: 9 }, (_, k) => quad(v.points, k / 8)));
    return { mat: tube(curve, live[i] ? .03 : .018, m.token, !live[i]), tip: curve.getPoint(1), token: m.token, side: v.side };
  });

  let destroyed = false, visible = true, onScreen = true, paused = false, frame = 0, timer = 0, pulseTl = null;
  const look = { x: 0, y: 0 };
  const canDraw = () => !destroyed && visible && onScreen && !document.hidden;
  let wide = true;
  const project = () => {
    const w = o.map.clientWidth, h = o.map.clientHeight; leaf.updateMatrixWorld(true);
    o.onProject(veins.map(v => { const p = leaf.localToWorld(v.tip.clone()).project(camera); return { x: (p.x * .5 + .5) * w, y: (-p.y * .5 + .5) * h }; }));
  };
  const draw = () => {
    frame = 0; if (!canDraw()) return;
    root.rotation.set(look.y * .16, look.x * .28, 0);
    blade.light.value.set(look.x * 1.6, -look.y * 2.2 + .6);
    renderer.render(scene, camera); project();
  };
  const request = () => { if (!frame && canDraw()) frame = requestAnimationFrame(draw); };
  const resize = () => {
    const w = o.map.clientWidth, h = o.map.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    wide = w > 640;
    // Em pé e menor no celular, para caber entre as colunas de rótulos; deitada na diagonal no computador.
    leaf.rotation.set(wide ? -.3 : -.24, wide ? .14 : .05, wide ? -.32 : -.05);
    const visibleWidth = 2 * 14.5 * Math.tan(MathUtils.degToRad(15)) * camera.aspect;
    leaf.scale.setScalar(wide ? Math.min(1.22, visibleWidth / 5.4) : Math.min(.92, visibleWidth / 5.6));
    leaf.position.set(0, wide ? -.05 : -.15, 0);
    request();
  };

  function pulse(only = null) {
    if (paused || !canDraw()) return;
    pulseTl?.kill();
    veins.forEach(v => { v.mat.uniforms.flow.value = -1; });
    pulseTl = gsap.timeline({ onUpdate: request });
    pulseTl.fromTo(midrib.uniforms.flow, { value: -.1 }, { value: 1.1, duration: 1.2, ease: "power1.inOut" }, 0);
    veins.forEach((v, i) => { if (live[i] && (only === null || only === i)) pulseTl.fromTo(v.mat.uniforms.flow, { value: -.1 }, { value: 1.15, duration: 1, ease: "power1.in" }, only === null ? .55 + i * .06 : 0); });
    pulseTl.fromTo(blade.glow, { value: .5 }, { value: 0, duration: 1.4, ease: "power2.out" }, 0);
  }
  const stop = () => { clearTimeout(timer); timer = 0; pulseTl?.pause(); if (frame) cancelAnimationFrame(frame); frame = 0; };
  const schedule = () => { clearTimeout(timer); if (!canDraw() || paused) return; timer = setTimeout(() => { pulse(); schedule(); }, IDLE_MS); };
  const sync = () => { if (!canDraw()) stop(); else { pulseTl?.resume(); request(); schedule(); } };

  const io = new IntersectionObserver(es => { onScreen = es[0].isIntersecting; sync(); }); io.observe(o.map);
  const ro = new ResizeObserver(resize); ro.observe(o.map);
  document.addEventListener("visibilitychange", sync);
  const pointer = e => {
    if (paused || !canDraw() || e.pointerType === "touch") return;
    const b = o.map.getBoundingClientRect();
    gsap.to(look, { x: ((e.clientX - b.left) / b.width - .5) * 2, y: ((e.clientY - b.top) / b.height - .5) * 2, duration: .7, ease: "power2.out", overwrite: true, onUpdate: request });
  };
  o.map.addEventListener("pointermove", pointer);
  const lost = e => { e.preventDefault(); api.dispose(); o.onLost?.(); };
  renderer.domElement.addEventListener("webglcontextlost", lost);

  const api = {
    resize,
    highlight(i, on) {
      const v = veins[i]; if (!v) return;
      gsap.to(v.mat.uniforms.hot, { value: on ? 1 : 0, duration: .2, overwrite: true, onUpdate: request });
      gsap.to(look, { x: on ? v.side * .35 : 0, duration: .8, ease: "power2.out", overwrite: "auto", onUpdate: request });
      if (on && live[i]) { pulse(i); schedule(); }
    },
    pause(p) {
      paused = p;
      if (p) { stop(); pulseTl?.kill(); veins.forEach(v => { v.mat.uniforms.flow.value = -1; }); midrib.uniforms.flow.value = -1; request(); }
      else schedule();
    },
    visible(v) { visible = v; sync(); },
    update(next) { live = next; veins.forEach((v, i) => { v.mat.uniforms.off.value = live[i] ? 0 : 1; }); request(); },
    theme() {
      blade.deep.value.set(css("--atrium")); blade.mid.value.set(css("--ventricle")); blade.rim.value.set(css("--violet-2"));
      midrib.uniforms.col.value.set(css("--leaf"));
      veins.forEach(v => v.mat.uniforms.col.value.set(css(v.token)));
      request();
    },
    dispose() {
      if (destroyed) return; destroyed = true; stop(); pulseTl?.kill(); gsap.killTweensOf([look, blade.reveal, blade.glow]);
      io.disconnect(); ro.disconnect(); document.removeEventListener("visibilitychange", sync);
      o.map.removeEventListener("pointermove", pointer); renderer.domElement.removeEventListener("webglcontextlost", lost);
      scene.traverse(x => { x.geometry?.dispose(); x.material?.dispose(); });
      renderer.dispose(); renderer.domElement.remove();
    },
  };

  resize();
  if (!o.isCurrent()) { api.dispose(); return null; }
  // Entrada: a lâmina aparece, a nervura central cresce, depois as laterais, uma a uma; então a primeira seiva.
  const grow = (mat, delay, duration) => gsap.to(mat.uniforms.grow, { value: 1, delay, duration, ease: "power3.inOut", onUpdate: request });
  gsap.to(blade.reveal, { value: 1, duration: 1.2, ease: "power2.out", onUpdate: request });
  grow(midrib, .15, 1);
  veins.forEach((v, i) => grow(v.mat, .7 + i * .08, .7));
  timer = setTimeout(() => { pulse(); schedule(); }, 1600);
  request();
  return api;
}
