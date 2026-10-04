/* Coreografia da interface (DESIGN.md › Movimento): entrar, sair, trocar, pressionar e revelar, sempre sobre os tokens
   de movimento de tokens.css. Regras comuns:
   - só transform e opacity; o transform de posicionamento (âncoras do mapa) nunca é alvo;
   - cada chamada substitui a animação anterior do MESMO alvo (overwrite) e parte do estado atual, sem pulo;
   - entrada desacelera (expo.out), saída é mais curta que a entrada e nunca acelera no fim (nada de ease-in);
   - cascata de 40 ms, no máximo 8 passos (o nono item em diante entra junto com o oitavo);
   - movimento reduzido: estado final na hora, sem deslocamento. */
import gsap from "gsap";
import { motionTokens } from "./tokens.js";
import { reducedMotion } from "../core/state.js";

const STEP = .04, STEPS = 8;
/* Atraso de cada item numa cascata: 0, 40, 80… ms, parando no oitavo. */
export const cascade = (step = STEP, max = STEPS) => i => Math.min(i, max - 1) * step;

/* Entrada: de levemente abaixo (y) ou levemente menor (scale ~0,96) até o lugar. kind = "reveal" (listas, 480 ms) ou
   "enter" (primeira dobra, 720 ms). Devolve o tween (ou null com movimento reduzido). */
export function enter(targets, { y = 12, x = 0, scale = 1, delay = 0, stagger = true, kind = "reveal", onComplete } = {}) {
  if (reducedMotion()) { gsap.set(targets, { clearProps: "opacity,transform" }); onComplete?.(); return null; }
  const t = motionTokens();
  return gsap.fromTo(targets, { opacity: 0, x, y, scale }, { opacity: 1, x: 0, y: 0, scale: 1, duration: t[kind], ease: t.easeEnter, delay,
    stagger: stagger ? cascade() : 0, overwrite: true, clearProps: "opacity,transform", onComplete });
}

/* Saída: curta (180 ms), desacelerando; o destino (x/y/scale) diz para onde o elemento vai. */
export function exit(targets, { y = 0, x = 0, scale = 1, onComplete } = {}) {
  if (reducedMotion()) { onComplete?.(); return null; }
  const t = motionTokens();
  return gsap.to(targets, { opacity: 0, x, y, scale, duration: t.exit, ease: t.easeRespond, overwrite: true, onComplete });
}

/* Troca de conteúdo no mesmo lugar (painel da ficha, lista filtrada): o novo conteúdo é escrito NA HORA (teclado e
   leitor de tela não esperam) e só a pintura acompanha, subindo poucos pixels. Troca seguida reinicia do estado atual. */
export function swap(el, change, { y = 6 } = {}) {
  change();
  if (reducedMotion() || !el) return null;
  const t = motionTokens();
  return gsap.fromTo(el, { opacity: .35, y }, { opacity: 1, y: 0, duration: t.swap, ease: t.easeEnter, overwrite: true, clearProps: "opacity,transform" });
}

/* Pressão física: afunda enquanto o dedo está (100 ms) e volta ao soltar (240 ms). */
export function press(el, down = true) {
  if (!el) return null;
  const t = motionTokens();
  if (reducedMotion()) { gsap.set(el, { clearProps: "transform" }); return null; }
  return down ? gsap.to(el, { scale: .97, duration: t.press, ease: t.easeRespond, overwrite: "auto" })
    : gsap.to(el, { scale: 1, duration: t.release, ease: t.easeRespond, overwrite: "auto", clearProps: "transform" });
}

/* Resposta curta a um gesto (realce, cor, opacidade de apoio): 240 ms desacelerando. */
export function respond(targets, vars) {
  const t = motionTokens();
  if (reducedMotion()) return gsap.set(targets, vars);
  return gsap.to(targets, { duration: t.release, ease: t.easeRespond, overwrite: "auto", ...vars });
}
