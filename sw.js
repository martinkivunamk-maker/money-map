const CACHE = 'moneymap-v3';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', e => e.waitUntil((async () => {
  const keys = await caches.keys();
  await Promise.all(keys.map(k => k === CACHE ? null : caches.delete(k)));
  await self.clients.claim();
})()));

// Network-first: always serve the latest when online; fall back to cache only when offline.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith((async () => {
    try {
      const fresh = await fetch(e.request);
      try { const c = await caches.open(CACHE); c.put(e.request, fresh.clone()); } catch (_) {}
      return fresh;
    } catch (err) {
      const cached = await caches.match(e.request);
      if (cached) return cached;
      throw err;
    }
  })());
});
