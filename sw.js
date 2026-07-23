const CACHE_NAME = 'qr-cards-v2';

const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './manifest.json',
    './css/styles.css',
    './js/app.js',
    './js/excel-loader.js',
    './js/qr-generator.js',
    './js/card-renderer.js',
    './js/utils.js',
    'https://cdn.sheetjs.com/xlsx-0.20.2/package/dist/xlsx.full.min.js',
    'https://cdn.jsdelivr.net/npm/qrcode@1.5.1/build/qrcode.min.js'
];

// ===== INSTALACIÓN =====
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[SW] Cacheando assets');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .catch(err => console.error('[SW] Error en install:', err))
    );
    self.skipWaiting();
});

// ===== ACTIVACIÓN =====
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(name => name !== CACHE_NAME)
                    .map(name => {
                        console.log('[SW] Eliminando cache antigua:', name);
                        return caches.delete(name);
                    })
            );
        })
    );
    self.clients.claim();
});

// ===== INTERCEPTACIÓN DE PETICIONES =====
self.addEventListener('fetch', event => {
    // Solo cachear peticiones GET
    if (event.request.method !== 'GET') {
        event.respondWith(fetch(event.request));
        return;
    }

    // Si la petición es para el archivo Excel, no cachear (siempre buscar en red)
    if (event.request.url.includes('.xlsx')) {
        event.respondWith(fetch(event.request));
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;
                }

                // Si no está en cache, buscar en red
                return fetch(event.request).then(response => {
                    // Guardar en cache para futuras visitas
                    if (response && response.status === 200) {
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                try {
                                    cache.put(event.request, responseToCache);
                                } catch (error) {
                                    console.warn('[SW] No se pudo cachear:', event.request.url);
                                }
                            });
                    }
                    return response;
                });
            })
            .catch(() => {
                // Offline: mostrar página de error
                return new Response('⚠️ Sin conexión', {
                    status: 503,
                    statusText: 'Service Unavailable'
                });
            })
    );
});
