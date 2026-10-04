/* Conceito "corpo" (protótipo v4): cada módulo é um destino do corpo, alcançado por uma artéria que sai do coração.
   Coordenadas em metros no referencial do modelo "United Male" do HuBMAP (Y para cima, +Z anterior, +X = lado esquerdo
   do paciente = direita de quem olha de frente); o fim de cada caminho é o centro do órgão (src/body/anatomy.json).
   Traçado estilizado, não anatomia para estudo. */

/* Trechos reaproveitados: raiz da aorta, arco, aorta descendente e membros inferiores. */
const ROOT = [[0.015, 0.5, 0.045], [0.012, 0.54, 0.03], [0.0, 0.565, 0.005]];
const DESC = [...ROOT, [0.012, 0.545, -0.03], [0.015, 0.45, -0.045], [0.012, 0.32, -0.045]];
const ABD = [...DESC, [0.008, 0.2, -0.04], [0.004, 0.13, -0.03]];
const LEG = s => [...ABD, [s * 0.05, 0.06, 0.0], [s * 0.1, -0.05, 0.03], [s * 0.125, -0.2, 0.04]];

export const DESTINATIONS = {
  /* Cardiologia: sai da raiz da aorta pela coronária esquerda e desce pela face anterior até perto do ápice
     (caixa do coração em src/body/anatomy.json; malha "heart" do corpo.glb). */
  coracao: { label: "Coração", art: "a. coronária esquerda · descendente anterior", organ: ["heart"], route: [[0.015, 0.5, 0.045], [0.03, 0.505, 0.07], [0.05, 0.485, 0.085], [0.065, 0.46, 0.08], [0.072, 0.44, 0.07]] },
  pe: { label: "Pé", art: "a. dorsal do pé", route: [...LEG(1), [0.14, -0.39, 0.03], [0.175, -0.62, 0.0], [0.19, -0.8, 0.02], [0.195, -0.865, 0.07]] },
  mao: { label: "Mão", art: "a. radial", route: [...ROOT.slice(0, 2), [-0.05, 0.575, 0.0], [-0.16, 0.56, -0.01], [-0.25, 0.46, 0.0], [-0.3, 0.29, 0.01], [-0.37, 0.15, 0.02], [-0.43, 0.05, 0.03], [-0.47, -0.02, 0.03]] },
  cerebro: { label: "Cérebro", art: "a. carótida interna", organ: ["brain_tel", "brain_dien", "brain_tronco", "brain_cerebelo"], route: [...ROOT.slice(0, 2), [0.025, 0.62, 0.03], [0.03, 0.7, 0.035], [0.022, 0.77, 0.02], [0.0, 0.835, 0.0]] },
  olho: { label: "Olho", art: "a. oftálmica", organ: ["eyes"], route: [...ROOT.slice(0, 2), [-0.022, 0.62, 0.03], [-0.03, 0.7, 0.04], [-0.028, 0.78, 0.06], [-0.023, 0.811, 0.086]] },
  pulmao: { label: "Pulmão", art: "a. pulmonar", organ: ["lungs"], route: [[0.012, 0.47, 0.07], [0.03, 0.52, 0.05], [0.06, 0.53, 0.03], [0.085, 0.5, 0.01]] },
  figado: { label: "Fígado", art: "tronco celíaco · a. hepática", organ: ["liver"], route: [...DESC.slice(0, 5), [0.012, 0.41, -0.045], [0.0, 0.4, -0.01], [-0.035, 0.385, 0.02], [-0.06, 0.375, 0.04]] },
  rim: { label: "Rim", art: "a. renal", organ: ["kidneys"], route: [...DESC, [0.04, 0.3, -0.04], [0.075, 0.29, -0.03]] },
  intestino: { label: "Intestino", art: "a. mesentérica superior", organ: ["intestine"], route: [...DESC.slice(0, 5), [0.012, 0.37, -0.04], [0.02, 0.32, 0.02], [0.03, 0.26, 0.06], [0.035, 0.23, 0.08]] },
  pelve: { label: "Pelve", art: "a. ilíaca interna", organ: ["pelvis"], route: [...ABD, [-0.04, 0.08, -0.01], [-0.06, 0.05, 0.02], [-0.05, 0.04, 0.05]] },
  joelho: { label: "Joelho", art: "a. poplítea", organ: ["knees"], route: [...LEG(-1), [-0.135, -0.3, 0.03], [-0.14, -0.39, 0.05]] },
};

