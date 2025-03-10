// sw.js

// Danh sách các tài nguyên cần cache
const CACHE_NAME = 'crypto-tracker-cache-v1';
const urlsToCache = [
  '/index.html',
  '/style.css',
  '/script.js',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// Cài đặt service worker: cache tài nguyên
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

// Kích hoạt service worker
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Bắt sự kiện fetch: trả về cache nếu có, nếu không tải từ mạng
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
