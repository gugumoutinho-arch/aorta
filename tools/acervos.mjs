// Regressões de acervo, mapa e interrupções. Banco fictício, sem Supabase.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';
import AxeBuilder from '@axe-core/playwright';
import { startServer, withDb, chromePath, WEBGL_ARGS } from './harness.mjs';
const data = JSON.parse(fs.readFileSync(new URL('./seed-v4.json', import.meta.url), 'utf8'));
const {server,url} = await startServer({inject:withDb(data)});
const browser = await chromium.launch({executablePath:chromePath(),headless:true,args:WEBGL_ARGS});
fs.mkdirSync('reports/refino',{recursive:true});
const checks=[];
const ok=(label,result)=>{assert.ok(result,label);checks.push(label);console.log('OK '+label);};
try {
  for (const width of [320,375,1440]) for (const theme of ['dark','light']) {
    const ctx=await browser.newContext({viewport:{width,height:1000},colorScheme:theme,reducedMotion:'reduce'});
    const p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
    for(const acervo of ['idomed','geral']) {
      // Os rótulos nascem no canto e são posicionados no quadro seguinte: espera todos terem lado (não um tempo fixo).
      await p.goto(url+'?conceito=folha#'+acervo);await p.waitForSelector('#modules .mod');
      await p.waitForFunction(()=>[...document.querySelectorAll('#modules .mod')].every(b=>b.dataset.side),null,{timeout:5000});
      ok(width+' '+theme+' '+acervo+' mapa pelo acervo',await p.getAttribute('body','data-concept')===(acervo==='geral'?'corpo':'coracao'));
      ok(width+' '+theme+' '+acervo+' nomes corretos',acervo==='geral'? !(await p.locator('#modules').innerText()).match(/\bM[1-8]\b/):await p.locator('#modules [data-module="m1"]').count()===1);
      ok(width+' '+theme+' '+acervo+' sem rolagem e rótulos sobrepostos',await p.evaluate(()=>{
        const rects=[...document.querySelectorAll('#modules .mod')].map(e=>e.getBoundingClientRect());
        return document.documentElement.scrollWidth<=innerWidth+1&&rects.every((r,i)=>r.width>=44&&r.height>=44&&rects.every((s,j)=>i===j||r.right<=s.left||s.right<=r.left||r.bottom<=s.top||s.bottom<=r.top));
      }));
      const axe=await new AxeBuilder({page:p}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
      ok(width+' '+theme+' '+acervo+' WCAG',axe.violations.length===0 || (console.log(JSON.stringify(axe.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})))),false));
      await p.screenshot({path:'reports/refino/'+acervo+'-'+width+'-'+theme+'.png'});
    }
    ok(width+' '+theme+' console',errors.length===0);
    await ctx.close();
  }
  const ctx=await browser.newContext({viewport:{width:1440,height:1000},colorScheme:'dark'}),p=await ctx.newPage(),errors=[];
  p.on('pageerror',e=>errors.push(e.message));
  await p.goto(url+'#geral');
  await p.waitForSelector('#map.ready canvas',{timeout:30000});
  await p.waitForTimeout(1300);
  await p.screenshot({path:'reports/refino/corpo-3d-dark.png'});
  await p.locator('#modules [data-module="g-neuro"]').click();
  await p.keyboard.press('Escape');await p.waitForTimeout(1100);
  ok('Esc cancela mergulho sem navegação tardia',await p.getAttribute('body','data-view')==='inicio'&&!await p.locator('body.diving').count());
  await p.locator('#modules [data-module="g-neuro"]').click();
  await p.locator('[data-acervo-tab="idomed"]').click();
  await p.waitForTimeout(1200);
  ok('Troca de acervo cancela mergulho',await p.getAttribute('body','data-concept')==='coracao'&&await p.getAttribute('body','data-view')==='inicio');
  await p.waitForSelector('#map.ready canvas',{timeout:30000});
  ok('Só um canvas após troca',await p.locator('#map canvas').count()===1);
  await p.screenshot({path:'reports/refino/coracao-3d-dark.png'});
  for(const acervo of ['geral','idomed','geral','idomed','geral']){
    await p.evaluate(a=>{location.hash=a;},acervo);await p.waitForTimeout(80);
  }
  await p.waitForSelector('#map.ready canvas',{timeout:30000});await p.waitForTimeout(1300);
  const switched = await p.evaluate(()=>({concept:document.body.dataset.concept,title:document.querySelector('#home-title').textContent,canvases:document.querySelectorAll('#map canvas').length}));
  ok('Trocas rápidas preservam último acervo e título: '+JSON.stringify(switched),switched.concept==='corpo'&&/medicina\s+ganha/.test(switched.title)&&switched.canvases===1);
  await p.locator('#modules [data-module="g-neuro"]').click();
  await p.waitForSelector('#organ-view canvas',{timeout:30000});await p.waitForTimeout(650);
  ok('Mergulho abre Neuroanatomia',await p.locator('#module-title').innerText()==='Neuroanatomia');
  await p.getByRole('button',{name:/^Cerebelo/}).click();
  ok('Cerebelo selecionado',await p.getByRole('button',{name:/^Cerebelo/}).getAttribute('aria-pressed')==='true');
  await p.waitForTimeout(500);
  await p.screenshot({path:'reports/refino/cerebelo-dark.png'});
  await p.emulateMedia({colorScheme:'light'});await p.waitForTimeout(250);await p.screenshot({path:'reports/refino/cerebelo-light.png'});
  await p.emulateMedia({reducedMotion:'reduce'});await p.waitForTimeout(100);
  ok('Ativar movimento reduzido libera órgão',await p.locator('#organ-view canvas').count()===0);
  await p.goto(url+'#a-g-neuro');await p.waitForSelector('#module-title.long');
  ok('Link direto sincroniza acervo e mapa',await p.getAttribute('body','data-concept')==='corpo'&&await p.getAttribute('body','data-acervo')==='geral');
  await p.goto(url+'#idomed');await p.waitForSelector('#modules .mod');
  await p.emulateMedia({reducedMotion:'no-preference'});
  // Ligar o movimento faz o 3D começar e ocupa a thread: a pressão anima no primeiro quadro livre. Espera a CONDIÇÃO
  // (afundou com o mouse ainda apertado), não um tempo fixo; depois de soltar, espera voltar.
  const scaleOf=()=>new DOMMatrix(getComputedStyle(document.querySelector('.search-plate')).transform).a;
  const target=p.locator('.search-plate');await target.hover();await p.mouse.down();
  const held=await p.waitForFunction(`(${scaleOf})()<.99`,null,{timeout:3000}).then(()=>true,()=>false);
  ok('Botão fica pressionado até soltar',held&&await target.evaluate(e=>new DOMMatrix(getComputedStyle(e).transform).a<.99));
  await p.mouse.up();await p.keyboard.press('Escape');
  const back=await p.waitForFunction(`Math.abs((${scaleOf})()-1)<.001`,null,{timeout:3000}).then(()=>true,()=>false);
  ok('Botão retorna ao soltar',back);
  await p.evaluate(()=>{location.hash='geral';});await p.waitForTimeout(90);
  await p.emulateMedia({reducedMotion:'reduce'});await p.waitForTimeout(60);
  ok('Reduzir durante entrada deixa conteúdo visível',await p.evaluate(()=>['#intro-copy','.search-plate','#counts','#acervo-note'].every(s=>getComputedStyle(document.querySelector(s)).opacity==='1')));
  // O 3D e o cursor saem quando o navegador entrega o evento da preferência; com o 3D por software a thread principal fica
  // ocupada e o evento pode demorar, então espera a condição (até 3 s) em vez de uma pausa fixa.
  await p.waitForFunction(()=>document.querySelectorAll('.cursor-ring, #map canvas').length===0,null,{timeout:3000}).catch(()=>{});
  ok('Reduzir durante entrada remove cursor e 3D',await p.locator('.cursor-ring, #map canvas').count()===0);
  ok('Fluxos 3D sem erros',errors.length===0 || (console.log(errors),false));
  await ctx.close();
  // N5 · Cardiologia (disciplina fictícia) aponta para o coração: rótulo, destaque ao apontar e mergulho até o coração.
  const cardioData={...data,areas:[...data.areas,{id:'g-cardio',name:'Cardiologia',parentId:'',acervo:'geral',order:99}],
    materials:[...data.materials,{...data.materials[0],id:'cx1',title:'Exemplo — eletrocardiograma',areaId:'g-cardio',url:'https://example.com/ecg',collectionIds:[]}]};
  const cardio=await startServer({inject:withDb(cardioData)});
  try {
    const c=await browser.newContext({viewport:{width:1440,height:1000},colorScheme:'dark'}),q=await c.newPage(),errs=[];q.on('pageerror',e=>errs.push(e.message));
    await q.goto(cardio.url+'#geral');await q.waitForSelector('#map.ready canvas',{timeout:30000});
    const label=q.locator('#modules [data-module="g-cardio"]');
    ok('Cardiologia: rótulo do destino é Coração',/^CORAÇÃO|^Coração/i.test((await label.innerText()).trim()));
    await label.hover();await q.waitForFunction(()=>document.querySelector('#modules [data-module="g-cardio"]').classList.contains('hot'),null,{timeout:3000});
    ok('Cardiologia: apontar realça o caminho até o coração',await q.locator(`[data-guide="${await label.getAttribute('data-index')}"].hot`).count()===1);
    await q.waitForTimeout(400);await q.screenshot({path:'reports/refino/cardio-destaque.png'});
    await label.click();await q.waitForSelector('#organ-view canvas',{timeout:30000});
    ok('Cardiologia: mergulho abre o módulo com o coração em destaque',await q.locator('#module-title').innerText()==='Cardiologia'&&/CORAÇÃO|Coração/i.test(await q.locator('#artery-name').innerText()));
    await q.waitForTimeout(600);await q.screenshot({path:'reports/refino/cardio-modulo.png'});
    ok('Cardiologia sem erros',errs.length===0||(console.log(errs),false));
    await c.close();
  } finally {cardio.server.close();}
} finally {await browser.close();server.close();fs.writeFileSync('reports/refino/checks.json',JSON.stringify(checks,null,2));}
console.log(checks.length+' verificações aprovadas.');
