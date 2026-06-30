"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * WhatsApp Daemon — runs as a persistent background process alongside Next.js.
 * Handles Baileys WebSocket connections for all campuses.
 * Communicates with Next.js via the database (WhatsAppSession table).
 */
const baileys_1 = require("@whiskeysockets/baileys");
const boom_1 = require("@hapi/boom");
const qrcode_1 = __importDefault(require("qrcode"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const RECONNECT_DELAY = 5000;
const sockets = new Map();
const reconnectTimers = new Map();
function log(campus, msg) {
    console.log(`[WA:${campus}] ${msg}`);
}
async function persistSession(campus) {
    const entry = sockets.get(campus);
    if (!entry || !entry.sock?.authState)
        return;
    const { creds, keys } = entry.sock.authState;
    if (!creds || !keys)
        return;
    const data = JSON.stringify({ creds, keys });
    const existing = await prisma.whatsAppSession.findUnique({ where: { campus: campus } });
    if (existing) {
        await prisma.whatsAppSession.update({
            where: { id: existing.id },
            data: { sessionData: data, status: entry.ready ? "connected" : "disconnected", lastActive: new Date() },
        });
    }
    else {
        await prisma.whatsAppSession.create({
            data: { campus: campus, sessionData: data, status: entry.ready ? "connected" : "disconnected" },
        });
    }
}
async function doConnect(campus) {
    const existing = sockets.get(campus);
    if (existing?.sock) {
        try {
            existing.sock.end(new Error("Reconnect"));
        }
        catch { }
    }
    const timer = reconnectTimers.get(campus);
    if (timer) {
        clearTimeout(timer);
        reconnectTimers.delete(campus);
    }
    const entry = { sock: null, ready: false, campus };
    sockets.set(campus, entry);
    try {
        // Restore from DB if exists
        const saved = await prisma.whatsAppSession.findUnique({ where: { campus: campus } });
        const savedSession = saved?.sessionData
            ? JSON.parse(saved.sessionData)
            : null;
        // Build auth state: use saved session if available, otherwise fresh creds
        let authState;
        if (savedSession) {
            authState = { creds: savedSession.creds, keys: savedSession.keys };
        }
        else {
            // Fresh auth state for QR generation (Baileys v7 requires this)
            const creds = (0, baileys_1.initAuthCreds)();
            authState = { creds, keys: {} };
        }
        const sock = (0, baileys_1.makeWASocket)({
            printQRInTerminal: false,
            syncFullHistory: false,
            markOnlineOnConnect: true,
            shouldSyncHistoryMessage: () => false,
            auth: authState,
        });
        entry.sock = sock;
        sock.ev.on("creds.update", async () => {
            await persistSession(campus);
        });
        sock.ev.on("connection.update", async (update) => {
            const { connection, lastDisconnect, qr } = update;
            if (qr) {
                log(campus, "QR generated, converting to data URL...");
                const qrDataUrl = await qrcode_1.default.toDataURL(qr, { width: 300, margin: 2 });
                await prisma.whatsAppSession.upsert({
                    where: { campus: campus },
                    create: { campus: campus, qrCode: qr, qrDataUrl, status: "waiting_qr" },
                    update: { qrCode: qr, qrDataUrl, status: "waiting_qr" },
                });
            }
            if (connection === "open") {
                entry.ready = true;
                sockets.set(campus, entry);
                await prisma.whatsAppSession.upsert({
                    where: { campus: campus },
                    create: { campus: campus, status: "connected", qrCode: null },
                    update: { status: "connected", qrCode: null, lastActive: new Date() },
                });
                log(campus, "CONNECTED ✓");
                await persistSession(campus);
            }
            if (connection === "close") {
                entry.ready = false;
                const isLoggedOut = lastDisconnect?.error instanceof boom_1.Boom &&
                    lastDisconnect.error.output.statusCode === baileys_1.DisconnectReason.loggedOut;
                if (isLoggedOut) {
                    await prisma.whatsAppSession.upsert({
                        where: { campus: campus },
                        create: { campus: campus, status: "disconnected", sessionData: null },
                        update: { status: "disconnected", sessionData: null, qrCode: null },
                    });
                    sockets.delete(campus);
                    log(campus, "Logged out");
                }
                else {
                    log(campus, `Connection closed, reconnecting in ${RECONNECT_DELAY / 1000}s...`);
                    const t = setTimeout(() => doConnect(campus).catch(() => { }), RECONNECT_DELAY);
                    reconnectTimers.set(campus, t);
                }
            }
        });
        log(campus, "Connecting...");
    }
    catch (err) {
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
    }, 60000);
    console.log("[WA] WhatsApp daemon running. Press Ctrl+C to stop.");
}
main().catch(console.error);
