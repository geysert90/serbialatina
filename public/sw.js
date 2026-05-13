const CACHE_NAME = "serbialatina-pwa-v2";
const RUNTIME_CACHE = "serbialatina-pwa-runtime-v2";
const PRECACHE_URLS = ["/", "/manifest.webmanifest", "/logo.png", "/favicon.ico"];

function isRequestToCache(request) {
  return request.method === "GET" && (request.destination === "document" || request.destination === "image" || request.destination === "style" || request.destination === "script" || request.destination === "font" || new URL(request.url).origin === self.location.origin);
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  const cache = await caches.open(RUNTIME_CACHE);
  cache.put(request, response.clone()).catch(() => {});
  return response;
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    const cache = await caches.open(RUNTIME_CACHE);
    cache.put(request, response.clone()).catch(() => {});
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return caches.match("/");
  }
}

async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);
  const network = fetch(request)
    .then(async (response) => {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone()).catch(() => {});
      return response;
    })
    .catch(() => null);

  return cached || (await network) || fetch(request);
}

function buildNotificationOptions(data) {
  return {
    body: data.body || "Nueva publicación disponible en Serbia Latina.",
    icon: data.icon || "/icon-192-white.png",
    badge: data.badge || "/icon-192-white.png",
    tag: data.tag || "serbialatina-push",
    renotify: true,
    data: {
      url: data.url || "/",
      title: data.title || "Serbia Latina",
    },
  };
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME && key !== RUNTIME_CACHE) {
            return caches.delete(key);
          }
          return Promise.resolve();
        }),
      ),
    ),
  );
  self.clients.claim();
});

self.addEventListener("push", (event) => {
  let data = {};

  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : "" };
  }

  const title = data.title || "Serbia Latina";
  const options = buildNotificationOptions(data);

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(async (clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          const url = new URL(client.url);
          if (url.origin === self.location.origin) {
            await client.focus();
            if ("navigate" in client && typeof client.navigate === "function") {
              await client.navigate(targetUrl);
            }
            return;
          }
        }
      }

      if (clients.openWindow) {
        await clients.openWindow(targetUrl);
      }
    }),
  );
});

self.addEventListener("fetch", (event) => {
  if (!isRequestToCache(event.request)) {
    return;
  }

  const requestUrl = new URL(event.request.url);

  if (event.request.mode === "navigate" || event.request.destination === "document") {
    event.respondWith(networkFirst(event.request));
    return;
  }

  if (requestUrl.origin === self.location.origin && requestUrl.pathname.startsWith("/api/")) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  if (event.request.destination === "image" || event.request.destination === "font" || event.request.destination === "style" || event.request.destination === "script") {
    event.respondWith(staleWhileRevalidate(event.request));
    return;
  }

  event.respondWith(cacheFirst(event.request));
});
