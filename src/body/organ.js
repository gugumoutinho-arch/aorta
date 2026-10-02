/* Órgão em destaque na página do módulo (conceito "corpo"): o destino do módulo isolado em 3D.
   Quando as unidades do módulo são estruturas do órgão (ex.: encéfalo → telencéfalo, diencéfalo, tronco encefálico,
   cerebelo, medula espinal), cada parte acende com a unidade escolhida e um toque na parte abre a unidade.
   Render sob demanda; gira com o ponteiro ou arrastando; sem animação contínua. */
import { WebGLRenderer, Scene, PerspectiveCamera, Group, Vector2, Vector3, Color, ShaderMaterial, BufferGeometry, BufferAttribute, Mesh, Raycaster, Box3, SRGBColorSpace } from "three";
import gsap from "gsap";
import { loadGLB } from "../heart/glb.js";

const css = token => getComputedStyle(document.documentElement).getPropertyValue(token).trim();
const VERT = "varying vec3 N;varying vec3 V;void main(){vec4 p=modelViewMatrix*vec4(position,1.);N=normalize(normalMatrix*normal);V=normalize(-p.xyz);gl_Position=projectionMatrix*p;}";
const FRAG = "uniform vec3 base;uniform vec3 rim;uniform float on;varying vec3 N;varying vec3 V;void main(){float f=pow(1.-abs(dot(normalize(N),normalize(V))),2.);float k=max(dot(normalize(N),normalize(vec3(-.3,.6,.7))),0.);vec3 c=mix(base*(.3+.5*k),rim*(.55+.6*k),on)+rim*f*(.5+on);gl_FragColor=vec4(c,mix(.1,.95,on)*(.35+.65*f)+on*.25);}";
let glbPromise = null;

export async function createOrganView(container, { url, keys, frame, token, onPick, yaw = 0 }) {
  glbPromise ||= loadGLB(url);
  const glb = await glbPromise;
  const renderer = new WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.outputColorSpace = SRGBColorSpace;
  renderer.domElement.setAttribute("aria-hidden", "true");
  container.replaceChildren(renderer.domElement);
  const scene = new Scene(), camera = new PerspectiveCamera(28, 1, .005, 10), root = new Group(); scene.add(root);
  const parts = keys.filter(k => glb[k]).map(k => {
    const g = new BufferGeometry(); g.setAttribute("position", new BufferAttribute(glb[k].pos.slice(), 3)); g.setIndex(new BufferAttribute(glb[k].idx, 1)); g.computeVertexNormals();
    const mat = new ShaderMaterial({ transparent: true, depthWrite: false, vertexShader: VERT, fragmentShader: FRAG, uniforms: { base: { value: new Color(css("--atrium")) }, rim: { value: new Color(css(token)) }, on: { value: 1 } } });
    const mesh = new Mesh(g, mat); mesh.userData.key = k; root.add(mesh); return mesh;
  });
  // Enquadra pelas partes principais ("frame"); o resto (ex.: medula espinal) pode sair da moldura.
  const box = new Box3(); parts.filter(m => !frame || frame.includes(m.userData.key)).forEach(m => box.expandByObject(m));
  const center = box.getCenter(new Vector3()), size = box.getSize(new Vector3());
  root.children.forEach(m => m.position.sub(center));
  const radius = Math.max(size.x, size.y, size.z) * .62;
  const look = { x: 0, y: 0 }, spin = { y: yaw - .6 };
  let frame_ = 0, destroyed = false, active = null;
  const draw = () => { frame_ = 0; if (destroyed) return; root.rotation.set(look.y * .25, spin.y + look.x * .5, 0); renderer.render(scene, camera); };
  const request = () => { if (!frame_ && !destroyed) frame_ = requestAnimationFrame(draw); };
  const resize = () => {
    const w = container.clientWidth, h = container.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); camera.aspect = w / h;
    camera.position.set(0, 0, radius / Math.tan(14 * Math.PI / 180) / Math.min(1, camera.aspect)); camera.updateProjectionMatrix(); request();
  };
  const ro = new ResizeObserver(resize); ro.observe(container);
  // Ponteiro inclina; arrastar gira; toque numa parte escolhe a unidade.
  let drag = null; const ray = new Raycaster(), ndc = new Vector2();
  const move = e => {
    const r = container.getBoundingClientRect();
    if (drag) { spin.y = drag.spin + (e.clientX - drag.x) / r.width * 3; request(); return; }
    if (e.pointerType === "touch") return;
    gsap.to(look, { x: ((e.clientX - r.left) / r.width - .5) * 2, y: ((e.clientY - r.top) / r.height - .5) * 2, duration: .6, ease: "power2.out", overwrite: true, onUpdate: request });
  };
  const down = e => { drag = { x: e.clientX, spin: spin.y, moved: false }; container.setPointerCapture?.(e.pointerId); };
  const up = e => {
    const d = drag; drag = null; if (!d || Math.abs(e.clientX - d.x) > 6 || !onPick) return;
    const r = container.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera); const hit = ray.intersectObjects(parts, false)[0]; if (hit) onPick(hit.object.userData.key);
  };
  container.addEventListener("pointermove", move); container.addEventListener("pointerdown", down); container.addEventListener("pointerup", up);

  const api = {
    /* Acende só as partes indicadas (null = todas). */
    setActive(keysOn) {
      active = keysOn;
      parts.forEach(m => gsap.to(m.material.uniforms.on, { value: !keysOn || keysOn.includes(m.userData.key) ? 1 : 0, duration: .45, ease: "power2.out", overwrite: true, onUpdate: request }));
    },
    theme() { parts.forEach(m => { m.material.uniforms.base.value.set(css("--atrium")); m.material.uniforms.rim.value.set(css(token)); }); request(); },
    dispose() {
      destroyed = true; if (frame_) cancelAnimationFrame(frame_); gsap.killTweensOf([look, spin]); parts.forEach(m => gsap.killTweensOf(m.material.uniforms.on));
      ro.disconnect(); container.removeEventListener("pointermove", move); container.removeEventListener("pointerdown", down); container.removeEventListener("pointerup", up);
      parts.forEach(m => { m.geometry.dispose(); m.material.dispose(); }); renderer.dispose(); renderer.domElement.remove();
    },
    get active() { return active; },
  };
  resize();
  // Entrada: o órgão gira um quarto de volta até ficar de frente e cresce.
  root.scale.setScalar(.7);
  gsap.to(root.scale, { x: 1, y: 1, z: 1, duration: 1.1, ease: "expo.out", onUpdate: request });
  gsap.to(spin, { y: yaw, duration: 1.4, ease: "expo.out", onUpdate: request });
  return api;
}
