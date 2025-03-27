self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName.startsWith("blocks-cache-"))
          .map((cacheName) => caches.delete(cacheName)),
      );
    }),
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});
