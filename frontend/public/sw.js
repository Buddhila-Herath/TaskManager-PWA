/* eslint-disable no-restricted-globals */

const CACHE_VERSION = "taskflow-static-v1";
const APP_SHELL_URLS = ["/", "/dashboard", "/manifest.json"];

self.addEventListener("install", (event) => {
  // Pre-cache the core app shell for offline usage.
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(APP_SHELL_URLS))
      .catch(() => {
        // Best-effort: failure to cache should not block SW install entirely.
      })
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  // Clean up old caches and take control of all clients immediately.
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (key !== CACHE_VERSION) {
              return caches.delete(key);
            }
            return undefined;
          }),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin requests.
  if (url.origin !== self.location.origin) {
    return;
  }

  // Navigation requests: try network first, fall back to cached shell or offline page.
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          return await fetch(request);
        } catch {
          const cache = await caches.open(CACHE_VERSION);
          const cachedDashboard = await cache.match("/dashboard");
          if (cachedDashboard) {
            return cachedDashboard;
          }
          const cachedRoot = await cache.match("/");
          if (cachedRoot) {
            return cachedRoot;
          }
          return new Response(
            "<!DOCTYPE html><html><head><meta charset='utf-8'><title>Offline</title></head><body><h1>Offline</h1><p>The app shell has not been cached yet. Please go online once and open the dashboard so it can be used offline.</p></body></html>",
            {
              headers: { "Content-Type": "text/html; charset=utf-8" },
              status: 503,
            },
          );
        }
      })(),
    );
    return;
  }

  // Static assets (app shell and Next static files): cache-first strategy.
  if (
    url.pathname.startsWith("/_next/static/") ||
    APP_SHELL_URLS.includes(url.pathname)
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) {
          return cached;
        }
        return fetch(request)
          .then((response) => {
            const responseClone = response.clone();
            caches.open(CACHE_VERSION).then((cache) => {
              cache.put(request, responseClone);
            });
            return response;
          })
          .catch(async () => {
            const cache = await caches.open(CACHE_VERSION);
            const fallback = await cache.match(request);
            if (fallback) {
              return fallback;
            }
            return new Response("", { status: 504 });
          });
      }),
    );
  }
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

