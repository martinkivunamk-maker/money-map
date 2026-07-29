const CACHE='moneymap-test-v32';
const CORE=['./','./Money_Map.html'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>Promise.allSettled(CORE.map(x=>c.add(x)))));});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(fetch(e.request).then(r=>{const q=r.clone();caches.open(CACHE).then(c=>c.put(e.request,q));return r;}).catch(()=>caches.match(e.request).then(r=>r||caches.match('./Money_Map.html'))));});
