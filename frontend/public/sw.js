/* eslint-disable no-restricted-globals */

self.addEventListener("install", (event) => {
  // Activate the new service worker as soon as it's installed.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  // Take control of all clients immediately.
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  if (!event.data) {
    // eslint-disable-next-line no-console
    console.log("[sw][push] Received push event with no data");
    return;
  }

  let payload;

  try {
    payload = event.data.json();
    // eslint-disable-next-line no-console
    console.log("[sw][push] Parsed JSON payload", payload);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log("[sw][push] Failed to parse JSON payload, using text fallback", error);
    payload = {
      title: "Task notification",
      body: event.data.text(),
    };
  }

  const title = payload.title || "Task notification";
  const body = payload.body || "You have an update to your tasks.";

  const data = payload.data || {};

  const options = {
    body,
    data,
    icon: "/icon-192x192.png",
    badge: "/icon-192x192.png",
  };

  // eslint-disable-next-line no-console
  console.log("[sw][push] Showing notification", { title, options });

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  // eslint-disable-next-line no-console
  console.log("[sw][notificationclick] Notification clicked", {
    title: event.notification.title,
    data: event.notification.data,
  });
  event.notification.close();

  const targetUrl =
    (event.notification.data && event.notification.data.url) || "/dashboard";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (let index = 0; index < clientList.length; index += 1) {
        const client = clientList[index];
        if ("focus" in client) {
          client.focus();
          if ("navigate" in client) {
            client.navigate(targetUrl);
          }
          return;
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }

      return undefined;
    }),
  );
});

