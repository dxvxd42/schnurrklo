const KEY='schnurrklo-v1';
const EAR_COLORS=['#d9a47c','#a8876b','#5b4a42','#e8c39e','#b9b0a8','#6b6866'];
const TYPES=[
  {id:'pipi',label:'Pipi',em:'💧',sub:'kleines Geschäft'},
  {id:'kacka',label:'Häufchen',em:'💩',sub:'großes Geschäft'},
  {id:'beides',label:'Beides',em:'✨',sub:'Pipi + Häufchen'}
];
const DEF={
  cats:[
    {id:'c1',name:'Katze',sex:'w',photo:null,color:EAR_COLORS[0]},
    {id:'c2',name:'Kater',sex:'m',photo:null,color:EAR_COLORS[1]}
  ],
  boxes:[
    {id:'grau',name:'Graues Klo',color:'#9aa0a6'},
    {id:'gelb',name:'Gelbes Klo',color:'#f4c542'},
    {id:'rosa',name:'Rosa Klo',color:'#f2a3b8'}
  ],
  entries:[]
};
let S; // wird ganz unten geladen, wenn alle Funktionen bereitstehen
let sel={cat:null,box:null,type:null};
let range=7;

/* Alles, was gespeichert oder importiert wird, wird streng geprüft und neu aufgebaut.
   So kann auch eine manipulierte Sicherungsdatei keinen Code in die App schleusen. */
const RX_HEX=/^#[0-9a-f]{6}$/i, RX_ID=/^[a-z0-9]{1,24}$/i,
      RX_PHOTO=/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+\/]+={0,2}$/;
function clean(d){
  if(!d||typeof d!=='object'||!Array.isArray(d.cats)||!Array.isArray(d.entries))throw new Error('Format');
  const str=(s,n)=>typeof s==='string'?s.replace(/[\u0000-\u001f\u007f]/g,'').slice(0,n).trim():'';
  const cats=DEF.cats.map((def,i)=>{
    const c=d.cats[i]&&typeof d.cats[i]==='object'?d.cats[i]:{};
    return {id:def.id,name:str(c.name,20)||def.name,sex:c.sex==='m'?'m':c.sex==='w'?'w':def.sex,
      photo:typeof c.photo==='string'&&c.photo.length<600000&&RX_PHOTO.test(c.photo)?c.photo:null,
      color:EAR_COLORS.includes(c.color)?c.color:def.color};
  });
  const boxes=DEF.boxes.map(def=>{
    const b=(Array.isArray(d.boxes)?d.boxes:[]).find(x=>x&&x.id===def.id)||{};
    return {id:def.id,name:str(b.name,20)||def.name,color:def.color};
  });
  const catIds=new Set(cats.map(c=>c.id)),boxIds=new Set(boxes.map(b=>b.id)),typeIds=new Set(TYPES.map(t=>t.id));
  const maxT=Date.now()+2*864e5,seen=new Set(),entries=[];
  for(const e of d.entries.slice(0,200000)){
    if(!e||typeof e!=='object')continue;
    if(!catIds.has(e.cat)||!boxIds.has(e.box)||!typeIds.has(e.type))continue;
    if(typeof e.t!=='number'||!isFinite(e.t)||e.t<946684800000||e.t>maxT)continue;
    let id=typeof e.id==='string'&&RX_ID.test(e.id)?e.id:uid();
    while(seen.has(id))id=uid();seen.add(id);
    entries.push({id,cat:e.cat,box:e.box,type:e.type,t:Math.round(e.t),note:str(e.note,200)});
  }
  return {cats,boxes,entries};
}
function readStore(k){
  try{const raw=localStorage.getItem(k);return raw?clean(JSON.parse(raw)):null;}catch(e){return null;}
}
function load(){
  const main=readStore(KEY);if(main)return main;
  // Hauptstand unlesbar: Rohdaten beiseitelegen, damit sie nie überschrieben werden
  try{const raw=localStorage.getItem(KEY);if(raw&&!localStorage.getItem(KEY+'-defekt'))localStorage.setItem(KEY+'-defekt',raw);}catch(e){}
  // dann den letzten guten Stand nehmen
  return readStore(KEY+'-prev')||clean(JSON.parse(JSON.stringify(DEF)));
}
function save(){
  try{
    const old=localStorage.getItem(KEY);
    localStorage.setItem(KEY,JSON.stringify(S));
    if(old)localStorage.setItem(KEY+'-prev',old); // ein Schritt zurück als Rettungsanker
  }
  catch(e){alert('Speichern fehlgeschlagen – der Speicher ist voll. Bitte eine Sicherung speichern.');}
}
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const catById=id=>S.cats.find(c=>c.id===id);
const boxById=id=>S.boxes.find(b=>b.id===id);
const typeById=id=>TYPES.find(t=>t.id===id);
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,6);}

