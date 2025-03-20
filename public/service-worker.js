const CACHE_NAME = 'clarity-cache-v1';
const MAPBOX_CACHE = 'mapbox-tiles-v1';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/assets/icons/icon-192.png',
  '/assets/icons/icon-512.png'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== MAPBOX_CACHE)
          .map((name) => caches.delete(name))
      );
    })
  );
});

// Fetch event - serve from cache, then network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // Handle Mapbox tile requests
  if (request.url.includes('mapbox.com/styles') || request.url.includes('mapbox.com/v4')) {
    event.respondWith(handleMapboxRequest(request));
    return;
  }
  
  // Handle API requests
  if (request.url.includes('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }
  
  // Handle static assets
  event.respondWith(
    caches.match(request).then((response) => {
      return response || fetch(request).then((response) => {
        // Cache successful responses
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      });
    })
  );
});

async function handleMapboxRequest(request) {
  // Try to get from cache first
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // If not in cache, fetch and cache
  try {
    const response = await fetch(request);
    const responseClone = response.clone();
    const cache = await caches.open(MAPBOX_CACHE);
    cache.put(request, responseClone);
    return response;
  } catch (error) {
    console.error('Error fetching map tiles:', error);
    // Return offline tile if available
    return caches.match('/assets/offline-tile.png');
  }
}

async function handleApiRequest(request) {
  try {
    // Try network first
    const response = await fetch(request);
    return response;
  } catch (error) {
    // If offline, try to get from cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If not in cache, return offline response
    return new Response(
      JSON.stringify({
        error: 'You are offline',
        offline: true
      }),
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-routes') {
    event.waitUntil(syncRoutes());
  }
});

async function syncRoutes() {
  try {
    const db = await openDB();
    const offlineRoutes = await db.getAll('offlineRoutes');
    
    for (const route of offlineRoutes) {
      try {
        await fetch('/api/routes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(route)
        });
        
        await db.delete('offlineRoutes', route.id);
      } catch (error) {
        console.error('Failed to sync route:', error);
      }
    }
  } catch (error) {
    console.error('Error syncing routes:', error);
  }
}
