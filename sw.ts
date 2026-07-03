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