function catFaceSVG(color){
  const n=parseInt(color.slice(1),16),lum=(0.299*(n>>16)+0.587*(n>>8&255)+0.114*(n&255));
  const line=lum<110?'#f4e3b0':'#4a3428'; // Mund hell auf dunklem Fell, dunkel auf hellem
  const eye=(x)=>`<ellipse cx="${x}" cy="30" rx="5" ry="5.4" fill="#f2c230" stroke="#4a3428" stroke-width="1"/><ellipse cx="${x}" cy="30" rx="1.5" ry="4.2" fill="#2e211a"/><circle cx="${x+1.6}" cy="28" r="1.1" fill="#fff"/>`;
  return `<svg viewBox="0 0 64 64" width="70%" height="70%">${eye(22)}${eye(42)}<path d="M28.5 38h7l-3.5 3.5z" fill="#e07a7a"/><path d="M32 41.5q-3.5 4.5-8 2M32 41.5q3.5 4.5 8 2" stroke="${line}" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M4 36h14M5 42h13M46 36h14M46 42h13" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".8"/></svg>`;
}
function avatar(c,size=''){
  return `<div class="avatar ${size}" style="--earc:${c.color}"><div class="face">${c.photo?`<img src="${esc(c.photo)}" alt="">`:catFaceSVG(c.color)}</div></div>`;
}
function boxSVG(color){
  return `<svg viewBox="0 0 64 48"><path d="M6 18h52l-5 24a4 4 0 0 1-4 3H15a4 4 0 0 1-4-3z" fill="${color}"/><path d="M4 14h56a2 2 0 0 1 0 6H4a2 2 0 0 1 0-6z" fill="${color}" style="filter:brightness(.9)"/><path d="M4 14h56a2 2 0 0 1 0 6H4a2 2 0 0 1 0-6z" fill="rgba(0,0,0,.08)"/><g fill="#fff" opacity=".7"><ellipse cx="32" cy="33" rx="4" ry="3.4"/><circle cx="26.5" cy="28" r="1.7"/><circle cx="30" cy="25.5" r="1.7"/><circle cx="34" cy="25.5" r="1.7"/><circle cx="37.5" cy="28" r="1.7"/></g></svg>`;
}
const sexLabel=c=>c.sex==='m'?'Kater':'Katze';

