const CACHE = 'moneymap-v3';
const NET_TIMEOUT = 2500;

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', e => e.waitUntil((async () => {
  const keys = await caches.keys();
  await Promise.all(keys.map(k => k === CACHE ? null : caches.delete(k)));
  await self.clients.claim();
})()));

// Network-first WITH a timeout: prefer the freshest copy when the network answers
// quickly (so uploads show on the next open), but fall back to the cached copy if the
// network is slow or offline so the app never hangs. A successful network response
// still refreshes the cache in the background.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith((async () => {
    const net = fetch(e.request).then(resp => {
      const copy = resp.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
      return resp;
    });
    // Resolve with the network response if it arrives within the timeout, else null.
    const timed = new Promise(resolve => {
      const t = setTimeout(() => resolve(null), NET_TIMEOUT);
      net.then(r => { clearTimeout(t); resolve(r); }, () => { clearTimeout(t); resolve(null); });
    });
    const quick = await timed;
    if (quick) return quick;                    // network won the race → freshest copy
    const cached = await caches.match(e.request);
    if (cached) return cached;                  // slow/offline → instant local copy
    return await net;                           // no cache yet → wait for network
  })());
});
