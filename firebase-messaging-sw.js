/* firebase-messaging-sw.js */

importScripts("https://www.gstatic.com/firebasejs/10.12.4/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.4/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyBHrdnz7fOywJ-4qQtwS3ri-MfigqlXNss",
  authDomain: "ceetify-logistics.firebaseapp.com",
  projectId: "ceetify-logistics",
  storageBucket: "ceetify-logistics.firebasestorage.app",
  messagingSenderId: "387990603158",
  appId: "1:387990603158:web:8b2e4736c2183fa49309b7",
  measurementId: "G-JVVF23JV7N"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notification = payload.notification || {};
  const data = payload.data || {};

  const title = notification.title || data.title || "Ceetify Logistics";
  const body = notification.body || data.body || "You have a new delivery update.";

  self.registration.showNotification(title, {
    body,
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    image: data.image || undefined,
    vibrate: [200, 100, 200],
    data: {
      url: data.url || "/notifications.html",
      tracking_id: data.tracking_id || "",
      order_id: data.order_id || "",
      type: data.type || "general"
    }
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data?.url || "/notifications.html";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(url) && "focus" in client) {
          return client.focus();
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
