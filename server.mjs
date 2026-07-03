import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { createRequire } from "module";

// Patch ws module before anything else loads
const _req = createRequire(import.meta.url);
_req("./patch-ws.js");

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0";
const port = parseInt(process.env.PORT || "4000", 10);

console.log("[WA] Initializing WhatsApp daemon...");
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(async () => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url || "/", true);
    handle(req, res, parsedUrl);
  }).listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });

  // ─── WhatsApp keepalive ───
  // Uses fetch to the ping endpoint instead of importing TS modules directly
  setInterval(async () => {
    try {
      const res = await fetch(`http://localhost:${port}/api/admin/whatsapp/ping`);
      const data = await res.json();
      if (data.results?.MAIN === "reconnecting" || data.results?.WEST === "reconnecting") {
        console.log("[WA] Keepalive: reconnected one or more campuses");
      }
    } catch (e) {
      console.error("[WA] Keepalive error:", e.message);
    }
  }, 30_000);
  console.log("[WA] Keepalive started (every 30s)");
});
