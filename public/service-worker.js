
// Basic Service Worker
self.addEventListener('install', (event) => {
  console.log('Service worker installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service worker activated');
  return self.clients.claim();
});

// Basic offline caching strategy
self.addEventListener('fetch', (event) => {
  // Respond with cached resources when available, otherwise fetch from network
  event.respondWith(
    fetch(event.request)
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
