// Abre o site montado (dist/) com os dados fictícios de seed.json, para ver e mexer sem login e sem o Supabase.
// Uso:  cd tools && node demo.mjs        (oito módulos, seis em produção:  node demo.mjs --oito)
// Endereço: http://127.0.0.1:4175  — Ctrl+C para parar. Nada do que for feito aqui vai para o banco real.
import { startServer, withDb, seed } from './harness.mjs';

const data = seed();
if (process.argv.includes('--oito')) for (let i = 3; i <= 8; i++) data.areas.push({ id: 'm' + i, name: 'M' + i, parentId: '', order: i, stain: '' });
const { url } = await startServer({ inject: withDb(data), port: 4175 });
console.log(`Aorta com dados fictícios em ${url}  (Ctrl+C para parar)`);
