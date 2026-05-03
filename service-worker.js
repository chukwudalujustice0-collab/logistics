/* service-worker.js */

const CACHE_NAME = "ceetify-logistics-v22";

const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/offline.html",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png"
];

// INSTALL
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      for (const asset of STATIC_ASSETS) {
        try {
          await cache.add(asset);
        } catch (e) {
          console.warn("Cache skipped:", asset);
        }
      }
    })
  );

  self.skipWaiting();
});

// ACTIVATE
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );

  self.clients.claim();
});

// FETCH
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // 🚫 NEVER CACHE AUTH / API
  if (
    url.pathname.includes("/rest/v1/") ||
    url.pathname.includes("/auth/v1/") ||
    url.pathname.includes("/functions/v1/")
  ) {
    event.respondWith(fetch(event.request));
    return;
  }

  // 🚫 NEVER CACHE HTML (CRITICAL FIX)
  if (event.request.headers.get("accept")?.includes("text/html")) {
    event.respondWith(fetch(event.request));
    return;
  }

  // ✅ CACHE STATIC FILES ONLY
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((response) => {
          const copy = response.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, copy).catch(() => {});
          });

          return response;
        })
        .catch(() => caches.match("/offline.html"));
    })
  );
});
