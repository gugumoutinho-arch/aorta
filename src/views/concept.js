/* Protótipo v4: dois conceitos visuais para o mesmo acervo.
   - coração: cada módulo é uma artéria sobre um coração anatômico (modelo HuBMAP), com batimento e pulso de luz;
   - folha: cada módulo é uma nervura de uma folha, com a seiva correndo pelas que têm material.
   Cada conceito diz: forma do mapa em linhas (SVG 600×560), traçado e ponta de cada caminho, lado do rótulo,
   textos e quem desenha o 3D. O resto (rótulos, linhas-guia, páginas) é o mesmo. */
import { S } from "../core/state.js";

const f1 = n => n.toFixed(1);
function smoothPath(p) {
  let d = `M${f1(p[0][0])} ${f1(p[0][1])}`;
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] || p[i], p1 = p[i], p2 = p[i + 1], p3 = p[i + 2] || p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${f1(c1[0])} ${f1(c1[1])} ${f1(c2[0])} ${f1(c2[1])} ${f1(p2[0])} ${f1(p2[1])}`;
  }
  return d;
}

/* ---------- coração: projeção frontal de (azimute, elevação), igual ao 3D ---------- */
const heartPoint = ([az, el]) => {
  const a = az * Math.PI / 180, e = el * Math.PI / 180;
  return [300 + 175 * Math.sin(a) * Math.cos(e), 272 - 205 * Math.sin(e)];
};
const HEART_OUTLINE = ["M271 81C228 45 180 134 169 206S179 349 253 408C295 450 328 488 350 457S441 348 444 256S407 113 353 113L336 65M271 81L271 46M296 78L301 33M318 97L329 50",
  "M283 155C202 126 183 233 215 305S287 397 339 436M294 160C337 123 399 184 406 255S375 358 347 425M295 170Q326 254 321 361"];

/* ---------- folha: lâmina analítica, nervura central e uma nervura lateral por módulo ---------- */
export const LEAF_L = 3.1;
export const leafHalfWidth = y => { const t = (y + LEAF_L) / (2 * LEAF_L); if (t <= 0 || t >= 1) return 0; return 1.75 * Math.pow(Math.sin(Math.PI * t), .82) * (1 - .22 * t); };
/* Nervura i de n: nasce na central e abre para um lado, alternando; devolve 3 pontos de controle (curva quadrática). */
export function leafVein(i, n) {
  const L = LEAF_L, y0 = -L + 2 * L * (.13 + i * (.62 / Math.max(1, n - 1))), side = i % 2 ? 1 : -1;
  const ye = Math.min(L - .6, y0 + .95), xe = side * .86 * leafHalfWidth(ye), xc = side * .5 * leafHalfWidth(y0 + .45);
  return { side, points: [[0, y0], [xc, y0 + .38], [xe, ye]] };
}
export const quad = ([a, b, c], s) => { const u = 1 - s; return [u * u * a[0] + 2 * u * s * b[0] + s * s * c[0], u * u * a[1] + 2 * u * s * b[1] + s * s * c[1]]; };
const leafSvg = ([x, y]) => [300 + x * 95, 282 - y * 80];
function leafOutline() {
  const right = [], left = [];
  for (let k = 0; k <= 40; k++) { const y = -LEAF_L + 2 * LEAF_L * k / 40; right.push(leafSvg([leafHalfWidth(y), y])); left.unshift(leafSvg([-leafHalfWidth(y), y])); }
  const pts = [...right, ...left];
  return [pts.map((p, i) => (i ? "L" : "M") + f1(p[0]) + " " + f1(p[1])).join("") + "Z",
    `M${f1(leafSvg([0, -LEAF_L - .45])[0])} ${f1(leafSvg([0, -LEAF_L - .45])[1])}L${f1(leafSvg([0, LEAF_L - .12])[0])} ${f1(leafSvg([0, LEAF_L - .12])[1])}`];
}

export const CONCEPTS = {
  coracao: {
    brand: "Aorta", title: "Aorta", footer: "O curso inteiro, irrigado módulo a módulo.",
    pause: ["Pausar batimento", "Retomar batimento"], loading: "Preparando o coração", loadingModel: "Carregando o coração",
    state3d: "Artérias estilizadas · escolha um caminho.", caption: "vista anterior", back: "← Voltar ao coração", flatWhat: "Mapa em linhas",
    outline: () => HEART_OUTLINE,
    side: m => m.path.at(-1)[0] >= 0 ? "right" : "left",
    flat: m => { const p = m.path.map(heartPoint); return { d: smoothPath(p), tip: p.at(-1) }; },
    geometryKey: list => JSON.stringify(list.map(m => [m.id, m.path])),
    load: () => import("../heart/heart.js").then(x => x.createHeart),
  },
  folha: {
    brand: "MedLeaf", title: "MedLeaf", footer: "Cada nervura, um caminho do curso.",
    pause: ["Pausar a seiva", "Retomar a seiva"], loading: "Abrindo a folha", loadingModel: "Abrindo a folha",
    state3d: "Nervuras estilizadas · escolha um caminho.", caption: "a folha", back: "← Voltar à folha", flatWhat: "Folha em linhas",
    outline: leafOutline,
    side: (m, n) => leafVein(m.index, n).side > 0 ? "right" : "left",
    flat: (m, n) => { const v = leafVein(m.index, n), p = Array.from({ length: 9 }, (_, k) => leafSvg(quad(v.points, k / 8))); return { d: smoothPath(p), tip: p.at(-1) }; },
    geometryKey: list => JSON.stringify(list.map(m => m.id)),
    load: () => import("../leaf/leaf.js").then(x => x.createLeaf),
  },
};
export const concept = () => CONCEPTS[S.concept] || CONCEPTS.coracao;
