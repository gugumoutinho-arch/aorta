// Abre o site montado (dist/) com os dados fictícios de seed.json, para ver e mexer sem login e sem o Supabase.
// Uso:  cd tools && node demo.mjs        (oito módulos, seis em produção:  node demo.mjs --oito;
//       protótipo v4 com os dois acervos, IDOMED e Medicina geral:  node demo.mjs --v4
//       v4 com as abas de assunto em CIS 1 › Anatomia:  node demo.mjs --abas;
//       acrescenta a disciplina Cardiologia na Medicina geral (aponta para o coração do corpo):  --cardio, junto com --v4 ou --abas)
// Endereço: http://127.0.0.1:4176  — Ctrl+C para parar. Nada do que for feito aqui vai para o banco real.
import fs from 'node:fs';
import path from 'node:path';
import { startServer, withDb, seed, here } from './harness.mjs';
import { withTopics } from './fixtures-topics.mjs';

const v4 = () => JSON.parse(fs.readFileSync(path.join(here, 'seed-v4.json'), 'utf8'));
const data = process.argv.includes('--abas') ? withTopics(v4()) : process.argv.includes('--v4') ? v4() : seed();
if (process.argv.includes('--cardio')) {
  data.areas.push({ id: 'g-cardio', name: 'Cardiologia', parentId: '', acervo: 'geral', order: 99 });
  data.materials.push({ ...data.materials[0], id: 'cardio1', title: 'Exemplo — eletrocardiograma básico', areaId: 'g-cardio', subject: '', url: 'https://example.com/ecg', favorite: false, collectionIds: [] });
}
if (process.argv.includes('--oito')) for (let i = 3; i <= 8; i++) data.areas.push({ id: 'm' + i, name: 'M' + i, parentId: '', order: i, stain: '' });
const port = Number(process.env.AORTA_PREVIEW_PORT || 4176);
const { url } = await startServer({ inject: withDb(data), port });
console.log(`Aorta com dados fictícios em ${url}  (Ctrl+C para parar)`);
