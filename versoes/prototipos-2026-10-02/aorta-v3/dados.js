const seed = {
  "_aviso": "DADOS FICTÍCIOS SÓ PARA TESTE. Não são o catálogo real e não contêm links verdadeiros.",
  "areas": [
    { "id": "m1", "name": "M1", "parentId": "", "order": 1, "stain": "" },
    { "id": "m2", "name": "M2", "parentId": "", "order": 2, "stain": "" },
    { "id": "cis1", "name": "CIS 1", "short": "CIS1", "parentId": "m1", "order": 1, "stain": "hema" },
    { "id": "bbio1", "name": "BBIO 1", "short": "BBIO1", "parentId": "m1", "order": 2, "stain": "giemsa" },
    { "id": "cis1-pm", "name": "Práticas Médicas", "short": "PM", "parentId": "cis1", "order": 1, "stain": "eosin" },
    { "id": "cis1-anat", "name": "Anatomia", "short": "ANAT", "parentId": "cis1", "order": 2, "stain": "hema" },
    { "id": "cis2", "name": "CIS 2", "short": "CIS2", "parentId": "m2", "order": 1, "stain": "hema" },
    { "id": "bbio2", "name": "BBIO 2", "short": "BBIO2", "parentId": "m2", "order": 2, "stain": "pas" },
    { "id": "cis2-anat", "name": "Anatomia", "short": "ANAT", "parentId": "cis2", "order": 1, "stain": "hema" },
    { "id": "cis2-pm", "name": "Práticas Médicas", "short": "PM", "parentId": "cis2", "order": 2, "stain": "eosin" },
    { "id": "cis2-fisio", "name": "Fisiologia", "short": "FISIO", "parentId": "cis2", "order": 3, "stain": "masson" },
    { "id": "bbio2-imuno", "name": "Imunologia", "short": "IMUNO", "parentId": "bbio2", "order": 1, "stain": "pas" },
    { "id": "bbio2-micro", "name": "Microbiologia", "short": "MICRO", "parentId": "bbio2", "order": 2, "stain": "safra" }
  ],
  "collections": [
    { "id": "c1", "name": "Exemplo: revisão da prova" },
    { "id": "c2", "name": "Exemplo: casos clínicos" }
  ],
  "materials": [
    { "id": "t1", "title": "Exemplo — slides de placentação com casos clínicos de placenta percreta e gêmeos monocoriônicos (título longo de propósito)", "url": "https://example.com/t1", "areaId": "cis1-pm", "subject": "Placentação", "type": "Slides", "tags": ["exemplo", "embriologia"], "collectionIds": ["c1"], "status": "em-estudo", "favorite": true, "createdAt": "2026-09-01T10:00:00Z", "lastOpenedAt": "2026-09-20T10:00:00Z" },
    { "id": "t2", "title": "Exemplo — resumo de tecido epitelial", "url": "https://example.com/t2", "areaId": "cis1-pm", "subject": "Tecido epitelial", "type": "Resumo", "tags": ["exemplo"], "collectionIds": ["c1"], "status": "revisado", "favorite": false, "createdAt": "2026-09-02T10:00:00Z" },
    { "id": "t3", "title": "Exemplo — caso clínico de fratura do colo do fêmur", "url": "https://example.com/t3", "areaId": "cis1-anat", "subject": "Membro inferior", "type": "Caso clínico", "tags": ["exemplo", "fratura"], "collectionIds": ["c2"], "status": "nao-iniciado", "favorite": false, "createdAt": "2026-09-03T10:00:00Z" },
    { "id": "t4", "title": "Exemplo — livro de anatomia", "url": "https://example.com/t4", "areaId": "cis1-anat", "type": "Livro", "tags": [], "collectionIds": [], "status": "nao-iniciado", "favorite": false, "createdAt": "2026-09-04T10:00:00Z" },
    { "id": "t5", "title": "Exemplo — revisão de imunologia", "url": "https://example.com/t5", "areaId": "bbio2-imuno", "subject": "Imunidade inata", "type": "Resumo", "tags": ["exemplo"], "collectionIds": [], "status": "em-estudo", "favorite": true, "createdAt": "2026-09-05T10:00:00Z" },
    { "id": "t6", "title": "Exemplo — cocos piogênicos", "url": "https://example.com/t6", "areaId": "bbio2-micro", "subject": "Bacteriologia", "type": "Slides", "tags": ["exemplo"], "collectionIds": ["c1"], "status": "nao-iniciado", "favorite": false, "createdAt": "2026-09-06T10:00:00Z" },
    { "id": "t7", "title": "Exemplo — material sem área definida", "url": "https://example.com/t7", "areaId": "", "type": "Link", "tags": [], "collectionIds": [], "status": "nao-iniciado", "favorite": false, "createdAt": "2026-09-07T10:00:00Z" }
  ]
}
;
const anatomy = [
  { id:"m1", name:"M1", c:"#b8a8ff", n:4, art:"descendente anterior", units:[["CIS 1","4 materiais",true],["BBIO 1","Em produção",false]], mats:[["Práticas Médicas",2],["Anatomia",2]], path:[[2,34],[14,14],[26,-14],[34,-48]] },
  { id:"m2", name:"M2", c:"#ff8fb0", n:2, art:"coronária direita", units:[["CIS 2","Em produção",false],["BBIO 2","2 materiais",true]], mats:[["Imunologia",1],["Microbiologia",1]], path:[[-6,32],[-34,22],[-62,4],[-78,-26]] },
  { id:"m3", name:"M3", off:true, art:"circunflexa", path:[[12,36],[44,30],[72,22],[96,8]] },
  { id:"m4", name:"M4", off:true, art:"primeira diagonal", path:[[16,10],[36,2],[54,-12]] },
  { id:"m5", name:"M5", off:true, art:"segunda diagonal", path:[[26,-14],[44,-24],[58,-38]] },
  { id:"m6", name:"M6", off:true, art:"marginal aguda", path:[[-56,8],[-52,-16],[-44,-42]] },
  { id:"m7", name:"M7", off:true, art:"marginal obtusa", path:[[70,22],[84,4],[86,-20]] },
  { id:"m8", name:"M8", off:true, art:"ramo do cone", path:[[-4,30],[-20,40],[-30,46]] }
];

