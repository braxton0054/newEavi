import {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  BaileysEventMap,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import pino from "pino";
import { prisma } from "@/lib/prisma";
import { encrypt, decrypt } from "@/lib/encryption";

const logger = pino({ level: "warn" });
const RECONNECT_DELAY = 5000;

// ─── State ───

interface WaEntry {
  sock: any;
  ready: boolean;
  campus: string;
}

const sockets = new Map<string, WaEntry>();
let reconnectTimers = new Map<string, ReturnType<typeof setTimeout>>();

// ─── Phone normalization ───

function normalizePhone(phone: string): string {
  let p = phone.replace(/[^0-9]/g, "");
  if (p.length === 10 && p.startsWith("0")) p = "254" + p.slice(1);
  else if (p.length === 9) p = "254" + p;
  return p.split("@")[0];
}

function toJid(phone: string): string {
  const n = normalizePhone(phone);
  return n.endsWith("@s.whatsapp.net") ? n : `${n}@s.whatsapp.net`;
}

// ─── Session persistence ───

async function persistSession(campus: string) {
  const entry = sockets.get(campus);
  if (!entry || !entry.sock?.authState) return;

  const { creds, keys } = entry.sock.authState;
  const data = JSON.stringify({ creds, keys });
  const encrypted = encrypt(data);

  const existing = await prisma.whatsAppSession.findUnique({ where: { campus: campus as any } });
  if (existing) {
    await prisma.whatsAppSession.update({
      where: { id: existing.id },
      data: { sessionData: encrypted, status: entry.ready ? "connected" : "disconnected", lastActive: new Date() },
    });
  } else {
    await prisma.whatsAppSession.create({
      data: { campus: campus as any, sessionData: encrypted, status: entry.ready ? "connected" : "disconnected" },
    });
  }
}

async function restoreSession(campus: string): Promise<{ creds?: any; keys?: any } | null> {
  const session = await prisma.whatsAppSession.findUnique({ where: { campus: campus as any } });
  if (!session?.sessionData) return null;
  try {
    const data = JSON.parse(decrypt(session.sessionData));
    return data;
  } catch {
    return null;
  }
}

// ─── Connect ───

async function doConnect(campus: string) {
  // Clean up existing
  const existing = sockets.get(campus);
  if (existing?.sock) {
    try { existing.sock.end(new Error("Reconnect")); } catch {}
  }
  const existingTimer = reconnectTimers.get(campus);
  if (existingTimer) { clearTimeout(existingTimer); reconnectTimers.delete(campus); }

  const entry: WaEntry = { sock: null, ready: false, campus };
  sockets.set(campus, entry);

  try {
    const saved = await restoreSession(campus);

    const auth: any = saved
      ? { creds: saved.creds, keys: saved.keys }
      : {};

    const { state, saveCreds } = await useMultiFileAuthState(`baileys_auth_${campus}`);

    // Merge saved creds if we have them
    if (saved?.creds) state.creds = saved.creds;
    if (saved?.keys) state.keys = saved.keys;

    const sock = makeWASocket({
      auth,
      logger,
      printQRInTerminal: false,
      syncFullHistory: false,
      markOnlineOnConnect: true,
      shouldSyncHistoryMessage: () => false,
    });

    entry.sock = sock;

    sock.ev.on("creds.update", async () => {
      await saveCreds();
      await persistSession(campus);
    });

    sock.ev.on("connection.update", async (update: any) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        // Store QR in DB for admin to scan
        await prisma.whatsAppSession.upsert({
          where: { campus: campus as any },
          create: { campus: campus as any, qrCode: qr, status: "waiting_qr" },
          update: { qrCode: qr, status: "waiting_qr" },
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
        console.log(`[WA] READY for ${campus}`);
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
        } else {
          // Auto-reconnect
          const timer = setTimeout(() => doConnect(campus).catch(() => {}), RECONNECT_DELAY);
          reconnectTimers.set(campus, timer);
        }
      }
    });

  } catch (err: any) {
    console.error(`[WA] Connect error for ${campus}:`, err.message);
  }
}

// ─── Public API (same interface as before) ───

export function getClient(campus: string): any {
  const entry = sockets.get(campus);
  return entry?.ready ? entry.sock : null;
}

export async function getStatus(campus: string) {
  const entry = sockets.get(campus);
  const dbSession = await prisma.whatsAppSession.findUnique({ where: { campus: campus as any } });
  return {
    connected: entry?.ready || false,
    hasQr: !!dbSession?.qrCode,
    qr: dbSession?.qrCode || null,
    status: dbSession?.status || "disconnected",
  };
}

export async function checkNumber(campus: string, phone: string): Promise<boolean> {
  const sock = getClient(campus);
  if (!sock) return false;

  try {
    const n = normalizePhone(phone);
    const result = await sock.onWhatsApp(n);
    return !!result && result.length > 0 && result[0].exists;
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
  const sock = getClient(campus);
  if (!sock) return false;

  try {
    const jid = toJid(phone);
    await sock.sendMessage(jid, {
      document: pdfBuffer,
      mimetype: "application/pdf",
      fileName: filename,
      caption,
    });
    return true;
  } catch (err) {
    console.error(`[WA] Send error for ${campus}:`, err);
    return false;
  }
}

export async function sendText(
  campus: string,
  phone: string,
  message: string
): Promise<boolean> {
  const sock = getClient(campus);
  if (!sock) return false;

  try {
    const jid = toJid(phone);
    await sock.sendMessage(jid, { text: message });
    return true;
  } catch (err) {
    console.error(`[WA] Send error for ${campus}:`, err);
    return false;
  }
}

export async function connect(campus: string) {
  await doConnect(campus);
}

export async function disconnect(campus: string) {
  const timer = reconnectTimers.get(campus);
  if (timer) { clearTimeout(timer); reconnectTimers.delete(campus); }
  const entry = sockets.get(campus);
  if (entry?.sock) {
    try { entry.sock.end(new Error("Manual disconnect")); } catch {}
  }
  sockets.delete(campus);
  await prisma.whatsAppSession.upsert({
    where: { campus: campus as any },
    create: { campus: campus as any, status: "disconnected" },
    update: { status: "disconnected", qrCode: null },
  });
}

// ─── Initialize all campuses ───

export async function ensureReady(): Promise<void> {
  if (sockets.size > 0) return;

  // Connect all campuses that have sessions in DB
  const sessions = await prisma.whatsAppSession.findMany({
    where: { sessionData: { not: null } },
  });

  for (const session of sessions) {
    console.log(`[WA] Restoring session for ${session.campus}...`);
    await doConnect(session.campus as any);
  }
}
