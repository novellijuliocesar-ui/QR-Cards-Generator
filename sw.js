const CACHE_NAME = 'qr-cards-v6';
const BASE_PATH = '/QR-Cards-Generator/';

const ASSETS_TO_CACHE = [
    BASE_PATH,
    BASE_PATH + 'index.html',
    BASE_PATH + 'manifest.json',
    BASE_PATH + 'css/base.css',
    BASE_PATH + 'css/qr-generator.css',
    BASE_PATH + 'css/stock-finder.css',
    BASE_PATH + 'js/app.js',
    BASE_PATH + 'js/shared/utils.js',
    BASE_PATH + 'js/modules/qr-generator.js',
    BASE_PATH + 'js/modules/stock-finder.js',
    'https://cdn.sheetjs.com/xlsx-0.20.2/package/dist/xlsx.full.min.js',
    'https://cdn.jsdelivr.net/npm/qrcode@1.5.1/build/qrcode.min.js'
];

// NOTA: Los archivos Excel NO se cachean intencionalmente
// para que siempre se cargue la versión más reciente

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[SW] Cacheando assets');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .catch(err => console.error('[SW] Error:', err))
    );
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', event => {
    // No cachear archivos Excel
    if (event.request.url.includes('.xlsx')) {
        event.respondWith(fetch(event.request));
        return;
    }
    
    if (event.request.method !== 'GET') {
        event.respondWith(fetch(event.request));
        return;
    }
    
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
            .catch(() => new Response('⚠️ Sin conexión', { status: 503 }))
    );
});
