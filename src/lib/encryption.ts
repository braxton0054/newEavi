import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_VERSION = "v1"; // bump this when rotating key to re-encrypt old data

if (!process.env.ENCRYPTION_KEY) {
  throw new Error("FATAL: ENCRYPTION_KEY env var is required");
}

/**
 * Key derivation: SHA-256 of ENCRYPTION_KEY → 32 bytes for AES-256.
 *
 * IMPORTANT: Do NOT change ENCRYPTION_KEY without re-encrypting existing data.
 * If you must rotate the key:
 *   1. Add the OLD key to ENCRYPTION_KEY_ROTATION below
 *   2. Bump KEY_VERSION
 *   3. Decrypt all old sessions with the old key, re-encrypt with new key
 *
 * The decrypt() function supports multiple keys via rotation fallback.
 */
function deriveKey(material: string): Buffer {
  return crypto.createHash("sha256").update(material).digest();
}

const PRIMARY_KEY = deriveKey(process.env.ENCRYPTION_KEY);

// Optional: put old keys here during rotation window
const ROTATION_KEYS: { version: string; key: Buffer }[] = [];
if (process.env.ENCRYPTION_KEY_ROTATION) {
  ROTATION_KEYS.push({
    version: "legacy",
    key: deriveKey(process.env.ENCRYPTION_KEY_ROTATION),
  });
}

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, PRIMARY_KEY, iv);
  let enc = cipher.update(text, "utf8", "hex");
  enc += cipher.final("hex");
  const tag = cipher.getAuthTag().toString("hex");
  return `${KEY_VERSION}:${iv.toString("hex")}:${tag}:${enc}`;
}

export function decrypt(encoded: string): string {
  if (!encoded || !encoded.startsWith("enc") && !encoded.startsWith("v1:")) {
    // Legacy format without version prefix — try primary key with old format
    return tryDecrypt(encoded, PRIMARY_KEY);
  }

  const versionEnd = encoded.indexOf(":");
  if (versionEnd === -1) return tryDecrypt(encoded, PRIMARY_KEY);

  const version = encoded.slice(0, versionEnd);
  const payload = encoded.slice(versionEnd + 1);

  // Try primary key first
  if (version === KEY_VERSION) {
    const result = tryDecrypt(payload, PRIMARY_KEY, false);
    if (result !== null) return result;
  }

  // Try rotation keys
  for (const rot of ROTATION_KEYS) {
    if (version === rot.version || version === "enc") {
      const result = tryDecrypt(payload, rot.key, false);
      if (result !== null) return result;
    }
  }

  // Final fallback: try old unversioned format with primary key
  return tryDecrypt(encoded, PRIMARY_KEY);
}

function tryDecrypt(
  data: string,
  key: Buffer,
  hasVersionPrefix: boolean = true
): string {
  try {
    const content = hasVersionPrefix ? data : data;
    const parts = content.split(":");
    if (parts.length !== 3) return "";
    const [ivHex, tagHex, hex] = parts;
    const iv = Buffer.from(ivHex, "hex");
    const tag = Buffer.from(tagHex, "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    let dec = decipher.update(hex, "hex", "utf8");
    dec += decipher.final("utf8");
    return dec;
  } catch {
    return "";
  }
}
