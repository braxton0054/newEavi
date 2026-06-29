import { Client, LocalAuth, MessageMedia } from "whatsapp-web.js";
import * as QR from "qrcode";
import * as fs from "fs";
import * as path from "path";

// Use process-level global so clients Map is shared across ALL module contexts
// (instrumentation, API routes, edge runtime — same Node.js process)
if (!(process as any).__eavi_wa_clients) {
  (process as any).__eavi_wa_clients = new Map<string, { client: Client; qr: string | null; ready: boolean }>();
}
const clients = (process as any).__eavi_wa_clients;

function getAuthPath(campus: string) {
  return path.join(process.cwd(), ".wwebjs_auth", `session-${campus}`);
}

/** Normalize phone to international format without + (whatsapp-web.js format) */
function normalizePhone(phone: string): string {
  const digits = phone.replace(/[^0-9]/g, "");
  // Kenyan local 0xxx → 254xxx
  if (digits.startsWith("0") && digits.length === 10) {
    return "254" + digits.slice(1);
  }
  return digits;
}

export function getClient(campus: string): Client | null {
  const entry = clients.get(campus);
  return entry?.ready ? entry.client : null;
}

export async function getStatus(campus: string) {
  const entry = clients.get(campus);
  return {
    connected: entry?.ready || false,
    hasQr: !!entry?.qr,
    qr: entry?.qr || null,
  };
}

export async function checkNumber(
  campus: string,
  phone: string
): Promise<boolean> {
  const client = getClient(campus);
  if (!client) return false;

  try {
    const cleaned = normalizePhone(phone);
    const result = await client.getNumberId(cleaned);
    return !!result;
  } catch {
    return false;
  }
}

export async function sendDocument(
  campus: string,
  phone: string,
  pdfBuffer: Buffer,
  filename: string,
  caption: string
): Promise<boolean> {
  const client = getClient(campus);
  if (!client) return false;

  try {
    const cleaned = normalizePhone(phone);
    const chatId = await client.getNumberId(cleaned);
    if (!chatId) return false;

    const media = new MessageMedia(
      "application/pdf",
      pdfBuffer.toString("base64"),
      filename
    );

    await client.sendMessage(chatId._serialized, media, {
      caption,
    });
    return true;
  } catch (err) {
    console.error(`WhatsApp send error for ${campus}:`, err);
    return false;
  }
}

export async function sendText(
  campus: string,
  phone: string,
  message: string
): Promise<boolean> {
  const client = getClient(campus);
  if (!client) return false;

  try {
    const cleaned = normalizePhone(phone);
    const chatId = await client.getNumberId(cleaned);
    if (!chatId) return false;

    await client.sendMessage(chatId._serialized, message);
    return true;
  } catch (err) {
    console.error(`WhatsApp send error for ${campus}:`, err);
    return false;
  }
}

export async function connect(campus: string): Promise<{ qr: string }> {
  const existing = clients.get(campus);
  if (existing?.client) {
    try { await existing.client.destroy(); } catch {}
    clients.delete(campus);
  }

  const puppeteerOptions: any = {
    headless: true,
    args: ["--no-sandbox", "--disable-gpu", "--disable-setuid-sandbox"],
  };

  const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
  if (executablePath) {
    puppeteerOptions.executablePath = executablePath;
  }

  const client = new Client({
    authStrategy: new LocalAuth({ clientId: campus }),
    puppeteer: puppeteerOptions,
  });

  const entry = { client, qr: null as string | null, ready: false };
  clients.set(campus, entry);

  const result = await new Promise<{ qr: string }>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("WhatsApp connection timed out"));
    }, 60000);

    client.on("qr", async (qrRaw: string) => {
      try {
        entry.qr = await QR.toDataURL(qrRaw);
      } catch (e) {
        console.error("QR generation error:", e);
        entry.qr = null;
      }
      if (!entry.ready) {
        clearTimeout(timeout);
        resolve({ qr: entry.qr || "" });
      }
    });

    client.on("ready", () => {
      entry.ready = true;
      entry.qr = null;
      clearTimeout(timeout);
      resolve({ qr: "" });
    });

    client.on("disconnected", (reason) => {
      console.error(`WhatsApp disconnected for ${campus}:`, reason);
      entry.ready = false;
      entry.qr = null;
      clients.delete(campus);
    });

    client.on("auth_failure", (msg) => {
      console.error(`WhatsApp auth failure for ${campus}:`, msg);
      entry.ready = false;
      entry.qr = null;
      clients.delete(campus);
    });

    client.initialize().catch((err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });

  return result;
}

export async function disconnect(campus: string) {
  const entry = clients.get(campus);
  if (entry?.client) {
    try { await entry.client.destroy(); } catch {}
  }
  clients.delete(campus);

  const authPath = getAuthPath(campus);
  try {
    fs.rmSync(authPath, { recursive: true, force: true });
  } catch {}
}

/**
 * Auto-restore sessions that have saved auth data on disk.
 * Call this once at server startup.
 */
export async function ensureReady(): Promise<void> {
  console.log(`[WA] ensureReady called, clients.size=${clients.size}`);
  // If we already have clients initialized in this context, skip
  if (clients.size > 0) return;

  const authBaseDir = path.join(process.cwd(), ".wwebjs_auth");
  if (!fs.existsSync(authBaseDir)) {
    console.log(`[WA] ensureReady: no auth dir found`);
    return;
  }
  console.log(`[WA] ensureReady: auth dir found, scanning sessions...`);

  const puppeteerOptions: any = {
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  };
  const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || "/usr/bin/google-chrome";
  puppeteerOptions.executablePath = executablePath;

  const dirs = fs.readdirSync(authBaseDir);
  for (const dir of dirs) {
    if (!dir.startsWith("session-")) continue;
    const campus = dir.replace("session-", "");
    if (clients.has(campus)) continue;

    const cookiesPath = path.join(authBaseDir, dir, "Default", "Cookies");
    if (!fs.existsSync(cookiesPath)) continue;

    try {
      const client = new Client({
        authStrategy: new LocalAuth({ clientId: campus }),
        puppeteer: puppeteerOptions,
      });

      const entry = { client, qr: null as string | null, ready: false };
      clients.set(campus, entry);

      client.on("ready", () => {
        entry.ready = true;
        console.log(`[WA] READY for ${campus}`);
      });

      client.on("disconnected", () => {
        entry.ready = false;
        clients.delete(campus);
      });

      client.on("auth_failure", () => {
        entry.ready = false;
        clients.delete(campus);
      });

      await client.initialize();
      // Wait briefly for event loop to fire ready event
      await new Promise((r) => setTimeout(r, 100));
    } catch (err: any) {
      const msg = err.message || String(err);
      // If browser is already running (e.g. another process started it),
      // poll for readiness instead of failing
      if (msg.includes("already running")) {
        console.log(`[WA] Browser already running for ${campus}, will retry later`);
        // Remove the failed entry — next ensureReady call will retry
        clients.delete(campus);
      } else {
        console.error(`[WA] Init failed for ${campus}: ${msg}`);
      }
    }
  }
}


