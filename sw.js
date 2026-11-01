// Dưới Gốc Thị – offline cache (network-first for pages, cache-first for static assets)
const V = 'kg-v21';
const CORE = ['./', './shared/engine.js?v=21', './shared/daily.js?v=21', './shared/profile.js?v=21', './shared/hub.js?v=21', './shared/three.module.min.js?v=21',
  './dovehuongson/', './dovehuongson/main.js?v=21', './maugiao/', './maugiao/main.js?v=21', './trianlietsi/', './trianlietsi/main.js?v=21', './shared/ungho-qr.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(CORE)).catch(() => {})); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  const isCode = r.mode === 'navigate' || /\.(js|html|webmanifest)$/.test(new URL(r.url).pathname);
  e.respondWith(isCode
    ? fetch(r).then(res => { const cp = res.clone(); caches.open(V).then(c => c.put(r, cp)); return res; }).catch(() => caches.match(r).then(m => m || caches.match(r, { ignoreSearch: true })))
    : caches.match(r).then(m => m || fetch(r).then(res => { const cp = res.clone(); caches.open(V).then(c => c.put(r, cp)); return res; })));
});
