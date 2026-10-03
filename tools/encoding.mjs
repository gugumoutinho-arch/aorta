// Acentos corrompidos (gravação fora de UTF-8): "refer?ncia", "Ã§", U+FFFD.
// Um ? entre letras só é aceito quando abre parâmetro de URL (?chave=).
const PATTERNS = [
  new RegExp(String.fromCharCode(0xFFFD), "g"),
  /Ã[\u0080-¿]/g,
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
