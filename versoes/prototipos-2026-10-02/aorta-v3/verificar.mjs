import {createRequire} from 'node:module';import fs from 'node:fs';import path from 'node:path';
const require=createRequire(path.resolve('tools/package.json')), {chromium}=require('playwright-core'), AxeBuilder=require('@axe-core/playwright').default;
const root=path.resolve('_fora-do-site/propostas-home/aorta-v3'),base='http://127.0.0.1:4175/aorta-v3/home.html',report={checks:[],errors:[],expectedNetworkErrors:[],axe:[],contrast:[],measurements:[]};
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:false,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--hide-scrollbars']});
const check=(name,value,detail)=>{report.checks.push({name,pass:!!value,detail});if(!value)console.log('FAIL',name,JSON.stringify(detail));};
const settle=p=>p.waitForFunction(()=>!document.querySelector('.flight')&&!window.gsap?.isTweening(document.querySelector('#detail'))&&!window.gsap?.isTweening(document.querySelector('.module-hero')));
async function capture(p,name,full=true){await settle(p);await p.screenshot({path:path.join(root,'capturas',name+'.png'),fullPage:full});}
async function context(width,theme,mode='normal'){
 const c=await browser.newContext({viewport:{width,height:width<600?812:900},colorScheme:theme,reducedMotion:mode==='reduzido'?'reduce':'no-preference',isMobile:width<600,hasTouch:width<600,deviceScaleFactor:1});
 await c.addInitScript(theme=>localStorage.setItem('aorta-v3-theme',theme),theme);
 if(mode==='sem-webgl')await c.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return /webgl/.test(type)?null:original.call(this,type,...args)};});
 const p=await c.newPage();p.on('pageerror',e=>report.errors.push(e.message));p.on('console',m=>{if(m.type()==='error'){if(m.text().includes('404'))report.expectedNetworkErrors.push(m.text());else report.errors.push(m.text());}});return {c,p};
}
async function audit(p,name){const a=await new AxeBuilder({page:p}).analyze();const bad=a.violations.filter(v=>['serious','critical'].includes(v.impact));report.axe.push({name,seriousCritical:bad.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))})),other:a.violations.filter(v=>!['serious','critical'].includes(v.impact)).map(v=>v.id)});check('axe '+name,!bad.length,bad.map(v=>v.id));}
try{
 for(const width of [375,1440])for(const theme of ['dark','light'])for(const mode of ['normal','reduzido','sem-webgl']){
  const {c,p}=await context(width,theme,mode),id=`${width}-${theme}-${mode}`;await p.goto(base);await p.waitForFunction(()=>window.Aorta&&document.querySelector('#loader').hidden);await p.evaluate(()=>document.fonts.ready);
  check('sem overflow home '+id,await p.evaluate(()=>document.documentElement.scrollWidth===innerWidth));
  report.measurements.push({id,map:await p.locator('#map').boundingBox(),search:await p.locator('.search-plate').boundingBox(),webgl:await p.locator('#map').evaluate(n=>n.classList.contains('ready'))});
  await capture(p,'home-'+id);if(mode==='normal')await audit(p,'home-'+id);
  await p.locator('#modules [data-module="m1"]').click();await settle(p);check('módulo chega '+id,await p.locator('#module-title').textContent()==='M1');
  check('sem overflow módulo '+id,await p.evaluate(()=>document.documentElement.scrollWidth===innerWidth));await capture(p,'modulo-'+id);if(mode==='normal')await audit(p,'modulo-'+id);
  await p.locator('#materials [data-material]').first().click();await settle(p);await capture(p,'material-'+id,false);if(mode==='normal')await audit(p,'material-'+id);
  await p.keyboard.press('Escape');check('Esc fecha ficha '+id,!(await p.locator('#detail').evaluate(n=>n.open)));check('foco devolvido '+id,await p.evaluate(()=>document.activeElement.matches('#materials [data-material]')));
  await p.locator('#back-home').click();check('foco volta artéria '+id,await p.evaluate(()=>document.activeElement.matches('#modules [data-module="m1"]')));
  await c.close();console.log('MATRIZ',id);
 }
 for(const theme of ['dark','light']){
  const {c,p}=await context(375,theme);await p.goto(base);await p.waitForFunction(()=>window.Aorta&&document.querySelector('#loader').hidden);
  await p.keyboard.press('Tab');check('foco visível '+theme,await p.evaluate(()=>getComputedStyle(document.activeElement).outlineStyle!=='none'));
  await p.locator('#modules [data-module="m1"]').focus();await p.keyboard.press('ArrowRight');check('seta entre artérias '+theme,await p.evaluate(()=>document.activeElement.dataset.module==='m2'));
  for(const q of ['placenta','imuno','zzzzzzzz']){await p.keyboard.press('Control+k');await p.locator('#query').fill(q);check('busca '+q+' '+theme,q==='zzzzzzzz'?await p.locator('#results').innerText().then(t=>t.includes('Nenhum resultado')&&t.includes('M1')):await p.locator('[data-result]').count()>0);await capture(p,'busca-'+q+'-'+theme,false);await p.keyboard.press('Escape');check('Esc fecha busca '+q+' '+theme,!(await p.locator('#palette').evaluate(n=>n.open)));}
  // Dispatch de ações reais em rajada: transições não podem bloquear novo destino.
  await p.evaluate(()=>{for(let i=0;i<10;i++)document.querySelector(`#modules [data-module="${i%2?'m2':'m1'}"]`).click();});await settle(p);check('10 artérias, último destino '+theme,await p.locator('#module-title').textContent()==='M2');
  await p.evaluate(()=>{for(let i=0;i<10;i++){document.querySelector('#materials [data-material]').click();document.querySelector('#detail [data-close]').click();}});await settle(p);check('10 fichas sem travar '+theme,await p.locator('#detail').evaluate(n=>!n.open&&n.style.transform===''));
  await p.locator('#prev-module').click();await p.locator('#next-module').click();await settle(p);check('troca módulo durante transição '+theme,await p.locator('#module-title').textContent()==='M2');
  await p.locator('#materials [data-material]').first().click();await settle(p);
  await p.locator('#detail [data-close]').focus();for(let k=0;k<12;k++){await p.keyboard.press('Tab');check('Tab preso '+theme+' '+k,await p.evaluate(()=>document.querySelector('#detail').contains(document.activeElement)));}
  await p.getByRole('button',{name:'Revisado',exact:true}).click();check('situação individual '+theme,await p.evaluate(()=>Object.values(Aorta.data.personal).some(x=>x.status==='Revisado')));
  await p.locator('#remove').click();await p.locator('#confirm-remove').click();check('remoção '+theme,await p.evaluate(()=>Aorta.data.materials.length===6));await capture(p,'removido-'+theme,false);await p.locator('#undo').click();check('Desfazer '+theme,await p.evaluate(()=>Aorta.data.materials.length===7));
  await p.locator('#back-home').click();await p.locator('#pause').click();const frames=await p.evaluate(()=>Aorta.scene?.frames);await p.waitForTimeout(300);const f2=await p.evaluate(()=>Aorta.scene?.frames);await p.waitForTimeout(600);check('repouso pausado sem desenhar '+theme,await p.evaluate(f=>Aorta.scene?.frames===f,f2));
  await p.locator('#layout-toggle').click();await capture(p,'trilho-375-'+theme);check('trilho sem overflow '+theme,await p.evaluate(()=>document.documentElement.scrollWidth===innerWidth));
  await c.close();
 }
 for(const width of [375,1440])for(const theme of ['dark','light']){
  const {c,p}=await context(width,theme);await p.goto(base+'?scenario=abundante');await p.waitForFunction(()=>window.Aorta&&document.querySelector('#loader').hidden);check('120 materiais '+width+theme,await p.evaluate(()=>Aorta.data.materials.length===120));check('8 irrigados '+width+theme,await p.locator('#modules .off').count()===0);
  await capture(p,`abundante-home-${width}-${theme}`);await p.locator('#modules [data-module="m1"]').click();await settle(p);await capture(p,`abundante-modulo-${width}-${theme}`);await audit(p,`abundante-modulo-${width}-${theme}`);check('matérias 30 e 1 '+width+theme,await p.locator('#subjects').innerText().then(t=>t.includes('30')&&t.includes('1')));await p.locator('#materials [data-material]').first().click();await capture(p,`abundante-material-${width}-${theme}`,false);await c.close();
 }
 for(const width of [375,1440])for(const theme of ['dark','light'])for(const failure of ['network','model']){
  const {c,p}=await context(width,theme);await p.goto(base+'?failure='+failure);await p.waitForFunction(()=>window.Aorta);if(failure==='model')await p.waitForFunction(()=>document.querySelector('#loader').hidden);
  check('falha desenhada '+width+theme+failure,failure==='model'?await p.locator('#model-state').innerText().then(t=>t.includes('indisponível')):await p.locator('#network-error').isVisible());await capture(p,`falha-${failure}-${width}-${theme}`);if(failure==='network'){await p.locator('#retry').click();check('recupera rede '+width+theme,await p.locator('#home-view').isVisible());}await c.close();
 }
 // Carregamento real: a resposta GLB é atrasada; navegação não espera por ela.
 {const {c,p}=await context(375,'dark');await p.route('**/heart-hra-v1.3.glb',async route=>{await new Promise(r=>setTimeout(r,1200));await route.continue().catch(()=>{});});await p.goto(base);await p.waitForFunction(()=>window.Aorta);await capture(p,'carregando-375-dark',false);await p.locator('#modules [data-module="m1"]').click();check('navega antes modelo',await p.locator('#module-view').isVisible());await c.close();}
 // Retorno conserva rolagem; tema Sistema responde a mudança em tempo real.
 {const {c,p}=await context(1440,'dark');await p.goto(base);await p.waitForFunction(()=>window.Aorta);await p.locator('#course-index [data-module="m1"]').first().scrollIntoViewIfNeeded();const y=await p.evaluate(()=>scrollY);await p.locator('#course-index [data-module="m1"]').first().click();await p.locator('#back-home').click();check('rolagem restaurada',await p.evaluate(y=>Math.abs(scrollY-y)<3,y));await p.locator('#theme').selectOption('system');await p.emulateMedia({colorScheme:'light'});await p.waitForFunction(()=>document.documentElement.dataset.theme==='light');check('Sistema acompanha tema',await p.locator('html').getAttribute('data-theme')==='light');await c.close();}
 check('zero erros inesperados',report.errors.length===0,report.errors);
}catch(e){report.errors.push(e.stack);console.log(e.stack)}finally{await browser.close();fs.writeFileSync(path.join(root,'verificacao.json'),JSON.stringify(report,null,2));const summary={passed:report.checks.filter(x=>x.pass).length,failed:report.checks.filter(x=>!x.pass).length,errors:report.errors.length,axe:report.axe.filter(x=>x.seriousCritical.length).length};console.log('RESULTADO',JSON.stringify(summary));if(summary.failed||summary.errors||summary.axe)process.exitCode=1;}
