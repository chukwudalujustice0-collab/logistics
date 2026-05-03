// push-helper.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import {
  getMessaging,
  getToken,
  onMessage
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-messaging.js";

const firebaseConfig = {
  apiKey: "AIzaSyBHrdnz7fOywJ-4qQtwS3ri-MfigqlXNss",
  authDomain: "ceetify-logistics.firebaseapp.com",
  projectId: "ceetify-logistics",
  storageBucket: "ceetify-logistics.firebasestorage.app",
  messagingSenderId: "387990603158",
  appId: "1:387990603158:web:8b2e4736c2183fa49309b7"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// 👉 FOREGROUND PUSH (THIS IS WHAT YOU WERE MISSING)
onMessage(messaging, (payload) => {
  console.log("Foreground push:", payload);

  const title =
    payload?.notification?.title ||
    payload?.data?.title ||
    "Ceetify Logistics";

  const body =
    payload?.notification?.body ||
    payload?.data?.body ||
    "New update received.";

  // Show browser notification even when app is open
  new Notification(title, {
    body,
    icon: "/icons/icon-192.png"
  });
});

// 👉 GET TOKEN
export async function requestPushToken() {
  try {
    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      alert("Notification permission denied");
      return null;
    }

    const token = await getToken(messaging, {
      vapidKey: "YOUR_VAPID_KEY"
    });

    console.log("Push token:", token);
    return token;

  } catch (err) {
    console.error("Push error:", err);
    return null;
  }
}
