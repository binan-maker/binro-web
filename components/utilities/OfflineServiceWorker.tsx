"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

type OfflineCacheState =
  | "caching"
  | "ready"
  | "unsupported"
  | "error";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

function subscribeOnlineStatus(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function getOnlineSnapshot() {
  return navigator.onLine;
}

function getServerOnlineSnapshot() {
  return true;
}

function collectCurrentPageStaticAssets(): string[] {
  const urls = new Set<string>([
    "/utilities/image-resizer",
    "/utilities",
    "/manifest.webmanifest",
    "/icons/icon-192x192.png",
    "/icons/icon-512x512.png",
    "/apple-touch-icon.png",
  ]);

  if (typeof window === "undefined") {
    return Array.from(urls);
  }

  const origin = window.location.origin;

  document
    .querySelectorAll<HTMLScriptElement | HTMLLinkElement>(
      'script[src], link[rel="stylesheet"], link[rel="preload"]'
    )
    .forEach((element) => {
      const rawUrl =
        element instanceof HTMLScriptElement ? element.src : element.href;
      if (!rawUrl) return;
      try {
        const parsed = new URL(rawUrl, origin);
        if (parsed.origin === origin) {
          urls.add(parsed.pathname + parsed.search);
        }
      } catch {
        // Ignore malformed URLs.
      }
    });

  if (typeof performance !== "undefined" && performance.getEntriesByType) {
    const entries = performance.getEntriesByType(
      "resource"
    ) as PerformanceResourceTiming[];
    for (const entry of entries) {
      try {
        const parsed = new URL(entry.name, origin);
        if (
          parsed.origin === origin &&
          (parsed.pathname.startsWith("/_next/static/") ||
            parsed.pathname.startsWith("/icons/"))
        ) {
          urls.add(parsed.pathname + parsed.search);
        }
      } catch {
        // Ignore malformed resource names.
      }
    }
  }

  return Array.from(urls);
}

async function sendPrecacheMessage(
  worker: ServiceWorker,
  urls: string[]
): Promise<{ routeCached: boolean }> {
  return new Promise((resolve) => {
    const channel = new MessageChannel();
    const timeout = window.setTimeout(() => {
      resolve({ routeCached: false });
    }, 8000);

    channel.port1.onmessage = (event) => {
      window.clearTimeout(timeout);
      resolve({
        routeCached: Boolean(event.data?.routeCached),
      });
    };

    worker.postMessage({ type: "PRECACHE_URLS", urls }, [channel.port2]);
  });
}

export function OfflineServiceWorker() {
  const isOnline = useSyncExternalStore(
    subscribeOnlineStatus,
    getOnlineSnapshot,
    getServerOnlineSnapshot
  );

  const [cacheState, setCacheState] = useState<OfflineCacheState>("caching");
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const standaloneQuery = window.matchMedia("(display-mode: standalone)");
    const isAppleStandalone =
      (window.navigator as unknown as { standalone?: boolean }).standalone ===
      true;

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      if (!standaloneQuery.matches && !isAppleStandalone) {
        setDeferredPrompt(event as BeforeInstallPromptEvent);
      }
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    let cancelled = false;

    async function registerAndVerifyCache() {
      if (!("serviceWorker" in navigator) || !("caches" in window)) {
        if (!cancelled) setCacheState("unsupported");
        return;
      }

      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        });
        void registration.update();
        await navigator.serviceWorker.ready;

        const activeWorker =
          registration.active ||
          navigator.serviceWorker.controller ||
          registration.waiting ||
          registration.installing;

        if (!activeWorker) {
          if (!cancelled) setCacheState("error");
          return;
        }

        const urlsToCache = collectCurrentPageStaticAssets();
        const result = await sendPrecacheMessage(activeWorker, urlsToCache);

        const cachedRoute = await caches.match("/utilities/image-resizer");
        if (!cancelled) {
          if (result.routeCached || cachedRoute) {
            setCacheState("ready");
          } else {
            setCacheState("error");
          }
        }
      } catch {
        if (!cancelled) setCacheState("error");
      }
    }

    void registerAndVerifyCache();

    return () => {
      cancelled = true;
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstalled(true);
      setDeferredPrompt(null);
    }
  };

  let statusLabel = "Caching for offline use...";
  if (cacheState === "ready") {
    statusLabel = isOnline
      ? "Offline ready"
      : "Offline mode · Using cached app";
  } else if (cacheState === "unsupported") {
    statusLabel = isOnline ? "Browser-local" : "Offline";
  } else if (cacheState === "error") {
    statusLabel = isOnline ? "Local processing" : "Offline mode";
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-[#4A555C]"
    >
      <span className="font-medium text-[#5C7E8F]">{statusLabel}</span>
      {!isInstalled && deferredPrompt ? (
        <button
          type="button"
          onClick={handleInstall}
          className="inline-flex items-center rounded-md border border-[#D4DDE2] bg-white px-2.5 py-1 text-xs font-medium text-[#20272B] whitespace-nowrap shrink-0 transition-colors duration-150 hover:border-[#5C7E8F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5C7E8F]"
        >
          Install app
        </button>
      ) : null}
    </div>
  );
}
