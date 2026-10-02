/* Cada módulo ganha uma artéria, na ordem do curso. O traçado é estilizado: pontos em (azimute, elevação), em graus,
   a partir do centro do coração. Mudou um caminho aqui? Rode "node tools/arterias.mjs" para refazer src/heart/arteries.json. */
export const ARTERIES = [
  { art: "descendente anterior", path: [[2, 34], [14, 14], [26, -14], [34, -48]] },
  { art: "coronária direita", path: [[-6, 32], [-34, 22], [-62, 4], [-78, -26]] },
  { art: "circunflexa", path: [[12, 36], [44, 30], [72, 22], [96, 8]] },
  { art: "primeira diagonal", path: [[16, 10], [36, 2], [54, -12]] },
  { art: "segunda diagonal", path: [[26, -14], [44, -24], [58, -38]] },
  { art: "marginal aguda", path: [[-56, 8], [-52, -16], [-44, -42]] },
  { art: "marginal obtusa", path: [[70, 22], [84, 4], [86, -20]] },
  { art: "ramo do cone", path: [[-4, 30], [-20, 40], [-30, 46]] },
];
/* Do nono módulo em diante: ramos curtos alternando os lados. */
export const extraArtery = i => ({ art: "ramo do acervo", path: [[(i % 2 ? -1 : 1) * (20 + i * 4), 30], [(i % 2 ? -1 : 1) * (40 + i * 4), -20]] });
export const pathKey = path => JSON.stringify(path);
