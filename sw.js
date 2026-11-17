const CACHE_NAME = 'marsam-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './assets/icons.svg',
  './assets/favicon.svg',
  './assets/manifest.webmanifest',
  './css/tokens.css',
  './css/themes.css',
  './css/base.css',
  './css/layout.css',
  './css/fabric.css',
  './css/animations.css',
  './css/components/button.css',
  './css/components/card.css',
  './css/components/dropdown.css',
  './css/components/filter-bar.css',
  './css/components/list.css',
  './css/components/modal.css',
  './css/components/radial-menu.css',
  './css/components/toast.css',
  './css/components/whiteboard.css',
  './js/main.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.origin) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          }
          return networkResponse;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
