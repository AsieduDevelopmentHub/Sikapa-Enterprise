const STATIC_CACHE = "sikapa-static-v2";
const API_CACHE = "sikapa-api-v2";

const PRECACHE_ASSETS = [
  "/",
  "/manifest.json",
  "/offline.html",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );

  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (
            key !== STATIC_CACHE &&
            key !== API_CACHE
          ) {
            return caches.delete(key);
          }
        })
      )
    )
  );

  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Only cache GET requests
  if (request.method !== "GET") return;

  // Ignore browser extensions/devtools/etc
  if (!url.protocol.startsWith("http")) return;

  // Handle API requests separately
  if (url.pathname.startsWith("/api")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const cloned = response.clone();

          caches.open(API_CACHE).then((cache) => {
            cache.put(request, cloned);
          });

          return response;
        })
        .catch(() => caches.match(request))
    );

    return;
  }

  // Static assets + pages
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request)
        .then((response) => {
          // Only cache successful responses
          if (
            !response ||
            response.status !== 200 ||
            response.type !== "basic"
          ) {
            return response;
          }

          const cloned = response.clone();

          caches.open(STATIC_CACHE).then((cache) => {
            cache.put(request, cloned);
          });

          return response;
        })
        .catch(() => {
          if (request.mode === "navigate") {
            return caches.match("/offline.html");
          }
        });
    })
  );
});