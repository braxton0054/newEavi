import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { ensureReady } from "./src/lib/whatsapp";

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0";
const port = parseInt(process.env.PORT || "4000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  // Start WhatsApp daemon in the same process
  console.log("[WA] Initializing WhatsApp daemon...");
  ensureReady().catch(err => console.error("[WA] ensureReady error:", err));

  createServer((req, res) => {
    const parsedUrl = parse(req.url || "/", true);
    handle(req, res, parsedUrl);
  }).listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
