/* CSS é a fonte dos valores (tokens.css); estes padrões só valem se a folha ainda não carregou. */
export const MOTION_DEFAULTS = Object.freeze({
  enter: .72, reveal: .48, swap: .32, exit: .18, release: .24, press: .1,
  easeEnter: "expo.out", easeRespond: "power2.out",
});
const DURATIONS = ["enter", "reveal", "swap", "exit", "release", "press"];

/* Converte "720ms" ou ".5s" em segundos; valor ausente, inválido ou negativo cai no padrão. */
export function parseMotionTokens(read) {
  let complete = true;
  const seconds = name => {
    const m = /^(\d*\.?\d+)(ms|s)$/.exec(String(read(name)).trim());
    if (!m) { complete = false; return MOTION_DEFAULTS[name]; }
    return m[2] === "ms" ? +m[1] / 1000 : +m[1];
  };
  const text = (name, key) => { const v = String(read(name)).trim(); if (!v) complete = false; return v || MOTION_DEFAULTS[key]; };
  const out = Object.fromEntries(DURATIONS.map(k => [k, seconds(k)]));
  out.easeEnter = text("ease-enter", "easeEnter");
  out.easeRespond = text("ease-respond", "easeRespond");
  out.complete = complete;
  return Object.freeze(out);
}

/* Só guarda em cache uma leitura completa, para não fixar os padrões antes do CSS chegar. */
let cached;
export function motionTokens() {
  if (cached) return cached;
  const css = getComputedStyle(document.documentElement);
  const tokens = parseMotionTokens(name => css.getPropertyValue("--motion-" + name));
  if (tokens.complete) cached = tokens;
  return tokens;
}
