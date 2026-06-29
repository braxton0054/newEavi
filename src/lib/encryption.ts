import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";

const KEY = crypto
  .createHash("sha256")
  .update(process.env.ENCRYPTION_KEY || "eavi-default-key-change-me")
  .digest();

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  let enc = cipher.update(text, "utf8", "hex");
  enc += cipher.final("hex");
  const tag = cipher.getAuthTag().toString("hex");
  return `enc:${iv.toString("hex")}:${tag}:${enc}`;
}

export function decrypt(encoded: string): string {
  if (!encoded || !encoded.startsWith("enc:")) return encoded;
  const parts = encoded.slice(4).split(":");
  if (parts.length !== 3) return encoded;
  const [ivHex, tagHex, data] = parts;
  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(tag);
  let dec = decipher.update(data, "hex", "utf8");
  dec += decipher.final("utf8");
  return dec;
}
