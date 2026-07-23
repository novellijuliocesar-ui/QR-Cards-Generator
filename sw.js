const CACHE_NAME = 'qr-cards-v4';
const BASE_PATH = '/QR-Cards-Generator/';

const ASSETS_TO_CACHE = [
    BASE_PATH,
    BASE_PATH + 'index.html',
    BASE_PATH + 'manifest.json',
    BASE_PATH + 'css/styles.css',
    BASE_PATH + 'js/app.js',
    BASE_PATH + 'js/shared/navigation.js',
    BASE_PATH + 'js/shared/utils.js',
    BASE_PATH + 'js/modules/qr-generator/qr-module.js',
    BASE_PATH + 'js/modules/qr-generator/qr-generator.js',
    BASE_PATH + 'js/modules/qr-generator/excel-loader.js',
    BASE_PATH + 'js/modules/qr-generator/card-renderer.js',
    BASE_PATH + 'js/modules/qr-generator/qr-utils.js',
    BASE_PATH + 'js/modules/stock-finder/stock-finder.js',
    BASE_PATH + 'js/modules/stock-finder/stock-loader.js',
    BASE_PATH + 'js/modules/stock-finder/stock-utils.js',
    'https://cdn.sheetjs.com/xlsx-0.20.2/package/dist/xlsx.full.min.js',
    'https://cdn.jsdelivr.net/npm/qrcode@1.5.1/build/qrcode.min.js'
];

// ... resto del Service Worker igual que antes ...