// Cenários exclusivamente fictícios. Preferências pertencem à pessoa demo, não ao catálogo.
export function scenario(name = 'atual') {
 const areas = structuredClone(seed.areas);
 for (const m of anatomy) if (!areas.some(a => a.id === m.id)) areas.push({id:m.id,name:m.name,parentId:'',order:areas.length});
 const modules = areas.filter(a => !a.parentId).map((a,i) => ({...a,art:anatomy[i]?.art||'ramo do acervo',path:anatomy[i]?.path||[[0,25],[20,-30]],token:`--m${i%8+1}`,index:i}));
 let materials = structuredClone(seed.materials);
 if (name === 'abundante') {
   materials = [];
   const subjects = ['Placentação','Imunologia','Anatomia','Fisiologia','Histologia','Práticas Médicas'];
   modules.forEach((m,i) => {
     const unit = `${m.id}-demo`, subject = `${unit}-materia`;
     areas.push({id:unit,name:`CIS ${i+1}`,parentId:m.id},{id:subject,name:subjects[i%subjects.length],parentId:unit});
     const count = i === 0 ? 31 : i === 7 ? 11 : 13;
     for(let k=0;k<count;k++) {
       let areaId=subject;
       if(i===0 && k===30){areaId=subject+'-solo';areas.push({id:areaId,name:'Embriologia',parentId:unit});}
       const type=['Slides','Resumo','Caso clínico','Livro','Monitoria','Prova'][k%6];
       materials.push({id:`demo-${i}-${k}`,title:`Exemplo — ${type.toLowerCase()} de ${subjects[i%subjects.length].toLowerCase()}: ${k%3===0?'integração entre estrutura, desenvolvimento e aplicação nos estudos dirigidos com questões comentadas':'roteiro de estudo e revisão'} · ${k+1}`,url:`https://example.com/material/${i}/${k}`,areaId,subject:subjects[i%subjects.length],type,tags:['exemplo'],status:k%4===0?'em-estudo':'nao-iniciado',favorite:k%7===0,createdAt:new Date(Date.UTC(2026,8,1+k)).toISOString()});
     }
   });
 }
 const personal = Object.fromEntries(materials.map(m=>[m.id,{favorite:m.favorite,status:({'nao-iniciado':'Não iniciado','em-estudo':'Em estudo','revisado':'Revisado'})[m.status],lastOpenedAt:m.lastOpenedAt}]));
 materials.forEach(m=>{delete m.favorite;delete m.status;delete m.lastOpenedAt;});
 return {areas,modules,materials,personal,person:{name:'Pessoa de demonstração',canEdit:true}};
}
