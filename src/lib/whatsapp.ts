import {
  makeWASocket,
  DisconnectReason,
  AuthenticationState,
  initAuthCreds,
  makeCacheableSignalKeyStore,
  BufferJSON,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import pino from "pino";
import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";
import { encrypt, decrypt } from "@/lib/encryption";

const logger = pino({ level: "warn" });
const RECONNECT_DELAY = 5000;

// ─── State ───

interface WaEntry {
  sock: any;
  ready: boolean;
  campus: string;
  keyStore: any;
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

  const { creds } = entry.sock.authState;
  const keys = entry.keyStore;
  if (!creds || !keys) return;
  const data = JSON.stringify({ creds, keys }, BufferJSON.replacer);
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
    const data = JSON.parse(decrypt(session.sessionData), BufferJSON.reviver);
    return data;
  } catch {
    return null;
  }
}

// ─── Connect ───

async function doConnect(campus: string): Promise<string | null> {
  // Clean up existing
  const existing = sockets.get(campus);
  if (existing?.sock) {
    try { existing.sock.end(new Error("Reconnect")); } catch {}
  }
  const existingTimer = reconnectTimers.get(campus);
  if (existingTimer) { clearTimeout(existingTimer); reconnectTimers.delete(campus); }

  const entry: WaEntry = { sock: null, ready: false, campus, keyStore: null as any };
  sockets.set(campus, entry);

  try {
    const saved = await restoreSession(campus);

    let authState: AuthenticationState;
    if (saved) {
      authState = { creds: saved.creds, keys: saved.keys };
    } else {
      const creds = initAuthCreds();
      authState = { creds, keys: {} as any };
    }

    const keyStore = makeCacheableSignalKeyStore(authState.keys, logger);
    entry.keyStore = keyStore;

    const sock = makeWASocket({
      logger,
      printQRInTerminal: true,
      syncFullHistory: false,
      markOnlineOnConnect: true,
      shouldSyncHistoryMessage: () => false,
      auth: {
        creds: authState.creds,
        keys: keyStore,
      },
    });

    entry.sock = sock;

    // Wait for QR or open — resolve within 30s
    const qrPromise = new Promise<string | null>((resolve) => {
      const timeout = setTimeout(() => {
        console.log(`[WA] Timeout waiting for QR/open on ${campus}`);
        resolve(null);
      }, 30000);

      sock.ev.on("creds.update", async () => {
        await persistSession(campus);
      });

      sock.ev.on("connection.update", async (update: any) => {
        console.log(`[WA] connection.update for ${campus}:`, update.connection, update.qr ? 'QR present' : 'no qr');
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          const qrDataUrl = await QRCode.toDataURL(qr, { width: 300, margin: 2 });
          await prisma.whatsAppSession.upsert({
            where: { campus: campus as any },
            create: { campus: campus as any, qrCode: qr, qrDataUrl: qrDataUrl, status: "waiting_qr" },
            update: { qrCode: qr, qrDataUrl: qrDataUrl, status: "waiting_qr" },
          });
          clearTimeout(timeout);
          resolve(qrDataUrl);
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
          clearTimeout(timeout);
          resolve(null);
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
            const timer = setTimeout(() => doConnect(campus).catch(() => {}), RECONNECT_DELAY);
            reconnectTimers.set(campus, timer);
          }
          clearTimeout(timeout);
          resolve(null);
        }
      });
    });

    return qrPromise;

  } catch (err: any) {
    console.error(`[WA] Connect error for ${campus}:`, err.message);
    return null;
  }
}

// ─── Public API ───

export function getClient(campus: string): any {
  const entry = sockets.get(campus);
  return entry?.ready ? entry.sock : null;
}

export async function getStatus(campus: string) {
  const dbSession = await prisma.whatsAppSession.findUnique({ where: { campus: campus as any } });
  const entry = sockets.get(campus);
  const connected = entry?.ready || false;
  return {
    connected,
    hasQr: !!dbSession?.qrCode,
    qr: dbSession?.qrDataUrl || dbSession?.qrCode || null,
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

export async function connect(campus: string): Promise<string | null> {
  return doConnect(campus);
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

  const sessions = await prisma.whatsAppSession.findMany();
  const campuses = ["MAIN", "WEST"];

  for (const campus of campuses) {
    const dbSession = sessions.find((s: any) => s.campus === campus);
    if (dbSession?.sessionData) {
      console.log(`[WA] Restoring session for ${campus}...`);
    } else {
      console.log(`[WA] Initializing new connection for ${campus}...`);
    }
    await doConnect(campus);
  }
}
