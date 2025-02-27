const CACHE_NAME = "blocks-cache-v1";
const urlsToCache = [
  "./",
  "./index.html",
  "./css/styles.css",
  "./js/script.js",
  "./js/ethers.min.js",
  "./js/lists.js",
  "./js/contracts.js",
  "./img/favicon-32x32.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    }),
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }
      return fetch(event.request);
    }),
  );
});
