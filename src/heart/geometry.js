/* Geometria compartilhada entre o navegador (heart.js) e o pré-cálculo das artérias (tools/arterias.mjs). */
import { Vector3, Raycaster, MathUtils, BufferGeometry, BufferAttribute } from "three";

/* Modelo em metros, Y para cima, +Z anterior. Centro e escala fixos levam o coração a ~4,6 unidades de altura. */
export const CENTER = new Vector3(.0187, .4761, .0376);
export const SCALE = 4.6 / .1244;
export const ATRIA = ["VH_M_left_cardiac_atrium", "VH_M_right_cardiac_atrium"];
export const VENTRICLES = ["VH_M_heart_left_ventricle", "VH_M_heart_right_ventricle", "VH_M_interventricular_septum"];
export const VALVES = ["VH_M_mitral_valve", "VH_M_tricuspid_valve", "VH_M_aortic_valve", "VH_M_pulmonary_valve"];
const SAMPLES = 9, LIFT = .045, ORIGIN = new Vector3(.1, -.2, 0);

/* Geometria escalada e recentrada (cada câmara contrai no próprio lugar); "center" é onde a malha fica. */
export function chamberGeometry(d) {
  const g = new BufferGeometry(), p = d.pos.slice();
  for (let i = 0; i < p.length; i += 3) { p[i] = (p[i] - CENTER.x) * SCALE; p[i + 1] = (p[i + 1] - CENTER.y) * SCALE; p[i + 2] = (p[i + 2] - CENTER.z) * SCALE; }
  g.setAttribute("position", new BufferAttribute(p, 3));
  if (d.idx) g.setIndex(new BufferAttribute(d.idx, 1));
  if (d.nor) g.setAttribute("normal", new BufferAttribute(d.nor, 3)); else g.computeVertexNormals();
  g.computeBoundingBox(); const center = g.boundingBox.getCenter(new Vector3()); g.translate(-center.x, -center.y, -center.z);
  return { geometry: g, center };
}

/* Pontos de uma artéria sobre a superfície: amostra o caminho (azimute, elevação), acha a superfície por raio
   e sobe um pouco pela normal. "yieldEvery" deixa quem chama devolver a vez ao navegador entre raios. */
export async function traceArtery(path, surfaces, yieldEvery) {
  const ray = new Raycaster(), pts = [];
  for (let k = 0; k < path.length - 1; k++) for (let s = 0; s < SAMPLES; s++) {
    const t = s / (SAMPLES - 1), a = path[k], b = path[k + 1];
    const az = MathUtils.degToRad(a[0] + (b[0] - a[0]) * t), el = MathUtils.degToRad(a[1] + (b[1] - a[1]) * t);
    const dir = new Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
    ray.set(ORIGIN.clone().addScaledVector(dir, 12), dir.clone().negate());
    const hit = ray.intersectObjects(surfaces, false)[0];
    if (hit) pts.push(hit.point.addScaledVector(hit.face.normal.clone().transformDirection(hit.object.matrixWorld), LIFT));
    if (yieldEvery) await yieldEvery();
  }
  return pts;
}
