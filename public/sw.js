/**
 * Service Worker for GaavConnect
 * Enables offline functionality with IndexedDB caching
 */

const CACHE_VERSION = 'gaavconnect-v1';
const CACHE_NAMES = {
  STATIC: `${CACHE_VERSION}-static`,
  DYNAMIC: `${CACHE_VERSION}-dynamic`,
  DATA: `${CACHE_VERSION}-data`,
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAMES.STATIC).then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/manifest.json',
      ]).catch(err => console.warn('Static cache failed:', err));
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!Object.values(CACHE_NAMES).includes(cacheName)) {
            return caches.delete(cacheName);
          }
          return Promise.resolve();
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - cache-first for static, network-first for API
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip same-origin API requests (POST, etc)
  if (url.origin !== location.origin && request.method !== 'GET') {
    return;
  }

  // Static assets - cache first
  if (
    url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/) ||
    url.pathname === '/'
  ) {
    event.respondWith(
      caches.match(request).then((response) => {
        if (response) {
          return response;
        }
        return fetch(request).then((response) => {
          if (!response || response.status !== 200 || response.type === 'error') {
            return response;
          }
          
          // Check if response can be cloned
          try {
            const responseClone = response.clone();
            const cache = caches.open(CACHE_NAMES.STATIC);
            cache.then((c) => c.put(request, responseClone)).catch((err) => {
              console.warn('Cache put failed:', err);
            });
          } catch (err) {
            console.warn('Response clone failed:', err);
          }
          
          return response;
        }).catch(() => {
          // Return offline page
          return caches.match('/');
        });
      })
    );
  } else {
    // API/dynamic content - network first
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (!response || response.status !== 200) {
            return response;
          }
          
          // Check if response can be cloned before caching
          try {
            const responseClone = response.clone();
            const cache = caches.open(CACHE_NAMES.DYNAMIC);
            cache.then((c) => c.put(request, responseClone)).catch((err) => {
              console.warn('Dynamic cache put failed:', err);
            });
          } catch (err) {
            console.warn('Dynamic response clone failed:', err);
          }
          
          return response;
        })
        .catch(() => {
          return caches.match(request).then((response) => {
            return response || new Response('Offline', { status: 503 });
          });
        })
    );
  }
});

// Handle background sync for offline data submission
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-routes') {
    event.waitUntil(syncRoutes());
  }
  if (event.tag === 'sync-reports') {
    event.waitUntil(syncReports());
  }
});

// Sync saved routes
async function syncRoutes() {
  try {
    const db = await openDB('gaavconnect');
    const routes = await getAllFromIndexedDB(db, 'pending-routes');
    
    for (const route of routes) {
      try {
        const response = await fetch('/api/routes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(route),
        });
        if (response.ok) {
          await deleteFromIndexedDB(db, 'pending-routes', route.id);
        }
      } catch (error) {
        console.error('Failed to sync route:', error);
      }
    }
  } catch (error) {
    console.error('Sync routes failed:', error);
  }
}

// Sync crowd reports
async function syncReports() {
  try {
    const db = await openDB('gaavconnect');
    const reports = await getAllFromIndexedDB(db, 'pending-reports');
    
    for (const report of reports) {
      try {
        const response = await fetch('/api/reports', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(report),
        });
        if (response.ok) {
          await deleteFromIndexedDB(db, 'pending-reports', report.id);
        }
      } catch (error) {
        console.error('Failed to sync report:', error);
      }
    }
  } catch (error) {
    console.error('Sync reports failed:', error);
  }
}

// IndexedDB helpers
function openDB(name) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pending-routes')) {
        db.createObjectStore('pending-routes', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('pending-reports')) {
        db.createObjectStore('pending-reports', { keyPath: 'id' });
      }
    };
  });
}

function getAllFromIndexedDB(db, storeName) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function deleteFromIndexedDB(db, storeName, key) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(key);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}
