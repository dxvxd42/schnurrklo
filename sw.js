// Offline-Cache. Bei Änderungen an der App VERSION erhöhen.
const VERSION='schnurrklo-3';
const FILES=['./','index.html','app.js','manifest.webmanifest','icon-180.png','icon-192.png','icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(VERSION).then(c=>c.addAll(FILES)));self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==VERSION).map(x=>caches.delete(x)))));self.clients.claim();});
// Erst Netz (damit Updates ankommen), sonst Cache
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET'||new URL(e.request.url).origin!==location.origin)return;
  e.respondWith(fetch(e.request).then(r=>{if(!r.ok)return r;const c=r.clone();caches.open(VERSION).then(x=>x.put(e.request,c));return r;}).catch(()=>caches.match(e.request,{ignoreSearch:true})));
});
