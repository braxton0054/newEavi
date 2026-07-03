import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  // Service worker source
  swSrc: "sw.ts",
  swDest: "public/sw.js",
  // Only register in production
  disable: process.env.NODE_ENV === "development",
  // Don't cache API routes in precache
  exclude: [
    /\/api\//,
    /\/_next\/data\//,
  ],
  // Don't reload page on SW update — just activate
  reloadOnOnline: false,
});

const nextConfig: NextConfig = withSerwist({
  serverExternalPackages: ["bufferutil", "utf-8-validate", "@whiskeysockets/baileys"],
});

export default nextConfig;
