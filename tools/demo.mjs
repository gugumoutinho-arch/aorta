// Abre o site montado (dist/) com os dados fictícios de seed.json, para ver e mexer sem login e sem o Supabase.
// Uso:  cd tools && node demo.mjs        (oito módulos, seis em produção:  node demo.mjs --oito;
//       protótipo v4 com os dois acervos, IDOMED e Medicina geral:  node demo.mjs --v4)
// Endereço: http://127.0.0.1:4176  — Ctrl+C para parar. Nada do que for feito aqui vai para o banco real.
import fs from 'node:fs';
import path from 'node:path';
import { startServer, withDb, seed, here } from './harness.mjs';

const data = process.argv.includes('--v4') ? JSON.parse(fs.readFileSync(path.join(here, 'seed-v4.json'), 'utf8')) : seed();
if (process.argv.includes('--oito')) for (let i = 3; i <= 8; i++) data.areas.push({ id: 'm' + i, name: 'M' + i, parentId: '', order: i, stain: '' });
const { url } = await startServer({ inject: withDb(data), port: 4176 });
console.log(`Aorta com dados fictícios em ${url}  (Ctrl+C para parar)`);
