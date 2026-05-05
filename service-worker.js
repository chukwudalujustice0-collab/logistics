/* service-worker.js */

const CACHE_NAME = "ceetify-logistics-v25";

const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/offline.html",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/badge-72.jpg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      for (const asset of STATIC_ASSETS) {
        try {
          await cache.add(asset);
        } catch (error) {
          console.warn("Cache skipped:", asset, error);
        }
      }
    })
  );

  self.skipWaiting();
});

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

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  const isSupabaseRequest =
    url.pathname.includes("/rest/v1/") ||
    url.pathname.includes("/auth/v1/") ||
    url.pathname.includes("/functions/v1/");

  if (isSupabaseRequest) {
    event.respondWith(fetch(event.request));
    return;
  }

  const acceptsHtml = event.request.headers.get("accept")?.includes("text/html");

  if (acceptsHtml) {
    event.respondWith(fetch(event.request).catch(() => caches.match("/offline.html")));
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type === "opaque") {
            return response;
          }

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

/* PUSH NOTIFICATIONS */
self.addEventListener("push", (event) => {
  let payload = {};

  try {
    payload = event.data ? event.data.json() : {};
  } catch (error) {
    payload = {};
  }

  const title =
    payload?.notification?.title ||
    payload?.data?.title ||
    "Ceetify Logistics";

  const body =
    payload?.notification?.body ||
    payload?.data?.body ||
    "You have a new delivery update.";

  const url =
    payload?.data?.url ||
    payload?.notification?.click_action ||
    "/notifications.html";

  const trackingId =
    payload?.data?.tracking_id ||
    "";

  const orderId =
    payload?.data?.order_id ||
    "";

  const type =
    payload?.data?.type ||
    "general";

  const options = {
    body,
    icon: "/icons/icon-192.png",
    badge: "/icons/badge-72.jpg",
    vibrate: [200, 100, 200],
    requireInteraction: true,
    renotify: true,
    tag: orderId || trackingId || type || "ceetify-logistics",
    data: {
      url,
      tracking_id: trackingId,
      order_id: orderId,
      type
    },
    actions: [
      {
        action: "open",
        title: "Open"
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || "/notifications.html";
  const finalUrl = new URL(targetUrl, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({
      type: "window",
      includeUncontrolled: true
    }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === finalUrl && "focus" in client) {
          return client.focus();
        }
      }

      for (const client of clientList) {
        if (client.url.startsWith(self.location.origin) && "focus" in client) {
          client.navigate(finalUrl);
          return client.focus();
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(finalUrl);
      }
    })
  );
});

self.addEventListener("notificationclose", () => {
  // Reserved for future analytics/audit tracking.
});
