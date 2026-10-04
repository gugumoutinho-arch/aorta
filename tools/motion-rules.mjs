// Régua do movimento no código-fonte (rodada B, U1). Usada por check.mjs e testada em tests/motion-rules.test.mjs.
// Cobre as chamadas gsap.to/from/fromTo e as linhas de tempo (gsap.timeline + .to/.from/.fromTo encadeados):
// 1) INTERFACE (src/ui e src/views): duração numérica literal é proibida; use motionTokens() ou os utilitários de
//    src/ui/choreo.js. Exceção só com o comentário "movimento: exceção — <motivo>" na mesma linha. Duração 0 (troca direta)
//    e expressões (instant ? 0 : t.release) são permitidas.
// 2) INTERFACE: nenhuma curva que só acelera ("power2.in", "expo.in", "back.in(…)"…). inOut continua permitido, como
//    as constantes físicas de mola (stiffness, damping), que não são duração.
// 3) CENA 3D (src/body, src/heart, src/leaf): tempos de câmera, batimento e crescimento, e o pulso que acelera ao
//    correr pela artéria (power1.in), são física da cena, não resposta da interface; ficam fora das regras 1 e 2
//    (registrados em DESIGN.md › Movimento).
export const INTERFACE = /^src[\\/](ui|views)[\\/]/;
const EXCEPTION = /movimento:\s*exceção\s*—\s*\S/;
const DURATION = /\bduration:\s*([^,}]+)/g, NUMBER = /(?<![\w.])(\d*\.?\d+)(?![\w.])/g;
const EASE_IN = /\bease:\s*["'`]([a-z0-9]+\.in)(?:\([^"'`]*\))?["'`]/gi;

/* Devolve [{ file, line, rule, text }] para um arquivo. "source" é o texto; "file", o caminho relativo à raiz. */
export function motionFindings(source, file) {
  const out = [];
  if (!INTERFACE.test(file)) return out;
  String(source).split(/\r?\n/).forEach((text, i) => {
    for (const m of text.matchAll(EASE_IN)) out.push({ file, line: i + 1, rule: 'curva', text: `curva "${m[1]}" só acelera; use uma de saída (.out) ou os tokens` });
    if (EXCEPTION.test(text)) return;
    // Números dentro da expressão da duração ("instant ? 0 : .3" acusa o .3; "t.release" e "0" passam).
    for (const d of text.matchAll(DURATION)) for (const m of d[1].matchAll(NUMBER)) if (Number(m[1]) !== 0)
      out.push({ file, line: i + 1, rule: 'duração', text: `duração literal ${m[1]} s; use motionTokens() ou src/ui/choreo.js (ou justifique a exceção)` });
  });
  return out;
}
