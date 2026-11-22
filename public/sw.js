const CACHE_VERSION = "binro-utilities-v1";
const CORE_SHELL_URLS = [
  "/utilities/image-resizer",
  "/utilities",
  "/manifest.webmanifest",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/icons/binro-mark.svg",
  "/apple-touch-icon.png",
];

function isCacheableStaticPath(pathname) {
  return (
    pathname.startsWith("/_next/static/") ||
    pathname.startsWith("/icons/") ||
    pathname === "/manifest.webmanifest" ||
    pathname === "/apple-touch-icon.png" ||
    pathname === "/favicon.ico"
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(async (cache) => {
      await Promise.allSettled(
        CORE_SHELL_URLS.map(async (url) => {
          try {
            const response = await fetch(url, { cache: "no-cache" });
            if (response && response.ok) {
              await cache.put(url, response);
            }
          } catch {
            // Individual resource failures are retried during active asset caching.
          }
        })
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_VERSION)
            .map((oldKey) => caches.delete(oldKey))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  const data = event.data;
  if (!data || data.type !== "PRECACHE_URLS" || !Array.isArray(data.urls)) {
    return;
  }

  const replyPort = event.ports && event.ports[0];

  const precachePromise = (async () => {
    const cache = await caches.open(CACHE_VERSION);
    let cachedCount = 0;

    const uniqueSameOriginUrls = Array.from(
      new Set(
        data.urls.filter((rawUrl) => {
          try {
            const parsed = new URL(rawUrl, self.location.origin);
            return parsed.origin === self.location.origin;
          } catch {
            return false;
          }
        })
      )
    );

    await Promise.allSettled(
      uniqueSameOriginUrls.map(async (targetUrl) => {
        try {
          const existing = await cache.match(targetUrl);
          if (existing) {
            cachedCount += 1;
            return;
          }
          const response = await fetch(targetUrl, { credentials: "same-origin" });
          if (response && response.ok) {
            await cache.put(targetUrl, response);
            cachedCount += 1;
          }
        } catch {
          // Ignore single fetch failure when offline or transient.
        }
      })
    );

    const routeCached = Boolean(await cache.match("/utilities/image-resizer"));

    if (replyPort) {
      replyPort.postMessage({
        type: "PRECACHE_COMPLETE",
        cachedCount,
        routeCached,
        cacheName: CACHE_VERSION,
      });
    }
  })();

  event.waitUntil(precachePromise);
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  // Only cache same-origin requests; never cache external or blob/data URLs.
  if (url.origin !== self.location.origin) {
    return;
  }

  // Handle document navigations (e.g., reloading /utilities/image-resizer offline).
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then(async (networkResponse) => {
          if (networkResponse && networkResponse.ok) {
            const cache = await caches.open(CACHE_VERSION);
            await cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        })
        .catch(async () => {
          const cache = await caches.open(CACHE_VERSION);
          const exactMatch = await cache.match(request);
          if (exactMatch) {
            return exactMatch;
          }
          const pathMatch = await cache.match(url.pathname);
          if (pathMatch) {
            return pathMatch;
          }
          if (url.pathname.startsWith("/utilities/image-resizer")) {
            const toolShell = await cache.match("/utilities/image-resizer");
            if (toolShell) {
              return toolShell;
            }
          }
          const utilitiesShell = await cache.match("/utilities");
          if (utilitiesShell) {
            return utilitiesShell;
          }
          return new Response("Offline", {
            status: 503,
            statusText: "Offline",
            headers: { "Content-Type": "text/plain" },
          });
        })
    );
    return;
  }

  // Cache-first for immutable Next.js static bundles, fonts, CSS, icons, and manifest.
  if (isCacheableStaticPath(url.pathname)) {
    event.respondWith(
      caches.open(CACHE_VERSION).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) {
          return cached;
        }
        const networkResponse = await fetch(request);
        if (networkResponse && networkResponse.ok) {
          await cache.put(request, networkResponse.clone());
        }
        return networkResponse;
      })
    );
    return;
  }

  // Network-first with cache fallback for Next.js RSC payloads on same-origin routes.
  if (url.searchParams.has("_rsc") || request.headers.get("RSC") === "1") {
    event.respondWith(
      fetch(request)
        .then(async (networkResponse) => {
          if (networkResponse && networkResponse.ok) {
            const cache = await caches.open(CACHE_VERSION);
            await cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        })
        .catch(async () => {
          const cache = await caches.open(CACHE_VERSION);
          const cached = await cache.match(request);
          return (
            cached ||
            new Response("", { status: 504, statusText: "Offline RSC miss" })
          );
        })
    );
  }
});