/* ---------- Eintragen ---------- */
function nowLocal(d=new Date()){
  const p=n=>String(n).padStart(2,'0');
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
function renderPick(){
  $('#pickCat').innerHTML=S.cats.map(c=>`<button class="catbtn ${sel.cat===c.id?'sel':''}" data-cat="${c.id}">${avatar(c)}<span class="catname">${esc(c.name)}</span><span class="catsub">${sexLabel(c)}</span></button>`).join('');
  $('#pickBox').innerHTML=S.boxes.map(b=>`<button class="boxbtn ${sel.box===b.id?'sel':''}" data-box="${b.id}">${boxSVG(b.color)}<span>${esc(b.name)}</span></button>`).join('');
  $('#pickType').innerHTML=TYPES.map(t=>`<button class="typebtn ${sel.type===t.id?'sel':''}" data-type="${t.id}"><span class="em">${t.em}</span>${t.label}<small>${t.sub}</small></button>`).join('');
  $('#saveBtn').disabled=!(sel.cat&&sel.box&&sel.type);
}
document.addEventListener('click',e=>{
  const c=e.target.closest('[data-cat]'),b=e.target.closest('[data-box]'),t=e.target.closest('[data-type]');
  if(c){sel.cat=c.dataset.cat;renderPick();}
  if(b){sel.box=b.dataset.box;renderPick();}
  if(t){sel.type=t.dataset.type;renderPick();}
});
let lastAdded=null,toastTimer;
$('#saveBtn').onclick=()=>{
  const w=$('#when').value;
  const t=w?new Date(w).getTime():Date.now();
  const e={id:uid(),cat:sel.cat,box:sel.box,type:sel.type,t,note:$('#note').value.trim()};
  S.entries.push(e);save();
  lastAdded=e.id;
  const c=catById(e.cat);
  toast(`${typeById(e.type).em} Für ${c.name} eingetragen`,true);
  if(navigator.vibrate)navigator.vibrate(20);
  sel={cat:null,box:null,type:null};
  $('#note').value='';$('#when').value=nowLocal();
  renderAll();
  window.scrollTo({top:0,behavior:'smooth'});
};
function toast(msg,undo){
  $('#toastMsg').textContent=msg;
  $('#toastUndo').classList.toggle('hidden',!undo);
  $('#toast').classList.add('on');
  clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('on'),4000);
}
$('#toastUndo').onclick=()=>{
  if(!lastAdded)return;
  S.entries=S.entries.filter(e=>e.id!==lastAdded);lastAdded=null;save();renderAll();
  $('#toast').classList.remove('on');
};

function ago(t){
  const m=Math.round((Date.now()-t)/60000);
  if(m<1)return 'gerade eben';
  if(m<60)return `vor ${m} Min.`;
  const h=Math.floor(m/60);
  if(h<24)return `vor ${h} Std.`;
  const d=Math.floor(h/24);return d===1?'vor 1 Tag':`vor ${d} Tagen`;
}
function startOfDay(d=new Date()){const x=new Date(d);x.setHours(0,0,0,0);return x.getTime();}
const isPipi=e=>e.type==='pipi'||e.type==='beides';
const isKacka=e=>e.type==='kacka'||e.type==='beides';

function renderToday(){
  const sod=startOfDay();
  $('#todayBox').innerHTML=S.cats.map(c=>{
    const mine=S.entries.filter(e=>e.cat===c.id);
    const td=mine.filter(e=>e.t>=sod);
    const lp=mine.filter(isPipi).sort((a,b)=>b.t-a.t)[0];
    const lk=mine.filter(isKacka).sort((a,b)=>b.t-a.t)[0];
    const kWarn=mine.length&&(!lk||Date.now()-lk.t>48*3600e3);
    return `<div class="tcat">${avatar(c,'sm')}<b>${esc(c.name)}</b>
      <div class="counts"><span>💧${td.filter(isPipi).length}</span><span>💩${td.filter(isKacka).length}</span></div>
      <div class="last">Pipi: ${lp?ago(lp.t):'–'}<br><span class="${kWarn?'warn':''}">Häufchen: ${lk?ago(lk.t):'–'}</span></div></div>`;
  }).join('');
}

