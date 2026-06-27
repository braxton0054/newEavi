import { Client, LocalAuth } from "whatsapp-web.js";
import * as QR from "qrcode";
import * as fs from "fs";
import * as path from "path";

const clients = new Map<string, { client: Client; qr: string | null; ready: boolean }>();

function getAuthPath(campus: string) {
  return path.join(process.cwd(), ".wwebjs_auth", `session-${campus}`);
}

export async function getStatus(campus: string) {
  const entry = clients.get(campus);
  return {
    connected: entry?.ready || false,
    hasQr: !!entry?.qr,
    qr: entry?.qr || null,
  };
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
