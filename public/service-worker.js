
// Service worker for Market Notes Haven

const CACHE_NAME = 'market-notes-haven-v9';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/favicon.ico'
];

// Install service worker and cache initial assets
self.addEventListener('install', event => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching files');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting()) // Force immediate activation
  );
});

// Activate and clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker activating...');
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Service Worker: Clearing old cache', cacheName);
            return caches.delete(cacheName);
          }
          return null;
        })
      );
    }).then(() => {
      console.log('Service Worker: Claiming clients');
      return self.clients.claim(); // Take control immediately
    })
  );
});

// Handle installation prompt event for browsers that support it
self.addEventListener('beforeinstallprompt', event => {
  // Prevents Chrome 76+ from automatically showing the prompt
  event.preventDefault();
  console.log('Installation prompt available from browser');
  
  // Store the event for later use if needed
  self.deferredInstallPrompt = event;
  
  // Optionally notify clients that installation is available
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'INSTALL_AVAILABLE'
      });
    });
  });
});

// Handle GitHub sync installation
const handleGitHubSyncInstall = () => {
  console.log('Service Worker: GitHub sync installation initiated');
  
  // In a real implementation, this would store GitHub tokens and sync data
  // For demo purposes, we just notify clients
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'GITHUB_SYNC_STATUS',
        status: 'completed'
      });
    });
  });
  
  // Mark that we've used GitHub sync for installation
  self.gitHubSyncInstalled = true;
};

// Handle app launch requests
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'OPEN_IN_APP') {
    console.log('Service Worker: Open in app requested');
    
    // Find all the PWA windows that might be open
    self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(clients => {
      // Try to find an open PWA window
      const pwaClient = clients.find(client => 
        client.url.includes(self.location.origin) && 
        client.url.includes(event.data.path || '') &&
        client.type === 'window'
      );
      
      if (pwaClient) {
        // If we found a matching PWA window, focus it
        console.log('Found existing PWA window, focusing it');
        pwaClient.focus();
      } else {
        // Otherwise open a new PWA window
        console.log('Opening new PWA window');
        self.clients.openWindow(self.location.origin + (event.data.path || ''));
      }
    });
  }
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  // Handle theme change messages from the client
  if (event.data && event.data.type === 'THEME_CHANGE') {
    const themeColor = event.data.themeColor;
    console.log('Service Worker: Theme color changed to', themeColor);
    // Broadcast theme change to all clients
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        if (client.id !== event.source.id) {
          client.postMessage({
            type: 'THEME_UPDATED',
            themeColor: themeColor
          });
        }
      });
    });
  }
  
  // Handle installation events
  if (event.data && event.data.type === 'APP_INSTALLED') {
    console.log('Service Worker: App installed notification received');
    const installMethod = event.data.installMethod || 'browser';
    console.log('Installation method:', installMethod);
    
    // Broadcast installation to all clients
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        if (client.id !== event.source.id) {
          client.postMessage({
            type: 'APP_INSTALLED',
            installMethod: installMethod
          });
        }
      });
    });
  }
  
  // Handle GitHub sync installation
  if (event.data && event.data.type === 'GITHUB_SYNC_INSTALL') {
    handleGitHubSyncInstall();
  }
  
  // Handle request to show installation prompt
  if (event.data && event.data.type === 'SHOW_INSTALL_PROMPT' && self.deferredInstallPrompt) {
    console.log('Service Worker: Installation prompt requested');
    // Notify the requesting client to show the prompt
    event.source.postMessage({
      type: 'TRIGGER_INSTALL_PROMPT'
    });
  }
});

// Fetch resources with network-first strategy for API calls and cache-first for assets
self.addEventListener('fetch', event => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }
  
  // Network-first strategy for API requests
  if (event.request.url.includes('/api/') || event.request.url.includes('supabase')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // Cache-first strategy for static assets
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        
        // Clone the request
        const fetchRequest = event.request.clone();
        
        return fetch(fetchRequest).then(response => {
          // Check if we received a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clone the response
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
            
          return response;
        }).catch(error => {
          console.log('Fetch failed:', error);
          if (event.request.mode === 'navigate') {
            // Return a custom offline page for navigation requests
            return caches.match('/');
          }
          
          return new Response('You are offline. Please check your connection.', {
            headers: { 'Content-Type': 'text/plain' }
          });
        });
      })
  );
});

// Handle push notifications
self.addEventListener('push', event => {
  const title = 'Market Notes Haven';
  const options = {
    body: event.data?.text() || 'New updates available',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png'
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Background sync for offline capabilities
self.addEventListener('sync', event => {
  if (event.tag === 'sync-notes') {
    // Implement background sync logic for notes
    console.log('Background sync triggered for notes');
  }
});

// Handle service worker updates
self.addEventListener('updatefound', () => {
  console.log('Service Worker update found!');
  // You can notify users of an update here
});

// When the app is installed
self.addEventListener('appinstalled', (event) => {
  console.log('App was installed successfully');
  
  // Clean up the stored prompt
  self.deferredInstallPrompt = null;
  
  // Notify clients that the app was installed
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'APP_INSTALLED'
      });
    });
  });
});