/* Ordem padrão dos módulos do curso (M1 vai para o pé, como o dono pediu). */
const ORDER = ["pe", "mao", "cerebro", "rim", "figado", "pulmao", "joelho", "olho", "pelve", "intestino", "coracao"];
/* Disciplinas de medicina geral vão para onde fazem sentido. */
const BY_NAME = [[/cardio/, "coracao"], [/neuro/, "cerebro"], [/anat/, "mao"], [/fisio/, "rim"], [/histo/, "olho"], [/embrio/, "pelve"], [/pato/, "figado"], [/farmaco/, "intestino"], [/semio/, "pulmao"], [/orto/, "joelho"]];
const plain = s => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/* Destino de cada módulo da lista; sem repetir enquanto houver destino livre. Primeiro os nomes reconhecidos, depois os
   outros pela ordem do curso (índice), para o destino de cada um não depender da ordem do array. */
export function destinationsFor(mods) {
  const used = new Set(), out = new Map();
  const ranked = [...mods].sort((a, b) => (a.index ?? 0) - (b.index ?? 0) || plain(a.name).localeCompare(plain(b.name)));
  for (const m of ranked) {
    const hit = BY_NAME.find(([re]) => re.test(plain(m.name)));
    if (hit && !used.has(hit[1])) { used.add(hit[1]); out.set(m, hit[1]); }
  }
  for (const m of ranked) {
    if (out.has(m)) continue;
    const key = ORDER.find(k => !used.has(k)) || ORDER[(m.index ?? 0) % ORDER.length];
    used.add(key); out.set(m, key);
  }
  return mods.map(m => out.get(m));
}

/* Dono de cada malha acesa: órgão (ou o coração, para Cardiologia) → índice do módulo cujo destino o inclui.
   O corpo usa isto para realçar, pulsar e colorir o destino; o coração deixa de ser só a bomba quando é destino. */
export function organOwners(mods) {
  const owner = {};
  mods.forEach((m, i) => (DESTINATIONS[m.dest]?.organ || []).forEach(k => { owner[k] = i; }));
  return owner;
}

/* Brilho dos destinos. A bomba (coração) é de todos: o batimento de repouso não a acende; só a Cardiologia apontada.
   Depois do pulso, fica no realce (1,2) enquanto o módulo está apontado; a bomba, só se a Cardiologia tiver material. */
export const lightsOnArrival = (organ, i, only) => !organ.pump || only === i;
export const restingGlow = (organ, i, hot, live) => (hot.has(i) && (!organ.pump || live[i]) ? 1.2 : 0);

/* Divisões do encéfalo (para a página do módulo que leva ao cérebro): unidade com esse nome acende a parte. */
export const BRAIN_PARTS = [
  { key: "brain_tel", label: "Telencéfalo", match: /telenc|cortex|cerebr(o|al) |hemisf/ },
  { key: "brain_dien", label: "Diencéfalo", match: /dienc|talam|hipotal/ },
  { key: "brain_tronco", label: "Tronco encefálico", match: /tronco|mesenc|ponte|bulbo|medula oblong/ },
  { key: "brain_cerebelo", label: "Cerebelo", match: /cerebel/ },
  { key: "spinal_cord", label: "Medula espinal", match: /medula espinal|medula$/ },
];
export const partFor = name => BRAIN_PARTS.find(p => p.match.test(plain(name)));
