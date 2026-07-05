import { createServer } from "http";
import { parse } from "url";
import next from "next";

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

  // ─── Notification queue ───
  try {
    await fetch(`http://localhost:${port}/api/admin/notification-queue/start`, { method: "POST" });
    console.log("[Queue] Notification processor started");
  } catch (e) {
    console.error("[Queue] Start error:", e.message);
  }

  // ─── Reporting-date reminders ───
  // Checks every 6 hours whether any ReportingPeriod starts in exactly
  // 4 days; runReportingReminders() itself dedupes so this is safe to
  // call repeatedly.
  const runReminders = async () => {
    try {
      const res = await fetch(`http://localhost:${port}/api/admin/reporting-reminders/run`, {
        method: "POST",
        headers: { "x-internal-cron-secret": process.env.INTERNAL_CRON_SECRET || "" },
      });
      const data = await res.json();
      if (data?.data?.remindersSent) {
        console.log(`[Reminders] Sent ${data.data.remindersSent} reporting-date reminder(s)`);
      }
    } catch (e) {
      console.error("[Reminders] Run error:", e.message);
    }
  };
  setInterval(runReminders, 6 * 60 * 60 * 1000); // every 6h
  runReminders(); // fire once on boot
  console.log("[Reminders] Reporting-date reminder scheduler started (every 6h)");
});
