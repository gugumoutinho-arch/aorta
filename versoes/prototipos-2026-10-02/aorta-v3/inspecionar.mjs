import {createRequire} from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
const require=createRequire(path.resolve('tools/package.json'));
const {chromium}=require('playwright-core');
const root=path.resolve('_fora-do-site/propostas-home/aorta-v3');
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:false,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const errors=[];
try{for(const width of [375,1440])for(const theme of ['dark','light']){
 const page=await browser.newPage({viewport:{width,height:width===375?812:900},colorScheme:theme});
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 await page.goto('http://127.0.0.1:4175/aorta-v3/home.html');
 await page.waitForFunction(()=>window.Aorta);
 await page.waitForFunction(()=>document.querySelector('#loader').hidden,{},{timeout:30000});
 await page.screenshot({path:path.join(root,`capturas/home-${width}-${theme}.png`),fullPage:true});
 await page.locator('#modules [data-module="m1"]').click();
 await page.locator('#module-title').waitFor();
 await page.screenshot({path:path.join(root,`capturas/modulo-${width}-${theme}.png`),fullPage:true});
 await page.locator('#materials [data-material]').first().click();
 await page.screenshot({path:path.join(root,`capturas/material-${width}-${theme}.png`),fullPage:true});
 console.log(JSON.stringify({width,theme,overflow:await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth),ready:await page.locator('#map').getAttribute('class')}));
 await page.close();
}}finally{await browser.close();fs.writeFileSync(path.join(root,'inspecao.json'),JSON.stringify(errors,null,2));console.log('ERROS',JSON.stringify(errors));}
