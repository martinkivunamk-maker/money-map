const CACHE = 'moneymap-v3';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', e => e.waitUntil((async () => {
  const keys = await caches.keys();
  await Promise.all(keys.map(k => k === CACHE ? null : caches.delete(k)));
  await self.clients.claim();
})()));

// Stale-while-revalidate: serve the cached copy INSTANTLY (no network wait on open), and
// refresh the cache from the network in the background so the next open is current. This
// makes opens fast even on weak signal; the trade-off is that an upload shows on the
// SECOND open after deploying (first open serves the old copy + downloads the new one).
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const network = fetch(e.request).then(async resp => {
    try { const c = await caches.open(CACHE); await c.put(e.request, resp.clone()); } catch (_) {}
    return resp;
  }).catch(() => null);
  e.respondWith((async () => {
    const cached = await caches.match(e.request);
    if (cached) return cached;                 // instant local copy
    return (await network) || new Response('Offline', { status: 503, statusText: 'Offline' });
  })());
  e.waitUntil(network);                        // keep the background refresh alive
});
