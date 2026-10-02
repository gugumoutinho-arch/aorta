/* Leitor mínimo de GLB (só posições, normais e índices das malhas), com progresso real em bytes.
   Evita o GLTFLoader inteiro: o modelo do HuBMAP não usa texturas nem materiais que precisemos. */
export async function loadGLB(url, onProgress) {
  const r = await fetch(url);
  if (!r.ok) throw new Error("Modelo indisponível (" + r.status + ")");
  const total = +r.headers.get("content-length") || 0;
  const reader = r.body.getReader(), parts = []; let got = 0;
  for (;;) { const { done, value } = await reader.read(); if (done) break; parts.push(value); got += value.length; onProgress?.(got, total); }
  const all = new Uint8Array(got); let o = 0; for (const p of parts) { all.set(p, o); o += p.length; }
  return parseGLB(all.buffer);
}

/* Também usado por tools/arterias.mjs (Node), que pré-calcula o traçado das artérias. */
export function parseGLB(buf) {
  const dv = new DataView(buf);
  if (dv.getUint32(0, true) !== 0x46546c67) throw new Error("Arquivo não é GLB");
  const jsonLen = dv.getUint32(12, true);
  const j = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 20, jsonLen)));
  const bin = 20 + jsonLen + 8;
  const KINDS = { SCALAR: 1, VEC2: 2, VEC3: 3 }, ARRAYS = { 5126: Float32Array, 5125: Uint32Array, 5123: Uint16Array };
  const accessor = i => {
    const a = j.accessors[i], bv = j.bufferViews[a.bufferView], n = KINDS[a.type], A = ARRAYS[a.componentType];
    const off = bin + (bv.byteOffset || 0) + (a.byteOffset || 0);
    return new A(buf.slice(off, off + a.count * n * A.BYTES_PER_ELEMENT));
  };
  const out = {};
  j.nodes.forEach(nd => {
    if (nd.mesh === undefined) return;
    const p = j.meshes[nd.mesh].primitives[0];
    out[nd.name] = { pos: accessor(p.attributes.POSITION), nor: p.attributes.NORMAL !== undefined ? accessor(p.attributes.NORMAL) : null, idx: p.indices !== undefined ? accessor(p.indices) : null };
  });
  return out;
}
