// One-time migration: encrypt existing plaintext credentials in the database
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const KEY_VERSION = 'v1';

const encryptionKey = process.env.ENCRYPTION_KEY;
if (!encryptionKey) {
  console.error('FATAL: ENCRYPTION_KEY env var is required');
  process.exit(1);
}

const PRIMARY_KEY = crypto.createHash('sha256').update(encryptionKey).digest();

function encrypt(text) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, PRIMARY_KEY, iv);
  let enc = cipher.update(text, 'utf8', 'hex');
  enc += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');
  return `${KEY_VERSION}:${iv.toString('hex')}:${tag}:${enc}`;
}

async function main() {
  const prisma = new PrismaClient();
  let encrypted = 0;

  const settings = await prisma.campusSetting.findMany();
  for (const s of settings) {
    const data = s.settings || {};
    let changed = false;

    if (data.smsApiKey && !data.smsApiKey.startsWith('v1:')) {
      data.smsApiKey = encrypt(data.smsApiKey);
      changed = true;
    }
    if (data.smsApiSecret && !data.smsApiSecret.startsWith('v1:')) {
      data.smsApiSecret = encrypt(data.smsApiSecret);
      changed = true;
    }
    if (data.appPassword && !data.appPassword.startsWith('v1:')) {
      data.appPassword = encrypt(data.appPassword);
      changed = true;
    }

    if (changed) {
      await prisma.campusSetting.update({
        where: { id: s.id },
        data: { settings: data },
      });
      console.log(`Encrypted credentials for ${s.campus}`);
      encrypted++;
    }
  }

  await prisma.$disconnect();
  console.log(`Done. Encrypted ${encrypted} campus settings records.`);
}

main().catch(e => {
  console.error('Migration failed:', e);
  process.exit(1);
});
