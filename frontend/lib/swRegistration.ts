export const registerServiceWorker = async (): Promise<
  ServiceWorkerRegistration | null
> => {
  if (typeof window === "undefined") {
    return null;
  }

  if (!("serviceWorker" in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js");
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.log("[sw] Service worker registered", registration);
    }
    return registration;
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.log("[sw] Failed to register service worker", error);
    }
    return null;
  }
};

