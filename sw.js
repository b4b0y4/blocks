const CACHE_VERSION = "v1";
const CACHE_NAME = `blocks-cache-${CACHE_VERSION}`;

const urlsToCache = [
  "./",
  "./index.html",
  "./css/styles.css",
  "./js/script.js",
  "./js/ethers.min.js",
  "./js/lists.js",
  "./js/contracts.js",
  "./js/abis.js",
  "./img/favicon-32x32.png",
  "./img/icon-192x192.png",
  "./img/icon-512x512.png",
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter(
              (cacheName) =>
                cacheName.startsWith("blocks-cache-") &&
                cacheName !== CACHE_NAME,
            )
            .map((cacheName) => caches.delete(cacheName)),
        );
      })
      .then(() => {
        self.clients.matchAll().then((clients) => {
          clients.forEach((client) =>
            client.postMessage({ type: "UPDATE_AVAILABLE" }),
          );
        });
      }),
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches
      .match(event.request)
      .then((response) => response || fetch(event.request)),
  );
});
