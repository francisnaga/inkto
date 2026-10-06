// This is a "kill-switch" Service Worker.
// Its only purpose is to immediately unregister itself and wipe out the old broken caches.
// This ensures that all returning users get the fresh, working version of the app from the server.

self.addEventListener('install', (e) => {
  self.skipWaiting(); // Force the waiting service worker to become the active service worker.
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('[ServiceWorker] Deleting old cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      self.clients.claim(); // Take control of all clients immediately
      
      self.registration.unregister().then(() => {
        console.log('[ServiceWorker] Successfully unregistered kill-switch.');
      });
    })
  );
});

// Pass through all fetch requests directly to the network
self.addEventListener('fetch', (e) => {
  e.respondWith(fetch(e.request));
});
