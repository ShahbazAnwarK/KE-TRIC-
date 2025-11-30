// Service Worker for TRIC Form PWA - Universal Version
// Works on GitHub Pages, Netlify, Vercel, AWS, and any hosting
const CACHE_NAME = 'tric-form-v1.0.3';

// Use relative URLs that work everywhere
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
];

// Install Service Worker
self.addEventListener('install', event => {
  console.log('[Service Worker] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Caching app shell');
        return cache.addAll(urlsToCache).catch(err => {
          console.error('[Service Worker] Cache addAll error:', err);
          // Try adding one by one if batch fails
          return Promise.all(
            urlsToCache.map(url => {
              return cache.add(url).catch(e => {
                console.error('[Service Worker] Failed to cache:', url, e);
                return Promise.resolve();
              });
            })
          );
        });
      })
      .then(() => {
        console.log('[Service Worker] Installed successfully');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[Service Worker] Installation failed:', error);
      })
  );
});

// Activate Service Worker
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activating...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => {
      console.log('[Service Worker] Activated successfully');
      return self.clients.claim();
    })
  );
});

// Fetch Strategy: Cache First, then Network
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-http requests
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return;
  }

  // Cache first strategy
  event.respondWith(
    caches.match(request)
      .then(cachedResponse => {
        if (cachedResponse) {
          console.log('[Service Worker] Serving from cache:', request.url);
          return cachedResponse;
        }

        console.log('[Service Worker] Fetching from network:', request.url);
        return fetch(request)
          .then(response => {
            // Don't cache if not a valid response
            if (!response || response.status !== 200 || response.type === 'error') {
              return response;
            }

            // Don't cache opaque responses
            if (response.type === 'opaque') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(request, responseToCache);
              });

            return response;
          })
          .catch(error => {
            console.error('[Service Worker] Fetch failed:', error);
            return caches.match('./index.html');
          });
      })
  );
});

// Background Sync (for future backend integration)
self.addEventListener('sync', event => {
  console.log('[Service Worker] Background sync triggered:', event.tag);
  
  if (event.tag === 'sync-tric-forms') {
    event.waitUntil(syncForms());
  }
});

// Placeholder for future sync functionality
async function syncForms() {
  console.log('[Service Worker] Syncing forms...');
  return Promise.resolve();
}

// Push Notifications (for future use)
self.addEventListener('push', event => {
  console.log('[Service Worker] Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'New update available',
    icon: './icons/icon-192x192.png',
    badge: './icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };

  event.waitUntil(
    self.registration.showNotification('TRIC Form', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', event => {
  console.log('[Service Worker] Notification clicked');
  event.notification.close();

  event.waitUntil(
    clients.openWindow('./')
  );
});
