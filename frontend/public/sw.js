const STATIC_CACHE = "sikapa-static-v3";
const API_CACHE = "sikapa-api-v3";

const PRECACHE_ASSETS = [
  "/",
  "/manifest.json",
  "/offline.html",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);

      for (const asset of PRECACHE_ASSETS) {
        try {
          await cache.add(asset);
          console.log("Cached:", asset);
        } catch (error) {
          console.warn("Failed to cache:", asset, error);
        }
      }
    })()
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

  if (request.method !== "GET") return;
  if (!url.protocol.startsWith("http")) return;

  // API requests
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

  // Static/page requests
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request)
        .then((response) => {
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