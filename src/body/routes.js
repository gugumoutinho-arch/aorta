/* Conceito "corpo" (protótipo v4): cada módulo é um destino do corpo, alcançado por uma artéria que sai do coração.
   Coordenadas em metros no referencial do modelo "Visible Human Male" do HuBMAP (Y para cima, +Z anterior,
   +X = lado esquerdo do paciente = direita de quem olha de frente). Traçado estilizado, não anatomia para estudo. */
export const HEART_POS = [0.035, 0.405, 0.035];

/* Trechos de artéria reaproveitados pelos caminhos. */
const ROOT = [[0.02, 0.44, 0.04], [0.01, 0.5, 0.02]];
const AORTA = [...ROOT, [-0.005, 0.47, -0.04], [0, 0.3, -0.05], [0, 0.12, -0.05]];
const LEG = side => [...AORTA, [0, 0.0, -0.03], [side * 0.08, -0.07, 0.01], [side * 0.13, -0.2, 0.04]];

export const DESTINATIONS = {
  pe: { label: "Pé", art: "a. dorsal do pé", route: [...LEG(1), [0.15, -0.42, 0.03], [0.18, -0.68, 0.0], [0.2, -0.86, 0.07]] },
  mao: { label: "Mão", art: "a. radial", route: [...ROOT, [-0.07, 0.53, 0.0], [-0.17, 0.52, -0.01], [-0.26, 0.42, 0.0], [-0.3, 0.27, 0.01], [-0.37, 0.14, 0.02], [-0.43, 0.04, 0.03], [-0.47, -0.03, 0.03]] },
  cerebro: { label: "Cérebro", art: "a. carótida interna", route: [...ROOT, [0.03, 0.6, 0.03], [0.035, 0.7, 0.04], [0.03, 0.78, 0.03], [0.01, 0.84, 0.0]] },
  rim: { label: "Rim", art: "a. renal", route: [...AORTA, [0.04, 0.13, -0.06], [0.09, 0.14, -0.07]] },
  figado: { label: "Fígado", art: "tronco celíaco · a. hepática", route: [...AORTA.slice(0, 4), [0, 0.24, -0.03], [-0.03, 0.23, 0.02], [-0.1, 0.25, 0.05]] },
  pulmao: { label: "Pulmão", art: "a. pulmonar", route: [[0.03, 0.44, 0.06], [0.06, 0.48, 0.03], [0.1, 0.47, 0.01], [0.15, 0.44, 0.0]] },
  joelho: { label: "Joelho", art: "a. poplítea", route: [...LEG(-1), [-0.15, -0.3, 0.03], [-0.15, -0.42, 0.04]] },
  olho: { label: "Olho", art: "a. oftálmica", route: [...ROOT, [-0.03, 0.6, 0.03], [-0.035, 0.7, 0.05], [-0.03, 0.76, 0.07], [-0.03, 0.78, 0.1]] },
  pelve: { label: "Pelve", art: "a. ilíaca interna", route: [...AORTA, [0, 0.0, -0.03], [-0.05, -0.05, 0.0], [-0.03, -0.09, 0.05]] },
  estomago: { label: "Estômago", art: "a. gástrica esquerda", route: [...AORTA.slice(0, 4), [0, 0.25, -0.03], [0.04, 0.26, 0.03], [0.07, 0.27, 0.07]] },
};

/* Ordem padrão dos módulos do curso (M1 vai para o pé, como o dono pediu). */
const ORDER = ["pe", "mao", "cerebro", "rim", "figado", "pulmao", "joelho", "olho", "pelve", "estomago"];
/* Disciplinas de medicina geral vão para onde fazem sentido. */
const BY_NAME = [[/anat/, "mao"], [/fisio/, "rim"], [/histo/, "olho"], [/embrio/, "pelve"], [/pato/, "figado"], [/farmaco/, "estomago"], [/semio/, "pulmao"], [/neuro/, "cerebro"], [/cardio/, "pulmao"], [/orto/, "joelho"]];
const plain = s => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/* Destino de cada módulo da lista; sem repetir enquanto houver destino livre. */
export function destinationsFor(mods) {
  const used = new Set(), out = [];
  for (const m of mods) {
    const hit = BY_NAME.find(([re]) => re.test(plain(m.name)));
    const key = hit && !used.has(hit[1]) ? hit[1] : ORDER.find(k => !used.has(k)) || ORDER[m.index % ORDER.length];
    used.add(key); out.push(key);
  }
  return out;
}
