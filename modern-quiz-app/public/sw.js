// AZ-204 Quiz App Service Worker
// Provides offline functionality and caching for better performance

const CACHE_NAME = 'az-204-quiz-v2'; // Increment version to force update
const STATIC_CACHE_NAME = 'az-204-static-v2';
const DATA_CACHE_NAME = 'az-204-data-v2';

// Assets to cache immediately (start with empty for development)
const STATIC_ASSETS = [];

// Optional assets to try caching (won't fail if they don't exist)
const OPTIONAL_ASSETS = [
  '/',
  '/manifest.json',
];

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('[ServiceWorker] Install');

  event.waitUntil(
    caches
      .open(STATIC_CACHE_NAME)
      .then(cache => {
        console.log('[ServiceWorker] Cache opened successfully');
        
        // Skip essential assets if array is empty
        if (STATIC_ASSETS.length === 0) {
          console.log('[ServiceWorker] No essential assets to cache');
          return Promise.resolve();
        }
        
        console.log('[ServiceWorker] Pre-caching essential assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[ServiceWorker] Essential assets done, trying optional assets');
        // Try to cache optional assets without failing
        return caches.open(STATIC_CACHE_NAME).then(cache => {
          return Promise.allSettled(
            OPTIONAL_ASSETS.map(url => 
              cache.add(url).catch(err => {
                console.warn('[ServiceWorker] Failed to cache optional asset:', url, err.message);
                return null;
              })
            )
          );
        });
      })
      .then(() => {
        console.log('[ServiceWorker] Caching complete');
        // Force activate new service worker
        return self.skipWaiting();
      })
      .catch(err => {
        console.error('[ServiceWorker] Cache setup failed:', err);
        // Still skip waiting even if caching fails
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[ServiceWorker] Activate');

  event.waitUntil(
    caches
      .keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (
              cacheName !== CACHE_NAME &&
              cacheName !== STATIC_CACHE_NAME &&
              cacheName !== DATA_CACHE_NAME
            ) {
              console.log('[ServiceWorker] Removing old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        // Claim all clients
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests differently
  if (url.pathname.startsWith('/api/') || url.pathname.includes('/data/')) {
    event.respondWith(
      caches.open(DATA_CACHE_NAME).then(cache => {
        return fetch(request)
          .then(response => {
            // Cache successful responses
            if (response.status === 200) {
              cache.put(request.url, response.clone());
            }
            return response;
          })
          .catch(() => {
            // Return cached version if network fails
            return cache.match(request);
          });
      })
    );
    return;
  }

  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        // Return cached index.html for navigation requests when offline
        return caches.match('/');
      })
    );
    return;
  }

  // Handle other requests with cache-first strategy
  event.respondWith(
    caches.match(request).then(response => {
      if (response) {
        return response;
      }

      return fetch(request).then(response => {
        // Don't cache non-successful responses
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Clone the response
        const responseToCache = response.clone();

        caches.open(CACHE_NAME).then(cache => {
          cache.put(request, responseToCache);
        });

        return response;
      });
    })
  );
});

// Handle background sync for offline actions
self.addEventListener('sync', event => {
  console.log('[ServiceWorker] Background sync', event.tag);

  if (event.tag === 'quiz-progress-sync') {
    event.waitUntil(
      // Sync any pending quiz progress when back online
      syncQuizProgress()
    );
  }
});

// Sync quiz progress when back online
async function syncQuizProgress() {
  try {
    // Get pending sync data from IndexedDB or localStorage
    // This would sync any quiz progress that was saved offline
    console.log('[ServiceWorker] Syncing quiz progress...');

    // Since your app uses localStorage, it's already persistent
    // No additional sync needed unless you implement server sync
  } catch (error) {
    console.error('[ServiceWorker] Sync failed:', error);
  }
}

// Handle push notifications (future feature)
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json();

    const options = {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: data.data,
      actions: [
        {
          action: 'open',
          title: 'Open Quiz',
        },
        {
          action: 'close',
          title: 'Close',
        },
      ],
    };

    event.waitUntil(self.registration.showNotification(data.title, options));
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'open') {
    event.waitUntil(clients.openWindow('/'));
  }
});
