import { apiClient } from "./taskApi";

const PUBLIC_VAPID_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

const isPushSupported = (): boolean =>
  typeof window !== "undefined" &&
  "serviceWorker" in navigator &&
  "PushManager" in window &&
  "Notification" in window;

const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index);
  }

  return outputArray;
};

export const subscribeToPush = async (): Promise<void> => {
  if (!isPushSupported()) {
    // eslint-disable-next-line no-console
    return;
  }

  if (!PUBLIC_VAPID_KEY) {
    return;
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    console.log("[push] Notification permission not granted:", permission);
    return;
  }

  // eslint-disable-next-line no-console
  console.log("[push] Registering service worker /sw.js");
  const registration = await navigator.serviceWorker.register("/sw.js");

  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    // eslint-disable-next-line no-console
    console.log("[push] No existing subscription, creating a new one");
    const applicationServerKey = urlBase64ToUint8Array(PUBLIC_VAPID_KEY);
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey as BufferSource,
    });
  } else {
    // eslint-disable-next-line no-console
    console.log("[push] Reusing existing push subscription");
  }

  // eslint-disable-next-line no-console
  console.log("[push] Sending subscription to backend /api/push/subscribe");
  await apiClient.post("/api/push/subscribe", { subscription });
  // eslint-disable-next-line no-console
  console.log("[push] Subscription successfully saved on backend");
};

