import {
  makeWASocket,
  DisconnectReason,
  initAuthCreds,
  makeCacheableSignalKeyStore,
  BufferJSON,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import pino from "pino";
import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";
import { encrypt, decrypt } from "@/lib/encryption";

const logger: any = pino({ level: "warn" });

const BASE_RECONNECT_DELAY = 5000;
const MAX_RECONNECT_DELAY = 30000;
const MAX_RECONNECT_ATTEMPTS = 10;
const AUTO_RECOVER_DELAY = 300_000; // 5 min before allowing auto-reconnect after connectionReplaced/maxAttempts

// ─── Helper — in-memory signal key store ───

function createSignalKeyStore(data: Record<string, any> = {}) {
  return {
    get: async (type: string, ids: string[]) => {
      const result: Record<string, any> = {};
      for (const id of ids) {
        const key = `${type}-${id}`;
        result[id] = key in data ? data[key] : null;
      }
      return result;
    },
    set: async (entries: any) => {
      for (const category of Object.keys(entries)) {
        for (const id of Object.keys(entries[category])) {
          const value = entries[category][id];
          const key = `${category}-${id}`;
          if (value != null) data[key] = value;
          else delete data[key];
        }
      }
    },
    delete: async (ids: string[]) => {
      for (const id of ids) delete data[id];
    },
  };
}

// ─── State ───

interface WaEntry {
  sock: any;
  ready: boolean;
  campus: string;
  keyData: Record<string, any>;
  reconnectAttempts: number;
  autoReconnectDisabled: boolean;
  disabledAt: number | null;
  gen: number; // generation counter to avoid stale socket handler races
}

const sockets = new Map<string, WaEntry>();
let reconnectTimers = new Map<string, ReturnType<typeof setTimeout>>();
let keepaliveTimer: ReturnType<typeof setInterval> | null = null;

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
  if (!creds) return;
  const data = JSON.stringify({ creds, keyData: entry.keyData }, BufferJSON.replacer);
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

async function restoreSession(campus: string): Promise<{ creds?: any; keyData?: any } | null> {
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
  const existing = sockets.get(campus);
  if (existing?.sock) {
    try { existing.sock.end(new Error("Reconnect")); } catch {}
  }
  const existingTimer = reconnectTimers.get(campus);
  if (existingTimer) { clearTimeout(existingTimer); reconnectTimers.delete(campus); }

  const keyData: Record<string, any> = {};
  const existingEntry = sockets.get(campus);
  const entry: WaEntry = {
    sock: null,
    ready: false,
    campus,
    keyData,
    reconnectAttempts: existingEntry?.reconnectAttempts ?? 0,
    autoReconnectDisabled: false,
    disabledAt: null,
    gen: (existingEntry?.gen ?? 0) + 1,
  };
  sockets.set(campus, entry);

  try {
    const saved = await restoreSession(campus);

    // Build keys store — use saved keyData if available to pre-populate
    let creds: any;
    if (saved) {
      creds = saved.creds;
      if (saved.keyData) Object.assign(keyData, saved.keyData);
    } else {
      creds = initAuthCreds();
    }

    const store = makeCacheableSignalKeyStore(createSignalKeyStore(keyData), logger);
    entry.keyData = keyData;

    const sock = makeWASocket({
      logger,
      syncFullHistory: false,
      shouldSyncHistoryMessage: () => true,
      auth: {
        creds,
        keys: store,
      },
    });

    entry.sock = sock;

    // Catch silent WebSocket death that Baileys doesn't report as close
    if ((sock as any).ws) {
      (sock as any).ws.on("close", () => {
        if (entry.gen !== sockets.get(campus)?.gen) return;
        if (entry.ready) {
          console.log(`[WA] WebSocket closed silently for ${campus}, reconnecting...`);
          entry.ready = false;
          doConnect(campus);
        }
      });
    }

    // Wait for QR or open — resolve within 30s
    const qrPromise = new Promise<string | null>((resolve) => {
      const timeout = setTimeout(async () => {
        console.log(`[WA] Timeout waiting for QR/open on ${campus}`);
        // Clean up stale waiting_qr status
        await prisma.whatsAppSession.upsert({
          where: { campus: campus as any },
          create: { campus: campus as any, status: "disconnected" },
          update: { status: "disconnected", qrCode: null },
        });
        resolve(null);
      }, 30000);

      sock.ev.on("creds.update", async () => {
        if (entry.gen !== sockets.get(campus)?.gen) return;
        await persistSession(campus);
      });

      sock.ev.on("connection.update", async (update: any) => {
        // Ignore stale events from older socket instances
        if (entry.gen !== sockets.get(campus)?.gen) return;
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
          entry.reconnectAttempts = 0;
          entry.autoReconnectDisabled = false;
          sockets.set(campus, entry);
          // Extract phone number from Baileys creds (e.g. "254712345678.0:1234@s.whatsapp.net")
          const meId: string = sock?.authState?.creds?.me?.id || "";
          const phoneNumber = meId ? meId.split(":")[0].split("@")[0] || null : null;
          await prisma.whatsAppSession.upsert({
            where: { campus: campus as any },
            create: { campus: campus as any, status: "connected", qrCode: null, phoneNumber },
            update: { status: "connected", qrCode: null, lastActive: new Date(), phoneNumber },
          });
          console.log(`[WA] READY for ${campus}${phoneNumber ? ` — ${phoneNumber}` : ""}`);
          await persistSession(campus);
          clearTimeout(timeout);
          resolve(null);
        }

        if (connection === "close") {
          entry.ready = false;
          clearTimeout(timeout);
          resolve(null);

          const isLoggedOut =
            lastDisconnect?.error instanceof Boom &&
            lastDisconnect.error.output.statusCode === DisconnectReason.loggedOut;

          if (isLoggedOut) {
            console.log(`[WA] ${campus} logged out — clearing session`);
            await prisma.whatsAppSession.upsert({
              where: { campus: campus as any },
              create: { campus: campus as any, status: "disconnected", sessionData: null },
              update: { status: "disconnected", sessionData: null, qrCode: null },
            });
            sockets.delete(campus);
            return;
          }

          const statusCode = lastDisconnect?.error instanceof Boom
            ? lastDisconnect.error.output.statusCode
            : undefined;

          // restartRequired — Baileys asks for a fresh connection (protocol upgrade etc)
          if (statusCode === DisconnectReason.restartRequired) {
            console.log(`[WA] ${campus} restart required — reconnecting immediately`);
            entry.reconnectAttempts = 0;
            await prisma.whatsAppSession.upsert({
              where: { campus: campus as any },
              create: { campus: campus as any, status: "reconnecting" },
              update: { status: "reconnecting" },
            });
            const timer = setTimeout(() => doConnect(campus).catch(() => {}), 1000);
            reconnectTimers.set(campus, timer);
            return;
          }

          // connectionReplaced — another process logged in with same creds
          if (statusCode === DisconnectReason.connectionReplaced) {
            console.log(`[WA] ${campus} connection REPLACED — will auto-retry after cooldown`);
            entry.autoReconnectDisabled = true;
            entry.disabledAt = Date.now();
            // Preserve session data so the next reconnect restores the session
            // instead of generating a fresh QR code.
            await prisma.whatsAppSession.upsert({
              where: { campus: campus as any },
              create: { campus: campus as any, status: "disconnected" },
              update: { status: "disconnected", qrCode: null },
            });
            return;
          }

          // Exponential backoff for generic errors
          entry.reconnectAttempts += 1;

          if (entry.reconnectAttempts > MAX_RECONNECT_ATTEMPTS) {
            console.log(`[WA] ${campus} exceeded ${MAX_RECONNECT_ATTEMPTS} reconnect attempts — will auto-retry after cooldown`);
            entry.autoReconnectDisabled = true;
            entry.disabledAt = Date.now();
            await prisma.whatsAppSession.upsert({
              where: { campus: campus as any },
              create: { campus: campus as any, status: "error" },
              update: { status: "error", qrCode: null },
            });
            return;
          }

          const delay = Math.min(
            BASE_RECONNECT_DELAY * Math.pow(2, entry.reconnectAttempts - 1),
            MAX_RECONNECT_DELAY
          );
          console.log(`[WA] ${campus} closed (reason: ${statusCode ?? "unknown"}), reconnecting in ${delay / 1000}s (attempt ${entry.reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);
          const timer = setTimeout(() => doConnect(campus).catch(() => {}), delay);
          reconnectTimers.set(campus, timer);
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

export async function getClient(campus: string): Promise<any> {
  const entry = sockets.get(campus);
  if (entry?.ready) return entry.sock;

  // Socket not ready or missing — try restoring from DB
  const dbSession = await prisma.whatsAppSession.findUnique({ where: { campus: campus as any } });
  if (dbSession?.sessionData) {
    console.log(`[WA] getClient: ${campus} socket missing, attempting restore...`);
    await doConnect(campus);
    const restored = sockets.get(campus);
    return restored?.ready ? restored.sock : null;
  }
  return null;
}

export async function getStatus(campus: string) {
  const dbSession = await prisma.whatsAppSession.findUnique({ where: { campus: campus as any } });
  const entry = sockets.get(campus);
  const connected = entry?.ready || false;
  const connecting = !!entry?.sock && !entry.ready;
  return {
    connected,
    connecting,
    hasQr: !!dbSession?.qrCode,
    qr: dbSession?.qrDataUrl || dbSession?.qrCode || null,
    status: connecting ? "connecting" : dbSession?.status || "disconnected",
    phoneNumber: dbSession?.phoneNumber || null,
  };
}

export async function checkNumber(campus: string, phone: string): Promise<boolean> {
  const sock = await getClient(campus);
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
  const sock = await getClient(campus);
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
  const sock = await getClient(campus);
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
  const entry = sockets.get(campus);
  if (entry) {
    entry.reconnectAttempts = 0;
    entry.autoReconnectDisabled = false;
    entry.disabledAt = null;
  }
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
    create: { campus: campus as any, status: "disconnected", sessionData: null, qrCode: null },
    update: { status: "disconnected", sessionData: null, qrCode: null, phoneNumber: null },
  });
}

// ─── Keepalive — checks every 60s, reconnects stale sockets ───

function startKeepalive() {
  if (keepaliveTimer) return;
  keepaliveTimer = setInterval(async () => {
    for (const [campus, entry] of sockets) {
      // Auto-recover after cooldown if disabled
      if (entry.autoReconnectDisabled) {
        if (entry.disabledAt && Date.now() - entry.disabledAt >= AUTO_RECOVER_DELAY) {
          console.log(`[WA] Keepalive: ${campus} cooldown passed, attempting auto-recovery...`);
          entry.autoReconnectDisabled = false;
          entry.disabledAt = null;
          entry.reconnectAttempts = 0;
          await doConnect(campus);
        }
        continue;
      }
      if (!entry.ready || !entry.sock?.ws) {
        console.log(`[WA] Keepalive: ${campus} stale, reconnecting...`);
        await doConnect(campus);
      }
    }
  }, 60_000);
}

// ─── Initialize all campuses ───

export async function ensureReady(): Promise<void> {
  const sessions = await prisma.whatsAppSession.findMany();
  const campuses = ["MAIN", "WEST"];

  for (const campus of campuses) {
    const existing = sockets.get(campus);
    if (existing?.sock) continue;

    const dbSession = sessions.find((s: any) => s.campus === campus);
    if (dbSession?.sessionData) {
      console.log(`[WA] Restoring session for ${campus}...`);
    } else {
      console.log(`[WA] Initializing new connection for ${campus}...`);
    }
    await doConnect(campus);
  }

  startKeepalive();
}
