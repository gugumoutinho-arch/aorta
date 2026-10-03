// Acentos corrompidos (gravação fora de UTF-8): "refer?ncia", UTF-8 lido como Latin-1/cp1252, U+FFFD.
// Um ? entre letras só é aceito quando abre parâmetro de URL (?chave=). Limites conhecidos:
// ternário sem espaços (a?b:c) é acusado (o código do projeto usa espaços) e ? no fim da palavra ("voc?") escapa,
// porque não se distingue de uma pergunta ("hoje?"). Os caracteres são montados por código para não depender
// da codificação deste arquivo.
const ch = (...codes) => String.fromCharCode(...codes);
const span = (a, b) => ch(a) + "-" + ch(b);
// Segundo byte de um caractere UTF-8 de 2 bytes visto como Latin-1 (0x80–0xBF) ou cp1252 (‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ€).
const TAIL = "[" + span(0x80, 0xBF) + ch(0x152, 0x153, 0x160, 0x161, 0x178, 0x17D, 0x17E, 0x192, 0x2C6, 0x2DC) + span(0x2013, 0x203A) + ch(0x20AC, 0x2122) + "]";
const PATTERNS = [
  new RegExp(ch(0xFFFD), "g"),
  new RegExp("[" + ch(0xC3, 0xC2) + "]" + TAIL, "g"),
  /\p{L}\?{1,3}\p{Ll}(?![\p{L}\d_-]*=)/gu,
];

export function findMojibake(text) {
  const out = [];
  String(text).split(/\r?\n/).forEach((line, i) => {
    for (const re of PATTERNS) {
      re.lastIndex = 0;
      const m = re.exec(line);
      if (m) { out.push({ line: i + 1, sample: line.slice(Math.max(0, m.index - 20), m.index + 20).trim() }); break; }
    }
  });
  return out;
}
