const CACHE = "english-3000-v3-1-5-shell";
const DATA_CACHE = "english-3000-v3-1-5-data";
const ASSETS = [
  "./", "./index.html", "./style.css", "./app.js", "./manifest.json",
  "./data/vocab-3000-clean.json"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => ![CACHE,DATA_CACHE].includes(k)).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin === self.location.origin) {
    event.respondWith(caches.match(req).then(cached => cached || fetch(req).then(res => {
      const clone = res.clone(); caches.open(CACHE).then(c=>c.put(req,clone)).catch(()=>{}); return res;
    })));
    return;
  }
  if (url.hostname === "api.dictionaryapi.dev") {
    event.respondWith(caches.match(req).then(cached => cached || fetch(req).then(res => {
      const clone = res.clone(); caches.open(DATA_CACHE).then(c=>c.put(req,clone)).catch(()=>{}); return res;
    })));
  }
});