/* ---------- Verlauf ---------- */
function fillFilters(){
  const fc=$('#fCat').value||'',fb=$('#fBox').value||'';
  $('#fCat').innerHTML=`<option value="">Alle Katzen</option>`+S.cats.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('');
  $('#fBox').innerHTML=`<option value="">Alle Klos</option>`+S.boxes.map(b=>`<option value="${b.id}">${esc(b.name)}</option>`).join('');
  $('#fCat').value=fc;$('#fBox').value=fb;
}
$('#fCat').onchange=$('#fBox').onchange=()=>renderLog();
const fmtDay=t=>{
  const d=startOfDay(new Date(t)),today=startOfDay();
  if(d===today)return 'Heute';
  if(d===today-864e5)return 'Gestern';
  return new Date(t).toLocaleDateString('de-DE',{weekday:'long',day:'numeric',month:'long'});
};
const fmtTime=t=>new Date(t).toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'});
function renderLog(){
  const fc=$('#fCat').value,fb=$('#fBox').value;
  const list=S.entries.filter(e=>(!fc||e.cat===fc)&&(!fb||e.box===fb)).sort((a,b)=>b.t-a.t).slice(0,400);
  if(!list.length){$('#logList').innerHTML=emptyCat('Noch keine Einträge – die Fellnasen waren wohl brav.');return;}
  let html='',cur='';
  for(const e of list){
    const day=fmtDay(e.t);
    if(day!==cur){html+=`<div class="day">${day}</div>`;cur=day;}
    const c=catById(e.cat)||{name:'?',color:'#ccc'},b=boxById(e.box)||{name:'?',color:'#ccc'},ty=typeById(e.type);
    html+=`<div class="entry">${avatar(c,'sm')}<div class="info"><div class="t1">${esc(c.name)} · ${ty.label}</div>
      <div class="t2">${fmtTime(e.t)} · <span class="dot" style="background:${b.color}"></span>${esc(b.name)}${e.note?' · '+esc(e.note):''}</div></div>
      <span class="em">${ty.em}</span><button class="del" data-del="${e.id}" aria-label="Löschen">✕</button></div>`;
  }
  $('#logList').innerHTML=html;
}
$('#logList').addEventListener('click',e=>{
  const d=e.target.closest('[data-del]');if(!d)return;
  if(!confirm('Diesen Eintrag löschen?'))return;
  S.entries=S.entries.filter(x=>x.id!==d.dataset.del);save();renderAll();
});
function emptyCat(msg){
  return `<div class="empty"><svg viewBox="0 0 100 100"><path d="M20 70c0-22 14-34 30-34s30 12 30 34c0 8-6 12-30 12S20 78 20 70z" fill="#e8c39e"/><path d="M30 44 L28 22 L42 36Z M70 44 L72 22 L58 36Z" fill="#e8c39e"/><path d="M38 56q4-4 8 0M54 56q4-4 8 0" stroke="#4a3428" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="M80 74q14-2 10-16" stroke="#e8c39e" stroke-width="7" fill="none" stroke-linecap="round"/><text x="74" y="30" font-size="12" fill="#c9a98a" font-weight="700">z</text><text x="82" y="20" font-size="9" fill="#c9a98a" font-weight="700">z</text></svg><p>${msg}</p></div>`;
}

