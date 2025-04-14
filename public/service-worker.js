
// Self-unregister service worker to clean up any previous registrations
self.addEventListener('install', (event) => {
  self.skipWaiting();
  self.registration.unregister().then(() => {
    console.log('Service worker unregistered');
  });
});
