import { prisma } from "./prisma";

export async function audit(params: {
  userId: string;
  email: string;
  role: string;
  campus?: string | null;
  action: string;
  target: string;
  detail?: string | null;
}) {
  try {
    await prisma.auditLog.create({ data: params });
  } catch (e) {
    console.error("Audit log failed:", e);
  }
}