/* ---------- Statistik ---------- */
$('#range').onclick=e=>{
  const b=e.target.closest('button');if(!b)return;
  range=+b.dataset.d;
  [...$('#range').children].forEach(x=>x.classList.toggle('on',x===b));
  renderStats();
};
function renderStats(){
  const from=range?startOfDay()-(range-1)*864e5:0;
  const ents=S.entries.filter(e=>e.t>=from);
  if(!ents.length){$('#statsBody').innerHTML=emptyCat('In diesem Zeitraum gibt es noch nichts zu zählen.');return;}
  let html='';
  // Pro Katze: Summen + Ø pro Tag
  const days=range||Math.max(1,Math.ceil((Date.now()-startOfDay(new Date(Math.min(...ents.map(e=>e.t)))))/864e5));
  html+=`<div class="today" style="margin-bottom:16px">`+S.cats.map(c=>{
    const m=ents.filter(e=>e.cat===c.id);
    const p=m.filter(isPipi).length,k=m.filter(isKacka).length;
    return `<div class="tcat">${avatar(c,'sm')}<b>${esc(c.name)}</b><div class="counts"><span>💧${p}</span><span>💩${k}</span></div>
      <div class="last">Ø pro Tag: ${(p/days).toFixed(1).replace('.',',')} Pipi · ${(k/days).toFixed(1).replace('.',',')} Häufchen</div></div>`;
  }).join('')+`</div>`;

  // Balken letzte Tage (max 14)
  const nb=range===7?7:14;
  html+=`<h2 style="font-size:16px">Gänge pro Tag <span class="muted" style="font-weight:500">(letzte ${nb} Tage)</span></h2>`;
  const sod=startOfDay();
  const daysArr=[...Array(nb)].map((_,i)=>sod-(nb-1-i)*864e5);
  const per=daysArr.map(d=>S.cats.map(c=>S.entries.filter(e=>e.cat===c.id&&e.t>=d&&e.t<d+864e5).length));
  const max=Math.max(1,...per.map(a=>a.reduce((x,y)=>x+y,0)));
  html+=`<div class="bars">`+daysArr.map((d,i)=>{
    const tot=per[i].reduce((x,y)=>x+y,0);
    const segs=S.cats.map((c,ci)=>per[i][ci]?`<div style="height:${per[i][ci]/max*110}px;background:${c.color}"></div>`:'').join('');
    const lbl=new Date(d).toLocaleDateString('de-DE',nb===7?{weekday:'short'}:{day:'numeric'});
    return `<div class="bar"><span class="num">${tot||''}</span><div class="stack">${segs}</div><span class="lbl">${lbl}</span></div>`;
  }).join('')+`</div>`;
  html+=`<div class="legend">${S.cats.map(c=>`<span><span class="dot" style="background:${c.color}"></span>${esc(c.name)}</span>`).join('')}</div>`;

  // Wer nutzt welches Klo
  html+=`<h2 style="font-size:16px;margin-top:20px">Wer nutzt welches Klo?</h2><table class="matrix"><tr><th></th>${S.boxes.map(b=>`<th><span class="dot" style="background:${b.color}"></span><br>${esc(b.name.replace(/ ?Klo$/,''))}</th>`).join('')}</tr>`;
  for(const c of S.cats){
    const m=ents.filter(e=>e.cat===c.id);
    html+=`<tr><td><div class="cn">${avatar(c,'sm')}</div></td>${S.boxes.map(b=>{
      const x=m.filter(e=>e.box===b.id);
      const p=x.filter(isPipi).length,k=x.filter(isKacka).length;
      const pct=m.length?Math.round(x.length/m.length*100):0;
      return `<td>${x.length?`${pct}&nbsp;%<div class="muted" style="font-weight:600;font-size:12px">💧${p} 💩${k}</div>`:'<span class="muted">–</span>'}</td>`;
    }).join('')}</tr>`;
  }
  html+=`</table>`;
  $('#statsBody').innerHTML=html;
}

