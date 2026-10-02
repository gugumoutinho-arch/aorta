import {scenario} from './dados.js';
import {createHeart} from './heart.js';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)], esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const params=new URLSearchParams(location.search), motion=matchMedia('(prefers-reduced-motion: reduce)'), systemTheme=matchMedia('(prefers-color-scheme: dark)');
const timing={page:.65,dialog:.28,pop:.26,ease:'expo.out'};
let data=scenario(params.get('scenario')||'atual'), active=null, unit='', subject='', detailId=null, lastHomeFocus=null, homeScroll=0, origin=null, paletteOrigin=null, removed=null, scene=null, paused=false, boot=0;
const star='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.8 5.8 6.4.9-4.6 4.5 1.1 6.4-5.7-3-5.7 3 1.1-6.4L2.8 9.7l6.4-.9Z"/></svg>';
function chain(m){let a=data.areas.find(a=>a.id===m.areaId),arr=[];while(a){arr.unshift(a);a=data.areas.find(x=>x.id===a.parentId);}return arr;}
function path(m){return chain(m).map(a=>a.name).join(' › ')||'Sem área definida';}
function belongs(m,id){return chain(m).some(a=>a.id===id);}
const itemsFor=id=>data.materials.filter(m=>belongs(m,id));
const color=m=>getComputedStyle(document.documentElement).getPropertyValue(m.token).trim();
const normalize=s=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
function tell(text,undo=false){$('#toast span').textContent=text;$('#undo').hidden=!undo;$('#toast').hidden=false;}
function animate(node,from,opts={}){const g=window.gsap;if(!g||motion.matches)return;g.killTweensOf(node);g.fromTo(node,from,{...opts,duration:opts.duration||timing.dialog,ease:timing.ease,overwrite:true,clearProps:'transform,opacity'});}
function setTheme(value){const t=value==='system'?(systemTheme.matches?'dark':'light'):value;document.documentElement.dataset.theme=t;try{localStorage.setItem('aorta-v3-theme',value);}catch{}$('#theme').value=value;drawMap();scene?.theme();}
$('#theme').value=(()=>{try{return localStorage.getItem('aorta-v3-theme')||'system'}catch{return 'system'}})();
$('#theme').onchange=e=>setTheme(e.target.value);systemTheme.onchange=()=>{if($('#theme').value==='system')setTheme('system');};
function renderHome(){
 const filled=data.modules.filter(m=>itemsFor(m.id).length);$('#counts').innerHTML=`<b>${data.materials.length}</b> materiais · <b>${filled.length} de ${data.modules.length}</b> módulos com conteúdo`;
 $('#index-meta').textContent=`${data.modules.length} módulos · escolha por onde começar`;
 const resume=data.materials.find(m=>data.personal[m.id].lastOpenedAt)||data.materials.find(m=>data.personal[m.id].status==='Em estudo');
 $('#resume').innerHTML=resume?`<small>Continuar · ${esc(path(resume))}</small><button data-material="${esc(resume.id)}"><strong>${esc(resume.title)}</strong><span class="quiet">Retomar leitura ↗</span></button>`:'';
 $('#course-index').innerHTML=filled.map(m=>{const its=itemsFor(m.id);const names=[...new Set(its.map(x=>chain(x).slice(1).map(a=>a.name).join(' › ')))];return `<article class="index-row" style="--c:var(${m.token})"><button class="index-num" data-module="${m.id}" aria-label="Abrir ${m.name}">${m.name}</button><div><h3>${esc(names.join(' · '))}</h3><p>${its.length} materiais · ${esc(m.art)}</p></div><button class="quiet" data-module="${m.id}" aria-label="Explorar ${m.name}">↗</button></article>`}).join('')+`<div class="production-index"><span>Em produção / ainda não irrigados</span>${data.modules.filter(m=>!itemsFor(m.id).length).map(m=>`<button data-module="${m.id}" aria-label="${m.name}, em produção">${m.name}</button>`).join('')||'<span>Todos os módulos têm material.</span>'}</div>`;
 $('#recent').innerHTML=[...data.materials].sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).slice(0,3).map(m=>`<article class="recent-card"><span class="mono">${esc(m.type)}</span><button data-material="${m.id}">${esc(m.title)}</button><small>${esc(path(m))}</small></article>`).join('');
 drawMap();
}
function drawMap(){
 if(!$('#modules'))return;
 const oldFocus=document.activeElement?.dataset.module;
 $('#modules').innerHTML=data.modules.map((m,i)=>`<button class="mod ${itemsFor(m.id).length?'':'off'}" data-module="${m.id}" data-index="${i}" style="--c:var(${m.token})" aria-label="${m.name}, ${itemsFor(m.id).length?itemsFor(m.id).length+' materiais':'Em produção'}"><span class="mono">Art. ${String(i+1).padStart(2,'0')}</span><b>${m.name}</b><small>${itemsFor(m.id).length?itemsFor(m.id).length+' materiais':'Em produção'}</small></button>`).join('');
 const map=$('#map'),h=map.clientHeight,w=map.clientWidth;
 // Colunas seguem o lado e a altura do término da artéria; sem caixas nem linhas cruzando o coração inteiro.
 for(const right of [false,true]){const ms=data.modules.filter(m=>(m.path.at(-1)[0]>=0)===right).sort((a,b)=>b.path.at(-1)[1]-a.path.at(-1)[1]);ms.forEach((m,row)=>{const b=$(`#modules [data-module="${m.id}"]`);b.dataset.side=right?'right':'left';b.style.left=(right?w-b.offsetWidth:0)+'px';b.style.top=(10+row*(h-82)/Math.max(1,ms.length-1))+'px';});}
 $('#flat-arteries').innerHTML=data.modules.map((m,i)=>{const side=i%2,row=Math.floor(i/2),x=side?390+row*4:220-row*8,y=160+row*65;return `<path data-flat="${i}" d="M290 140 Q${side?340:235} ${170+row*10} ${x} ${y}" stroke="${color(m)}" ${itemsFor(m.id).length?'':'stroke-dasharray="4 8"'} opacity="${itemsFor(m.id).length?1:.55}"/>`}).join('');
 $('#guides').setAttribute('viewBox',`0 0 ${w} ${h}`);$('#guides').innerHTML=data.modules.map((m,i)=>`<path data-guide="${i}"/>`).join('');
 guides();if(oldFocus&&document.activeElement===document.body)$(`#modules [data-module="${oldFocus}"]`)?.focus({preventScroll:true});
}
function guides(points){const map=$('#map'),r=map.getBoundingClientRect();$$('#modules .mod').forEach((b,i)=>{const br=b.getBoundingClientRect(),side=b.dataset.side==='right',row=Math.floor(i/2);const p=points?.[i]||{x:r.width*(side?.63:.38),y:r.height*(.3+row*.115)};const x=side?br.left-r.left:br.right-r.left,y=br.top-r.top+br.height/2;const end=x+(side?-12:12);$(`[data-guide="${i}"]`)?.setAttribute('d',`M${p.x} ${p.y} L${end} ${y} H${x}`);});}
window.addEventListener('resize',()=>{drawMap();scene?.resize();});
function highlight(i,on){$(`[data-guide="${i}"]`)?.classList.toggle('hot',on);$(`[data-flat="${i}"]`)?.setAttribute('stroke-width',on?'5':'3');$(`#modules [data-index="${i}"]`)?.classList.toggle('hot',on);scene?.highlight(i,on);}
$('#modules').addEventListener('pointerover',e=>{const b=e.target.closest('.mod');if(b)highlight(+b.dataset.index,true);});$('#modules').addEventListener('pointerout',e=>{const b=e.target.closest('.mod');if(b)highlight(+b.dataset.index,false);});
$('#modules').addEventListener('focusin',e=>{if(e.target.matches('.mod'))highlight(+e.target.dataset.index,true);});$('#modules').addEventListener('focusout',e=>{if(e.target.matches('.mod'))highlight(+e.target.dataset.index,false);});
$('#modules').addEventListener('keydown',e=>{if(!['ArrowRight','ArrowDown','ArrowLeft','ArrowUp'].includes(e.key))return;const bs=$$('#modules .mod'),i=bs.indexOf(document.activeElement);e.preventDefault();bs[(i+(['ArrowRight','ArrowDown'].includes(e.key)?1:bs.length-1))%bs.length].focus();});
function openModule(id,source){
 const mod=data.modules.find(m=>m.id===id);if(!mod)return;
 if(!active){homeScroll=scrollY;lastHomeFocus=source||$(`#modules [data-module="${id}"]`);}
 const rect=source?.getBoundingClientRect();active=id;unit='';subject='';$('#local-search').value='';$('#type-filter').value='';$('#status-filter').value='';$('#fav-filter').setAttribute('aria-pressed','false');
 document.documentElement.style.setProperty('--selected',color(mod));$('#home-view').hidden=true;$('#module-view').hidden=false;$('#network-error').hidden=true;scene?.visible(false);
 $('#module-title').textContent=mod.name;$('#artery-name').textContent=`ART. ${String(mod.index+1).padStart(2,'0')} · ${mod.art}`;$('#module-count').textContent=`${itemsFor(id).length} materiais · links para estudar no seu ritmo`;
 $('#type-filter').innerHTML='<option value="">Todos os tipos</option>'+[...new Set(itemsFor(id).map(m=>m.type))].map(t=>`<option>${esc(t)}</option>`).join('');
 renderModule();window.scrollTo(0,0);$('#module-title').focus({preventScroll:true});history.replaceState(null,'',`#modulo-${id}`);
 $$('.flight').forEach(n=>{window.gsap?.killTweensOf(n);n.remove();});
 if(rect&&window.gsap&&!motion.matches&&rect.width){const to=$('#module-title').getBoundingClientRect(),fly=document.createElement('span');fly.className='flight';fly.textContent=mod.name;Object.assign(fly.style,{left:to.left+'px',top:to.top+'px',fontSize:getComputedStyle($('#module-title')).fontSize});document.body.append(fly);window.gsap.fromTo(fly,{x:rect.left-to.left,y:rect.top-to.top,scale:.3,opacity:.9},{x:0,y:0,scale:1,opacity:0,duration:timing.page,ease:'expo.inOut',overwrite:true,onComplete:()=>fly.remove()});}
 animate($('.module-hero'),{opacity:.65,y:12},{opacity:1,y:0,duration:timing.page});
}
function backHome(){const returnId=lastHomeFocus?.dataset.module;active=null;$('#home-view').hidden=false;$('#module-view').hidden=true;history.replaceState(null,'','#home');scene?.visible(true);drawMap();scene?.resize();window.scrollTo(0,homeScroll);(lastHomeFocus?.isConnected?lastHomeFocus:$(`#modules [data-module="${returnId}"]`)||$('#home-title')).focus?.({preventScroll:true});}
function renderModule(){if(!active)return;
 const us=data.areas.filter(a=>a.parentId===active);$('#units').innerHTML=`<button data-unit="" aria-pressed="${!unit}">Todas as unidades<small>${itemsFor(active).length} materiais</small></button>`+us.map(u=>`<button data-unit="${u.id}" aria-pressed="${unit===u.id}">${esc(u.name)}<small>${itemsFor(u.id).length?itemsFor(u.id).length+' materiais':'Em produção'}</small></button>`).join('');
 const base=itemsFor(unit||active),subs=[...new Map(base.map(m=>{const c=chain(m),a=c[c.length-1];return[a.id,a]})).values()];
 $('#subjects').innerHTML='<h3>Matérias</h3>'+`<button data-subject="" aria-pressed="${!subject}">Todas <span>${base.length}</span></button>`+subs.map(s=>`<button data-subject="${s.id}" aria-pressed="${subject===s.id}">${esc(s.name)} <span>${base.filter(m=>m.areaId===s.id).length}</span></button>`).join('');
 const q=normalize($('#local-search').value),type=$('#type-filter').value,status=$('#status-filter').value,fav=$('#fav-filter').getAttribute('aria-pressed')==='true';
 const list=base.filter(m=>(!subject||m.areaId===subject)&&(!type||m.type===type)&&(!status||data.personal[m.id].status===status)&&(!fav||data.personal[m.id].favorite)&&normalize(m.title+' '+path(m)+' '+m.subject).includes(q));
 $('#materials').innerHTML=list.length?list.map(m=>`<article class="material"><div><div class="material-meta"><span class="mono">${esc(m.type)}</span><span>${esc(chain(m).at(-1)?.name||'Sem área')}</span></div><button class="material-title" data-material="${m.id}">${esc(m.title)}</button><div class="material-bottom"><span>${esc(m.subject||'Material de referência')}</span><span>${data.personal[m.id].status}</span><a href="${esc(m.url)}" target="_blank" rel="noopener" aria-label="Abrir original de ${esc(m.title)}">Abrir original ↗</a></div></div><button class="favorite" data-favorite="${m.id}" aria-label="Favoritar ${esc(m.title)}" aria-pressed="${data.personal[m.id].favorite}">${star}</button></article>`).join(''):`<div class="empty"><h2>${base.length?'Nenhum material por aqui.':'Em produção.'}</h2><p>${base.length?'Experimente outro termo ou limpe os filtros.':'Este caminho ainda não foi irrigado. O primeiro material aparecerá aqui.'}</p><button class="quiet" id="clear-filters">${base.length?'Limpar filtros':'Ver todas as unidades'}</button></div>`;
}
function showDetail(id,source){const m=data.materials.find(m=>m.id===id);if(!m)return;detailId=id;origin=source||document.activeElement;$('#detail-type').textContent=m.type;$('#detail-route').textContent=path(m);$('#detail-title').textContent=m.title;$('#detail-subject').textContent=m.subject||'Material de referência';$('#original').href=m.url;$('#remove').hidden=!data.person.canEdit;$('#remove-confirm').hidden=true;renderPersonal();if(!$('#detail').open)$('#detail').showModal();$('#detail [data-close]').focus();animate($('#detail'),{y:24,opacity:.85},{y:0,opacity:1});}
function renderPersonal(){const p=data.personal[detailId];if(!p)return;$('#detail-fav').innerHTML=star;$('#detail-fav').setAttribute('aria-label',p.favorite?'Remover dos favoritos':'Adicionar aos favoritos');$('#detail-fav').setAttribute('aria-pressed',p.favorite);$('#status-controls').innerHTML=['Não iniciado','Em estudo','Revisado'].map(s=>`<button data-status="${s}" aria-pressed="${p.status===s}">${s}</button>`).join('');}
function closeDetail(){window.gsap?.killTweensOf($('#detail'));$('#detail').style.transform='';$('#detail').style.opacity='';$('#detail').close();const restored=origin?.isConnected?origin:detailId?$(`[data-material="${detailId}"]`):null;(restored||$('#module-title')).focus({preventScroll:true});}
function toggleFavorite(id,b){const p=data.personal[id];p.favorite=!p.favorite;b.setAttribute('aria-pressed',p.favorite);animate(b,{scale:.85},{scale:1,duration:timing.pop});if(detailId===id)renderPersonal();$$(`[data-favorite="${id}"]`).forEach(x=>x.setAttribute('aria-pressed',p.favorite));if(active&&$('#fav-filter').getAttribute('aria-pressed')==='true'){renderModule();if(!$('#detail').open)$('#fav-filter').focus({preventScroll:true});}}
function search(){const q=normalize($('#query').value),found=data.materials.filter(m=>normalize(m.title+' '+path(m)+' '+(m.subject||'')).includes(q));
 $('#results').innerHTML=(q&&found.length===0?'<div class="empty"><h3>Nenhum resultado.</h3><p>Explore um caminho do acervo:</p></div>':'')+(q?found.map(m=>`<button class="result" data-result="${m.id}">${esc(m.title)}<small>${esc(path(m))} · ${esc(m.type)}</small></button>`).join(''):'')+(!q||!found.length?data.modules.filter(m=>itemsFor(m.id).length).map(m=>`<button class="result" data-search-module="${m.id}">${m.name} · ${itemsFor(m.id).length} materiais<small>${[...new Set(itemsFor(m.id).map(x=>chain(x).at(-1)?.name))].map(esc).join(' · ')}</small></button>`).join(''):'');}
