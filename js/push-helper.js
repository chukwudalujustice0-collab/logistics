/* js/push-helper.js */

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBHrdnz7fOywJ-4qQtwS3ri-MfigqlXNss",
  authDomain: "ceetify-logistics.firebaseapp.com",
  projectId: "ceetify-logistics",
  storageBucket: "ceetify-logistics.firebasestorage.app",
  messagingSenderId: "387990603158",
  appId: "1:387990603158:web:8b2e4736c2183fa49309b7",
  measurementId: "G-JVVF23JV7N"
};

const FCM_VAPID_PUBLIC_KEY =
  "BEZYja206XfMP8jOMpSdgcSv35tH4Me7THQTVyXaBSSdvD1GURzmNtqCdIxiBu_06oVncSXCaULCRE20O38VUOw";

let firebaseApp = null;
let firebaseMessaging = null;

async function initPushNotifications(userId) {
  try {
    if (!userId) {
      return { success: false, error: "User ID is required." };
    }

    if (!("Notification" in window)) {
      return { success: false, error: "Notifications are not supported on this browser." };
    }

    if (!("serviceWorker" in navigator)) {
      return { success: false, error: "Service worker is not supported on this browser." };
    }

    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      return { success: false, error: "Notification permission was not granted." };
    }

    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");

    if (!firebaseApp) {
      firebaseApp = firebase.initializeApp(FIREBASE_CONFIG);
    }

    if (!firebaseMessaging) {
      firebaseMessaging = firebase.messaging();
    }

    const token = await firebaseMessaging.getToken({
      vapidKey: FCM_VAPID_PUBLIC_KEY,
      serviceWorkerRegistration: registration
    });

    if (!token) {
      return { success: false, error: "FCM token was not generated." };
    }

    const { error } = await supabaseClient
      .from("push_tokens")
      .upsert({
        user_id: userId,
        token,
        device_type: "web",
        browser: navigator.userAgent,
        active: true,
        created_at: new Date().toISOString()
      }, {
        onConflict: "user_id,token"
      });

    if (error) {
      return { success: false, error: error.message };
    }

    firebaseMessaging.onMessage((payload) => {
      const title =
        payload?.notification?.title ||
        payload?.data?.title ||
        "Ceetify Logistics";

      const body =
        payload?.notification?.body ||
        payload?.data?.body ||
        "You have a new delivery update.";

      if (Notification.permission === "granted") {
        new Notification(title, {
          body,
          icon: "/icons/icon-192.png",
          badge: "/icons/icon-192.png",
          data: payload?.data || {}
        });
      }
    });

    return {
      success: true,
      token
    };

  } catch (error) {
    console.error("Push setup error:", error);
    return {
      success: false,
      error: error.message || "Push notification setup failed."
    };
  }
}

async function disablePushNotifications(userId) {
  try {
    if (!userId) return;

    const { data } = await supabaseClient
      .from("push_tokens")
      .select("token")
      .eq("user_id", userId)
      .eq("active", true);

    if (data?.length) {
      for (const row of data) {
        await supabaseClient
          .from("push_tokens")
          .update({ active: false })
          .eq("token", row.token);
      }
    }

    return { success: true };

  } catch (error) {
    console.error(error);
    return { success: false, error: error.message };
  }
}
