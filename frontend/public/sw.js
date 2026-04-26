const VERSION = "v4";
const STATIC_CACHE = `sikapa-static-${VERSION}`;
const RUNTIME_CACHE = `sikapa-runtime-${VERSION}`;
const API_CACHE = `sikapa-api-${VERSION}`;

// Keep precache intentionally small; Next.js hashed assets are handled via runtime caching.
const PRECACHE_ASSETS = ["/", "/manifest.json", "/offline.html"];

const MAX_API_ENTRIES = 80;
const MAX_RUNTIME_ENTRIES = 120;
const ONE_HOUR_MS = 60 * 60 * 1000;
const ONE_DAY_MS = 24 * ONE_HOUR_MS;

function isSameOrigin(url) {
  return url.origin === self.location.origin;
}

function isNextStatic(url) {
  return url.pathname.startsWith("/_next/static/");
}

function isAsset(url) {
  return (
    url.pathname.startsWith("/assets/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/favicon") ||
    url.pathname.startsWith("/apple-touch-icon") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".jpg") ||
    url.pathname.endsWith(".jpeg") ||
    url.pathname.endsWith(".webp") ||
    url.pathname.endsWith(".gif") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".ico") ||
    url.pathname.endsWith(".woff") ||
    url.pathname.endsWith(".woff2") ||
    url.pathname.endsWith(".ttf") ||
    url.pathname.endsWith(".otf")
  );
}

function isApi(url) {
  // Your frontend uses NEXT_PUBLIC_API_URL (often different origin).
  // This SW can only transparently cache cross-origin if CORS allows it;
  // we still apply caching strategy when we see /api paths on same-origin (if any).
  return url.pathname.startsWith("/api");
}

function isCacheablePublicApi(url) {
  // Cache only public, read-only GETs. Never cache auth/cart/orders/admin endpoints.
  // Adjust this allowlist as needed.
  const p = url.pathname;
  if (!p.startsWith("/api")) return false;
  if (p.includes("/auth/")) return false;
  if (p.includes("/admin/")) return false;
  if (p.includes("/cart")) return false;
  if (p.includes("/orders")) return false;
  if (p.includes("/payments")) return false;
  if (p.includes("/returns")) return false;
  // Products, categories, search, reviews are safe candidates.
  return (
    p.includes("/products") ||
    p.includes("/reviews") ||
    p.includes("/wishlist") ||
    p.includes("/subscriptions")
  );
}

async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  const extra = keys.length - maxEntries;
  if (extra <= 0) return;
  for (let i = 0; i < extra; i++) {
    await cache.delete(keys[i]);
  }
}

async function cacheWithTtl(cacheName, request, response) {
  const cache = await caches.open(cacheName);
  const headers = new Headers(response.headers);
  headers.set("sw-cache-time", String(Date.now()));
  const wrapped = new Response(await response.clone().blob(), {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
  await cache.put(request, wrapped);
  // Best-effort trimming.
  if (cacheName === API_CACHE) await trimCache(API_CACHE, MAX_API_ENTRIES);
  if (cacheName === RUNTIME_CACHE) await trimCache(RUNTIME_CACHE, MAX_RUNTIME_ENTRIES);
  return response;
}

async function matchFresh(cacheName, request, ttlMs) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (!cached) return null;
  const t = Number(cached.headers.get("sw-cache-time") || "0");
  if (!t) return cached; // legacy entries (no ttl) treated as valid
  if (Date.now() - t > ttlMs) return null;
  return cached;
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);

      for (const asset of PRECACHE_ASSETS) {
        try {
          await cache.add(asset);
        } catch {
          // Ignore individual precache failures (dev/offline.html may not exist in some setups).
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
            key !== API_CACHE &&
            key !== RUNTIME_CACHE
          ) {
            return caches.delete(key);
          }
        })
      )
    )
  );

  self.clients.claim();
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== "GET") return;
  if (!url.protocol.startsWith("http")) return;

  // 1) Next.js hashed static assets: cache-first (these are immutable).
  if (isSameOrigin(url) && isNextStatic(url)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((res) => {
          if (!res || res.status !== 200) return res;
          void cacheWithTtl(RUNTIME_CACHE, request, res);
          return res;
        });
      })
    );
    return;
  }

  // 2) Public assets & images: stale-while-revalidate to reduce bandwidth & speed up repeat visits.
  if (isSameOrigin(url) && isAsset(url)) {
    event.respondWith(
      (async () => {
        const cached = await matchFresh(RUNTIME_CACHE, request, ONE_DAY_MS);
        const fetchPromise = fetch(request)
          .then((res) => {
            if (!res || res.status !== 200) return res;
            void cacheWithTtl(RUNTIME_CACHE, request, res);
            return res;
          })
          .catch(() => null);
        return cached || (await fetchPromise) || (await caches.match(request));
      })()
    );
    return;
  }

  // 3) Same-origin API GETs (if present): stale-while-revalidate for safe public endpoints only.
  if (isSameOrigin(url) && isApi(url) && isCacheablePublicApi(url)) {
    event.respondWith(
      (async () => {
        const cached = await matchFresh(API_CACHE, request, ONE_HOUR_MS);
        const fetchPromise = fetch(request)
          .then((res) => {
            if (!res || res.status !== 200) return res;
            void cacheWithTtl(API_CACHE, request, res);
            return res;
          })
          .catch(() => null);
        return cached || (await fetchPromise) || (await caches.match(request));
      })()
    );
    return;
  }

  // 4) Navigations: network-first with offline fallback.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          // Don't cache HTML pages aggressively; Next.js pages can be dynamic.
          return res;
        })
        .catch(() => caches.match("/offline.html"))
    );
    return;
  }

  // 5) Default: cache-first for anything else on same-origin, but with a short TTL.
  event.respondWith(
    (async () => {
      const cached = await matchFresh(STATIC_CACHE, request, ONE_HOUR_MS);
      if (cached) return cached;
      try {
        const res = await fetch(request);
        if (!res || res.status !== 200 || (res.type !== "basic" && res.type !== "cors")) return res;
        void cacheWithTtl(STATIC_CACHE, request, res);
        return res;
      } catch {
        return (await caches.match(request)) || Response.error();
      }
    })()
  );
});