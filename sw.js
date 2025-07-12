// Wellness Tracker Service Worker
const CACHE_VERSION = 'v2.0.0'; // Increment this when you make changes
const CACHE_NAME = `wellness-tracker-${CACHE_VERSION}`;
const urlsToCache = [
    './',
    './index.html',
    './manifest.json',
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
];

// Install event
self.addEventListener('install', event => {
    console.log('Service Worker installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache:', CACHE_NAME);
                return cache.addAll(urlsToCache).catch(error => {
                    console.log('Cache addAll failed:', error);
                    // Continue even if some resources fail to cache
                    return Promise.resolve();
                });
            })
    );
    // Force the waiting service worker to become the active service worker
    self.skipWaiting();
});

// Fetch event with network-first strategy for HTML files
self.addEventListener('fetch', event => {
    // Network-first strategy for HTML files to ensure fresh content
    if (event.request.url.includes('index.html') || event.request.url.endsWith('/')) {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    // Cache the fresh response
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseClone);
                    });
                    return response;
                })
                .catch(() => {
                    // Fallback to cache if network fails
                    return caches.match(event.request);
                })
        );
    } else {
        // Cache-first strategy for other resources
        event.respondWith(
            caches.match(event.request)
                .then(response => {
                    // Return cached version or fetch from network
                    return response || fetch(event.request);
                })
                .catch(error => {
                    console.log('Fetch failed:', error);
                    // Fallback to network request
                    return fetch(event.request);
                })
        );
    }
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    console.log('Service Worker activating...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            // Take control of all clients immediately
            return self.clients.claim();
        })
    );
});

// Background sync for data backup
self.addEventListener('sync', event => {
    if (event.tag === 'background-sync') {
        event.waitUntil(
            // Implement background sync logic here
            console.log('Background sync triggered')
        );
    }
});

// Push notifications (optional)
self.addEventListener('push', event => {
    const options = {
        body: event.data ? event.data.text() : 'New wellness reminder',
        icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><rect width="192" height="192" fill="#121212"/><text y="96" x="96" text-anchor="middle" dominant-baseline="middle" font-size="120" fill="#4a90e2">💪</text></svg>',
        badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect width="96" height="96" fill="#4a90e2"/><text y="48" x="48" text-anchor="middle" dominant-baseline="middle" font-size="60" fill="white">💪</text></svg>',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        }
    };

    event.waitUntil(
        self.registration.showNotification('Wellness Tracker', options)
    );
}); 