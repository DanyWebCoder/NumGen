const CACHE_NAME = 'chislo-dany-v1';
const urlsToCache = [
  './',
  './index.html',
  './manifest.webmanifest',
  'https://fonts.googleapis.com/css2?family=Unbounded:wght@500;700;800;900&family=Manrope:wght@400;500;600;700;800&display=swap',
  'https://fonts.gstatic.com/s/unbounded/v7/Yq6V-Ky1443TnGShKx1t9Em1QkMe0dNxDjU9mQ.woff2',
  'https://fonts.gstatic.com/s/manrope/v15/xn7_YHE41ni1AdIRqAuZuw1Bx9mbZga6OQ.woff2'
];

// Установка: кешируем всё нужное
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache).catch((err) => {
        console.warn('Не удалось закешировать:', err);
      });
    })
  );
  self.skipWaiting();
});

// Активация: удаляем старые кеш-версии
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Запросы: сначала кеш, потом сеть
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Возвращаем из кеша, но параллельно обновляем в фоне
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse);
            });
          }
        }).catch(() => {});
        return cachedResponse;
      }
      
      // Если нет в кеше — запрашиваем из сети
      return fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      });
    })
  );
});
