import { installSerwist } from "@serwist/sw";
import { defaultCache } from "@serwist/next/worker";
import { NetworkOnly } from "serwist";

// Override API caching: all /api/* routes should be network-only
// (no cached auth tokens or stale admin data)
const cacheRules = defaultCache.map((entry) => {
  if (
    (entry.matcher instanceof RegExp && String(entry.matcher).includes("/api/")) ||
    (typeof entry.matcher === "function" && entry.matcher.toString().includes("/api/"))
  ) {
    return { ...entry, handler: new NetworkOnly({ networkTimeoutSeconds: 10 }) };
  }
  return entry;
});

// __SW_MANIFEST is injected by serwist at build time — ts-ignore the type error
// @ts-ignore
const precacheEntries = self.__SW_MANIFEST;

installSerwist({
  precacheEntries,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: cacheRules,
});

// Force-clear all runtime caches on activation so stale JS doesn't linger after rebuilds
// @ts-ignore — ExtendableEvent is available in SW context at runtime
self.addEventListener("activate", (event: any) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      // Delete every cache EXCEPT the precache one (Serwist manages that)
      const precacheName = cacheNames.find((n) => n.includes("precache"));
      await Promise.all(
        cacheNames
          .filter((n) => n !== precacheName)
          .map((n) => caches.delete(n))
      );
    })()
  );
});