function openSearch(){paletteOrigin=document.activeElement;if($('#detail').open)closeDetail();$('#query').value='';search();if(!$('#palette').open)$('#palette').showModal();$('#query').focus();}
function closeSearch(){if($('#palette').open)$('#palette').close();paletteOrigin?.isConnected&&paletteOrigin.focus({preventScroll:true});}
document.addEventListener('click',e=>{const b=e.target.closest('button,a');if(!b)return;
 if(b.matches('[data-search]'))openSearch();
 if(b.dataset.module)openModule(b.dataset.module,b);
 if(b.dataset.material)showDetail(b.dataset.material,b);
 if(b.dataset.favorite)toggleFavorite(b.dataset.favorite,b);
 if(b.hasAttribute('data-unit')){unit=b.dataset.unit;subject='';renderModule();$(`[data-unit="${unit}"]`)?.focus({preventScroll:true});}
 if(b.hasAttribute('data-subject')){subject=b.dataset.subject;renderModule();$(`[data-subject="${subject}"]`)?.focus({preventScroll:true});}
 if(b.dataset.status){data.personal[detailId].status=b.dataset.status;renderPersonal();renderModule();$(`[data-status="${b.dataset.status}"]`)?.focus();}
 if(b.dataset.close==='detail')closeDetail();if(b.dataset.close==='palette')closeSearch();
 if(b.dataset.result){const id=b.dataset.result;closeSearch();showDetail(id,paletteOrigin);}
 if(b.dataset.searchModule){closeSearch();openModule(b.dataset.searchModule,paletteOrigin);}
 if(b.id==='clear-filters'){unit='';subject='';$('#local-search').value='';$('#type-filter').value='';$('#status-filter').value='';$('#fav-filter').setAttribute('aria-pressed','false');renderModule();$('#local-search').focus();}
 if(b.closest('.brand')){e.preventDefault();if(active)backHome();else window.scrollTo(0,0);}
});
$('#detail').addEventListener('cancel',e=>{e.preventDefault();closeDetail();});$('#palette').addEventListener('cancel',e=>{e.preventDefault();closeSearch();});
document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();$('#palette').open?closeSearch():openSearch();}});
// O diálogo nativo contém a página, mas o Tab terminal pode alcançar o chrome do navegador.
for(const dialog of [$('#detail'),$('#palette')])dialog.addEventListener('keydown',e=>{if(e.key!=='Tab')return;const nodes=[...dialog.querySelectorAll('button:not([disabled]),input:not([disabled]),select:not([disabled]),a[href]')].filter(n=>n.getClientRects().length);if(!nodes.length)return;const first=nodes[0],last=nodes.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}});
$('#palette').addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();closeSearch();return;}if(!['ArrowDown','ArrowUp','Enter'].includes(e.key))return;const bs=$$('#results button');if(e.key==='Enter'&&document.activeElement===$('#query')){e.preventDefault();bs[0]?.click();}else if(e.key!=='Enter'){e.preventDefault();const i=bs.indexOf(document.activeElement);bs[(i+(e.key==='ArrowDown'?1:bs.length-1)+bs.length)%bs.length]?.focus();}});
$('#query').oninput=search;$('#back-home').onclick=backHome;
for(const [id,delta] of [['prev-module',-1],['next-module',1]])$('#'+id).onclick=e=>{const i=data.modules.findIndex(m=>m.id===active);openModule(data.modules[(i+delta+data.modules.length)%data.modules.length].id,e.currentTarget);};
for(const id of ['local-search','type-filter','status-filter'])$('#'+id).addEventListener(id==='local-search'?'input':'change',renderModule);
$('#fav-filter').onclick=()=>{$('#fav-filter').setAttribute('aria-pressed',$('#fav-filter').getAttribute('aria-pressed')!=='true');renderModule();};
$('#detail-fav').onclick=e=>toggleFavorite(detailId,e.currentTarget);$('#remove').onclick=()=>{$('#remove-confirm').hidden=false;$('#confirm-remove').focus();};$('#cancel-remove').onclick=()=>{$('#remove-confirm').hidden=true;$('#remove').focus();};
$('#confirm-remove').onclick=()=>{const i=data.materials.findIndex(m=>m.id===detailId);removed={item:data.materials[i],index:i};data.materials.splice(i,1);closeDetail();renderHome();renderModule();$('#back-home').focus({preventScroll:true});scene?.update(data.modules.map(m=>itemsFor(m.id).length>0));tell('Link removido. O arquivo original no Drive não é apagado.',true);};
$('#undo').onclick=()=>{if(!removed)return;data.materials.splice(removed.index,0,removed.item);const id=removed.item.id;removed=null;renderHome();renderModule();scene?.update(data.modules.map(m=>itemsFor(m.id).length>0));tell('Link restaurado.');$(`[data-material="${id}"]`)?.focus({preventScroll:true});};$('#dismiss-toast').onclick=()=>{$('#toast').hidden=true;};
$('#pause').onclick=()=>{paused=!paused;$('#pause').setAttribute('aria-pressed',paused);$('#pause').textContent=paused?'Retomar batimento':'Pausar batimento';scene?.pause(paused);};
$('#layout-toggle').onclick=()=>{$('.atlas').classList.toggle('rail');$('#layout-toggle').textContent=$('.atlas').classList.contains('rail')?'Usar linhas-guia':'Testar trilho no celular';scene?.resize();drawMap();};
$('#editor').onchange=e=>{data.person.canEdit=e.target.checked;$('#remove').hidden=!e.target.checked;};
let drag=null;$('#drag-handle').onpointerdown=e=>{if(motion.matches)return;drag={y:e.clientY,id:e.pointerId};window.gsap?.killTweensOf($('#detail'));e.currentTarget.setPointerCapture(e.pointerId);};$('#drag-handle').onpointermove=e=>{if(drag)$('#detail').style.transform=`translateY(${Math.max(0,e.clientY-drag.y)}px)`;};
function endDrag(e){if(!drag)return;const y=e.clientY-drag.y;drag=null;if(y>85)closeDetail();else animate($('#detail'),{y:Math.max(y,0)},{y:0});}$('#drag-handle').onpointerup=endDrag;$('#drag-handle').onpointercancel=()=>{drag=null;$('#detail').style.transform='';};
async function startHeart(){const token=++boot;scene?.dispose();scene=null;$('#map').classList.remove('ready');$('#loader').hidden=false;$('#model-state').textContent='';const failure=$('#failure').value;
 const weak=(navigator.deviceMemory&&navigator.deviceMemory<=2)||navigator.connection?.saveData;
 if(failure==='webgl'||motion.matches||weak){$('#loader').hidden=true;$('#model-state').textContent=motion.matches?'Mapa estático · movimento reduzido.':'Mapa em linhas · navegação completa.';return;}
 const created=await createHeart({map:$('#map'),modules:data.modules,filled:data.modules.map(m=>itemsFor(m.id).length>0),model:failure==='model'?'../modelos/indisponivel.glb':'../modelos/heart-hra-v1.3.glb',onProgress:(got,total)=>{if(token!==boot)return;$('#progress').textContent=total?Math.round(got/total*100)+'%':Math.round(got/1024)+' KB';$('#load-text').textContent='Carregando modelo';},onProject:guides,onReady:()=>{if(token!==boot)return;$('#map').classList.add('ready');$('#loader').hidden=true;$('#model-state').textContent='Artérias estilizadas · escolha um módulo.';},onFail:()=>{if(token!==boot)return;$('#loader').hidden=true;$('#model-state').textContent='Modelo 3D indisponível. Explore o mapa em linhas.';},isCurrent:()=>token===boot});
 if(token!==boot){created?.dispose();return;}scene=created;scene?.pause(paused);scene?.visible(!active);
}
$('#scenario').value=params.get('scenario')||'atual';$('#scenario').onchange=()=>{data=scenario($('#scenario').value);removed=null;$('#toast').hidden=true;if(active)backHome();renderHome();startHeart();};
$('#failure').value=params.get('failure')||'';$('#failure').onchange=()=>{const fail=$('#failure').value==='network';$('#home-view').hidden=fail||!!active;$('#module-view').hidden=fail||!active;$('#network-error').hidden=!fail;if(fail)scene?.visible(false);else startHeart();};$('#retry').onclick=()=>{$('#failure').value='';$('#failure').onchange();};
motion.onchange=()=>{window.gsap?.killTweensOf([$('#detail'),$('.module-hero')]);startHeart();};
renderHome();if(location.hash.startsWith('#modulo-'))openModule(location.hash.slice(8));
if($('#failure').value==='network')$('#failure').onchange();else ('requestIdleCallback'in window?requestIdleCallback:setTimeout)(startHeart);
window.Aorta={openModule,showDetail,closeDetail,backHome,get data(){return data},get active(){return active},get scene(){return scene}};