/* ---------- Profile ---------- */
let photoFor=null;
function renderProf(){
  $('#profList').innerHTML=S.cats.map(c=>`<div class="prof">
    <div>${avatar(c,'lg')}</div>
    <div class="fields">
      <input type="text" value="${esc(c.name)}" data-name="${c.id}" placeholder="Name" maxlength="20">
      <div class="seg" style="margin:0">
        <button data-sex="${c.id}:w" class="${c.sex!=='m'?'on':''}">Katze ♀</button>
        <button data-sex="${c.id}:m" class="${c.sex==='m'?'on':''}">Kater ♂</button>
      </div>
      <div class="photo-actions">
        <button class="btn primary" data-photo="${c.id}">📷 Foto wählen</button>
        ${c.photo?`<button class="btn danger" data-nophoto="${c.id}">Entfernen</button>`:''}
      </div>
      <div class="colorpick">${EAR_COLORS.map(col=>`<button style="background:${col}" data-col="${c.id}:${col}" class="${c.color===col?'on':''}" aria-label="Farbe"></button>`).join('')}</div>
    </div></div>`).join('');
  $('#boxNames').innerHTML=S.boxes.map(b=>`<div class="row" style="margin-bottom:8px"><span class="dot" style="background:${b.color};width:22px;height:22px"></span><input type="text" value="${esc(b.name)}" data-bname="${b.id}" maxlength="20" style="flex:1"></div>`).join('');
}
$('#profList').addEventListener('change',e=>{
  const n=e.target.dataset.name;
  if(n){catById(n).name=e.target.value.trim()||'Mieze';save();renderAll();}
});
$('#boxNames').addEventListener('change',e=>{
  const n=e.target.dataset.bname;
  if(n){boxById(n).name=e.target.value.trim()||'Klo';save();renderAll();}
});
$('#profList').addEventListener('click',e=>{
  const t=e.target.closest('button');if(!t)return;
  if(t.dataset.sex){const[id,s]=t.dataset.sex.split(':');catById(id).sex=s;save();renderAll();}
  if(t.dataset.col){const[id,col]=t.dataset.col.split(':');catById(id).color=col;save();renderAll();}
  if(t.dataset.photo){photoFor=t.dataset.photo;$('#photoFile').value='';$('#photoFile').click();}
  if(t.dataset.nophoto){catById(t.dataset.nophoto).photo=null;save();renderAll();}
});
$('#photoFile').onchange=async e=>{
  const f=e.target.files[0];if(!f||!photoFor)return;
  if(!/^image\//.test(f.type)&&f.type!==''){alert('Bitte ein Foto auswählen.');return;}
  try{
    const url=await resizeImage(f,320);
    if(!catById(photoFor))return;
    catById(photoFor).photo=url;save();renderAll();
    toast('Profilbild gespeichert 😻',false);
  }catch(err){alert('Das Bild konnte nicht geladen werden.');}
};
function resizeImage(file,size){
  return new Promise((res,rej)=>{
    const img=new Image(),u=URL.createObjectURL(file);
    img.onload=()=>{
      const s=Math.min(img.naturalWidth,img.naturalHeight);
      const cv=document.createElement('canvas');cv.width=cv.height=size;
      cv.getContext('2d').drawImage(img,(img.naturalWidth-s)/2,(img.naturalHeight-s)/2,s,s,0,0,size,size);
      URL.revokeObjectURL(u);res(cv.toDataURL('image/jpeg',.85));
    };
    img.onerror=()=>{URL.revokeObjectURL(u);rej();};
    img.src=u;
  });
}

/* ---------- Sicherung ---------- */
function download(name,text,type){
  const blob=new Blob([text],{type});
  const file=new File([blob],name,{type});
  if(navigator.canShare&&navigator.canShare({files:[file]})){
    navigator.share({files:[file],title:name}).catch(()=>{});return;
  }
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),2000);
}
/* Verschlüsselung der Sicherung: PBKDF2 (310.000 Runden, SHA-256) → AES-256-GCM */
function toB64(u8){let s='';for(let i=0;i<u8.length;i+=0x8000)s+=String.fromCharCode.apply(null,u8.subarray(i,i+0x8000));return btoa(s);}
const fromB64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
async function pwKey(pw,salt){
  const base=await crypto.subtle.importKey('raw',new TextEncoder().encode(pw),'PBKDF2',false,['deriveKey']);
  return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:310000,hash:'SHA-256'},base,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
}
async function encrypt(text,pw){
  const salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12));
  const ct=await crypto.subtle.encrypt({name:'AES-GCM',iv},await pwKey(pw,salt),new TextEncoder().encode(text));
  return JSON.stringify({schnurrklo:'enc1',salt:toB64(salt),iv:toB64(iv),data:toB64(new Uint8Array(ct))});
}
async function decrypt(o,pw){
  const pt=await crypto.subtle.decrypt({name:'AES-GCM',iv:fromB64(o.iv)},await pwKey(pw,fromB64(o.salt)),fromB64(o.data));
  return new TextDecoder().decode(pt);
}
const EXP_KEY=KEY+'-lastExport';
function markExport(){try{localStorage.setItem(EXP_KEY,String(Date.now()));}catch(e){}renderBackupInfo();}
function renderBackupInfo(){
  let t=0;try{t=+localStorage.getItem(EXP_KEY)||0;}catch(e){}
  $('#lastExp').textContent=t?`Letzte Sicherung: ${new Date(t).toLocaleDateString('de-DE')}`:'Noch keine Sicherung gespeichert.';
  $('#backupHint').classList.toggle('hidden',!(S.entries.length>=20&&Date.now()-t>30*864e5));
}
$('#exportBtn').onclick=async()=>{
  const pw=$('#pw').value;
  if(!pw&&!confirm('Ohne Passwort kann jeder, der die Datei bekommt, alle Einträge und Fotos sehen. Trotzdem unverschlüsselt speichern?'))return;
  try{
    const json=JSON.stringify(S);
    const out=pw?await encrypt(json,pw):json;
    download(`schnurrklo-${nowLocal().slice(0,10)}${pw?'-verschluesselt':''}.json`,out,'application/json');
    markExport();
  }catch(err){alert('Die Sicherung konnte nicht erstellt werden.');}
};
$('#csvBtn').onclick=()=>{
  const rows=[['Datum','Uhrzeit','Katze','Klo','Geschäft','Notiz']];
  for(const e of [...S.entries].sort((a,b)=>a.t-b.t)){
    const d=new Date(e.t);
    rows.push([d.toLocaleDateString('de-DE'),fmtTime(e.t),catById(e.cat)?.name,boxById(e.box)?.name,typeById(e.type).label,e.note||'']);
  }
  download(`schnurrklo-${nowLocal().slice(0,10)}.csv`,'﻿'+rows.map(r=>r.map(x=>`"${String(x??'').replace(/"/g,'""')}"`).join(';')).join('\n'),'text/csv');
};
$('#importBtn').onclick=()=>{$('#importFile').value='';$('#importFile').click();};
$('#importFile').onchange=async e=>{
  const f=e.target.files[0];if(!f)return;
  if(f.size>30*1024*1024){alert('Die Datei ist zu groß für eine Schnurrklo-Sicherung.');return;}
  let d;
  try{
    d=JSON.parse(await f.text());
    if(d&&d.schnurrklo==='enc1'){
      const pw=$('#pw').value;
      if(!pw){alert('Diese Sicherung ist verschlüsselt. Bitte oben das Passwort eintragen und erneut laden.');return;}
      try{d=JSON.parse(await decrypt(d,pw));}catch(err){alert('Falsches Passwort, oder die Datei ist beschädigt.');return;}
    }
    d=clean(d);
  }catch(err){alert('Das ist keine gültige Schnurrklo-Sicherung.');return;}
  if(!confirm(`Sicherung mit ${d.entries.length} Einträgen laden? Die aktuellen Daten werden ersetzt.`))return;
  S=d;save();renderAll();toast('Sicherung geladen',false);
};
$('#wipeBtn').onclick=()=>{
  if(!confirm('Wirklich ALLE Einträge, Namen und Fotos von diesem Gerät löschen?'))return;
  if(!confirm('Letzte Nachfrage: Das kann nicht rückgängig gemacht werden. Löschen?'))return;
  try{[KEY,KEY+'-prev',KEY+'-defekt',EXP_KEY].forEach(k=>localStorage.removeItem(k));}catch(e){}
  S=clean(JSON.parse(JSON.stringify(DEF)));sel={cat:null,box:null,type:null};renderAll();
  toast('Alle Daten gelöscht',false);
};

