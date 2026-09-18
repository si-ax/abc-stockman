// Bump this string whenever you hand Si a new build (alongside
// APP_BUILD_VERSION in index.html) — it's what tells the service worker
// to drop the old cached files and pick up the new ones. It doesn't need
// to match APP_BUILD_VERSION exactly, it just needs to CHANGE.
const CACHE_NAME = 'abc-stockman-2026-09-17i';

const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  // Take over immediately rather than waiting for every tab to close —
  // paired with the controllerchange/reload listener in index.html, this
  // is what makes an update actually apply the next time the app opens.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(
        names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  // Network-first: when he's got signal, always fetch the latest copy
  // (and refresh the cache with it). When he doesn't, fall back to
  // whatever was last cached, so the app still opens out in the field.
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match('./index.html')))
  );
});
