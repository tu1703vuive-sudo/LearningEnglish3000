const VERSION='v3.3.2';
const SHELL=`english3000-shell-${VERSION}`;
const DATA=`english3000-data-${VERSION}`;
const API='english3000-api-v1';
const SHELL_ASSETS=['./','./index.html','./style.css','./app.js','./manifest.json',
  './src/config.js','./src/topic-mapping.js','./src/utils.js','./src/state.js','./src/srs.js','./src/data.js','./src/session.js','./src/quiz-engine.js','./src/audio.js','./src/ui.js','./src/sentence-learning.js'];
const DATA_ASSETS=['./data/vocab-clean.json','./data/topic-word-map-v1.json','./data/audit-report-v3.2.1.json',
  './data/content/sentences-v1-core-200.json','./data/content/dialogues-v1-core-30.json'];
self.addEventListener('install',event=>{event.waitUntil(Promise.all([
  caches.open(SHELL).then(c=>c.addAll(SHELL_ASSETS)),
  caches.open(DATA).then(c=>c.addAll(DATA_ASSETS))
]));self.skipWaiting();});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('english3000-')&&![SHELL,DATA,API].includes(k)).map(k=>caches.delete(k)))));self.clients.claim();});
async function cacheFirst(req,cacheName){const c=await caches.open(cacheName),hit=await c.match(req);if(hit)return hit;const res=await fetch(req);if(res.ok)c.put(req,res.clone());return res;}
async function networkFirst(req,cacheName){const c=await caches.open(cacheName);try{const res=await fetch(req);if(res.ok)c.put(req,res.clone());return res;}catch{const hit=await c.match(req);if(hit)return hit;throw new Error('offline');}}
async function trimCache(name,max=80){const c=await caches.open(name),keys=await c.keys();if(keys.length>max)await Promise.all(keys.slice(0,keys.length-max).map(k=>c.delete(k)));}
self.addEventListener('fetch',event=>{if(event.request.method!=='GET')return;const url=new URL(event.request.url);
  if(url.origin===self.location.origin){const isData=url.pathname.includes('/data/');event.respondWith(cacheFirst(event.request,isData?DATA:SHELL));return;}
  if(url.hostname==='api.dictionaryapi.dev'){event.respondWith(networkFirst(event.request,API).finally(()=>trimCache(API,80)));}
});