/* ---------- Navigation ---------- */
document.querySelector('nav').onclick=e=>{
  const b=e.target.closest('button');if(!b)return;
  document.querySelectorAll('nav button').forEach(x=>x.classList.toggle('on',x===b));
  document.querySelectorAll('.view').forEach(v=>v.classList.toggle('on',v.id==='v-'+b.dataset.v));
  window.scrollTo(0,0);
};

function greet(){
  const h=new Date().getHours();
  $('#greet').textContent=h<11?'Guten Morgen! Wer war schon auf dem Klo?':h<18?'Wer war auf dem Klo?':'Guten Abend! Noch ein Klogang?';
}
function renderAll(){renderPick();renderToday();fillFilters();renderLog();renderStats();renderProf();renderBackupInfo();}

S=load();
$('#when').value=nowLocal();
greet();renderAll();
// Uhrzeit aktuell halten, wenn die App wieder geöffnet wird
document.addEventListener('visibilitychange',()=>{if(!document.hidden){$('#when').value=nowLocal();greet();renderToday();}});
// Installations-Tipp für Safari (nur wenn nicht schon installiert)
const isIOS=/iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
if(isIOS&&!navigator.standalone)$('#iosHint').classList.remove('hidden');
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
// Speicher dauerhaft anfordern
if(navigator.storage&&navigator.storage.persist)navigator.storage.persist();
