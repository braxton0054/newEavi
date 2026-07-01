/**
 * WhatsApp Daemon — runs as a persistent background process alongside Next.js.
 * Handles Baileys WebSocket connections for all campuses.
 * Communicates with Next.js via the database (WhatsAppSession table).
 */
import { makeWASocket, DisconnectReason, initAuthCreds, makeCacheableSignalKeyStore, BufferJSON } from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import QRCode from "qrcode";
import pino from "pino";
import { PrismaClient } from "@prisma/client";

const logger = pino({ level: "warn" });

const prisma = new PrismaClient();
const RECONNECT_DELAY = 5000;

interface WaEntry {
  sock: any;
  ready: boolean;
  campus: string;
  keyStore: any;
}

const sockets = new Map<string, WaEntry>();
const reconnectTimers = new Map<string, ReturnType<typeof setTimeout>>();

function log(campus: string, msg: string) {
  console.log(`[WA:${campus}] ${msg}`);
}

async function persistSession(campus: string) {
  const entry = sockets.get(campus);
  if (!entry || !entry.sock?.authState) return;
  const { creds } = entry.sock.authState;
  const keys = entry.keyStore;
  if (!creds || !keys) return;
  const data = JSON.stringify({ creds, keys }, BufferJSON.replacer);

  const existing = await prisma.whatsAppSession.findUnique({ where: { campus: campus as any } });
  if (existing) {
    await prisma.whatsAppSession.update({
      where: { id: existing.id },
      data: { sessionData: data, status: entry.ready ? "connected" : "disconnected", lastActive: new Date() },
    });
  } else {
    await prisma.whatsAppSession.create({
      data: { campus: campus as any, sessionData: data, status: entry.ready ? "connected" : "disconnected" },
    });
  }
}

async function doConnect(campus: string) {
  const existing = sockets.get(campus);
  if (existing?.sock) {
    try { existing.sock.end(new Error("Reconnect")); } catch {}
  }
  const timer = reconnectTimers.get(campus);
  if (timer) { clearTimeout(timer); reconnectTimers.delete(campus); }

  const entry: WaEntry = { sock: null, ready: false, campus, keyStore: null as any };
  sockets.set(campus, entry);

  try {
    // Restore from DB if exists
    const saved = await prisma.whatsAppSession.findUnique({ where: { campus: campus as any } });
    const savedSession = saved?.sessionData
      ? JSON.parse(saved.sessionData, BufferJSON.reviver)
      : null;

    // Build auth state: use saved session if available, otherwise fresh creds
    let authState: any;
    if (savedSession) {
      authState = { creds: savedSession.creds, keys: savedSession.keys };
    } else {
      const creds = initAuthCreds();
      authState = { creds, keys: {} };
    }

    const keyStore = makeCacheableSignalKeyStore(authState.keys, logger);
    entry.keyStore = keyStore;

    const sock = makeWASocket({
      printQRInTerminal: false,
      syncFullHistory: false,
      markOnlineOnConnect: true,
      shouldSyncHistoryMessage: () => false,
      auth: {
        creds: authState.creds,
        keys: keyStore,
      },
    });
    entry.sock = sock;

    sock.ev.on("creds.update", async () => {
      await persistSession(campus);
    });

    sock.ev.on("connection.update", async (update: any) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        log(campus, "QR generated, converting to data URL...");
        const qrDataUrl = await QRCode.toDataURL(qr, { width: 300, margin: 2 });
        await prisma.whatsAppSession.upsert({
          where: { campus: campus as any },
          create: { campus: campus as any, qrCode: qr, qrDataUrl, status: "waiting_qr" },
          update: { qrCode: qr, qrDataUrl, status: "waiting_qr" },
        });
      }

      if (connection === "open") {
        entry.ready = true;
        sockets.set(campus, entry);
        await prisma.whatsAppSession.upsert({
          where: { campus: campus as any },
          create: { campus: campus as any, status: "connected", qrCode: null },
          update: { status: "connected", qrCode: null, lastActive: new Date() },
        });
        log(campus, "CONNECTED ✓");
        await persistSession(campus);
      }

      if (connection === "close") {
        entry.ready = false;
        const isLoggedOut =
          lastDisconnect?.error instanceof Boom &&
          lastDisconnect.error.output.statusCode === DisconnectReason.loggedOut;

        if (isLoggedOut) {
          await prisma.whatsAppSession.upsert({
            where: { campus: campus as any },
            create: { campus: campus as any, status: "disconnected", sessionData: null },
            update: { status: "disconnected", sessionData: null, qrCode: null },
          });
          sockets.delete(campus);
          log(campus, "Logged out");
        } else {
          log(campus, `Connection closed, reconnecting in ${RECONNECT_DELAY / 1000}s...`);
          const t = setTimeout(() => doConnect(campus).catch(() => {}), RECONNECT_DELAY);
          reconnectTimers.set(campus, t);
        }
      }
    });

    log(campus, "Connecting...");
  } catch (err: any) {
    log(campus, `Connect error: ${err.message}`);
  }
}

async function main() {
  console.log("[WA] WhatsApp daemon starting...");

  // Connect all campuses
  const campuses = ["MAIN", "WEST"];
  for (const campus of campuses) {
    await doConnect(campus);
  }

  // Keep alive
  setInterval(async () => {
    for (const [campus, entry] of sockets) {
      if (!entry.ready) {
        log(campus, "Reconnecting stale connection...");
        await doConnect(campus);
      }
    }
  }, 60_000);

  console.log("[WA] WhatsApp daemon running. Press Ctrl+C to stop.");
}

main().catch(console.error);
