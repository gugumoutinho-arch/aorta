// Orçamento de carga: JS inicial (≤ baseline + 15 kB), 3D fora do grafo estático, sem rolagem lateral e CLS.
// CLS > 0,03 é meta da F4: só reprova com ORCAMENTO_ESTRITO=1. Uso: cd tools && node orcamento.mjs
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';
import { startServer, withDb, chromePath, WEBGL_ARGS } from './harness.mjs';
import { sessionCls, v5ReportsDir } from './gates.mjs';
import { initialBundle } from './bundle-v5.mjs';
import { abundantSeed } from './seed-abundante.mjs';
const strict = process.env.ORCAMENTO_ESTRITO === '1', warnings = [];
const base = JSON.parse(fs.readFileSync(new URL('./baseline-v5.json',import.meta.url),'utf8'));
const seed = JSON.parse(fs.readFileSync(new URL('./seed-v4.json',import.meta.url),'utf8'));
const servers = [await startServer({inject:withDb(seed)}),await startServer({inject:withDb(abundantSeed())})];
const bundle = initialBundle(), failures = [], cases = [];
if(bundle.gzip-base.bundle.gzip>15000) failures.push('JS inicial cresceu mais de 15 kB');
if(bundle.files.some(f=>/^(body|heart|organ|three|leaf)-/.test(f))) failures.push('3D no grafo estático');
const browser=await chromium.launch({executablePath:chromePath(),headless:true,args:WEBGL_ARGS});
try {
  for(const [scenario,server] of servers.entries()) for(const width of [320,375,390,768,1440]) for(const acervo of ['idomed','geral']) {
    const page=await browser.newPage({viewport:{width,height:844},colorScheme:'dark'});
    await page.addInitScript(()=>{
      window.budget={shifts:[],load:0};addEventListener('load',()=>{window.budget.load=performance.now();});
      new PerformanceObserver(l=>l.getEntries().forEach(e=>{if(!e.hadRecentInput)window.budget.shifts.push({at:e.startTime,value:e.value,nodes:e.sources.map(s=>s.node?.id||s.node?.className)});})).observe({type:'layout-shift',buffered:true});
    });
    await page.goto(server.url+'#'+acervo);await page.waitForTimeout(2200);
    const result=await page.evaluate(()=>{
      const early=performance.getEntriesByType('resource').filter(r=>/\/(body|heart|organ|three)-.*\.js|\.glb/.test(r.name)&&r.startTime<window.budget.load).map(r=>r.name);
      return {early,shifts:window.budget.shifts,overflow:document.documentElement.scrollWidth>innerWidth+1};
    });
    result.cls=sessionCls(result.shifts);
    cases.push({scenario,width,acervo,...result});
    const where=`${scenario ? 'abundante' : 'v4'}/${width}/${acervo}`;
    if(result.early.length||result.overflow) failures.push(`${where}: 3D precoce=${result.early.length}, overflow=${result.overflow}`);
    if(result.cls>.03) (strict ? failures : warnings).push(`${where}: CLS=${result.cls.toFixed(4)} (meta 0,03)`);
    await page.close();
  }
} finally {await browser.close();servers.forEach(s=>s.server.close());}
const out=path.join(v5ReportsDir(),'orcamento.json');
fs.mkdirSync(v5ReportsDir(),{recursive:true});fs.writeFileSync(out,JSON.stringify({bundle,growth:bundle.gzip-base.bundle.gzip,strict,cases,failures,warnings},null,2));
console.log(JSON.stringify({bundle,growth:bundle.gzip-base.bundle.gzip,failures,warnings},null,2));
assert.equal(failures.length,0,`Orçamento reprovado: ver ${out}`);
