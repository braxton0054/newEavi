import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { runReportingReminders } from "@/lib/reporting-reminders";
export const dynamic = "force-dynamic";

// Called two ways:
// 1. Internally by server.mjs on a schedule, authenticated via a shared secret
//    header (no user session exists in that context).
// 2. Manually by a logged-in SUPER_ADMIN clicking "run now" in settings.
async function isAuthorized(req: NextRequest): Promise<boolean> {
  const internalSecret = req.headers.get("x-internal-cron-secret");
  if (internalSecret && process.env.INTERNAL_CRON_SECRET && internalSecret === process.env.INTERNAL_CRON_SECRET) {
    return true;
  }

  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return false;

  const { prisma } = await import("@/lib/prisma");
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  return user?.role === "SUPER_ADMIN";
}

export async function POST(req: NextRequest) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const summary = await runReportingReminders();
    console.log(
      `[Reminders] Checked ${summary.periodsChecked} period(s), sent ${summary.remindersSent} reminder(s)`
    );
    return NextResponse.json({ data: summary }, { status: 200 });
  } catch (error: any) {
    console.error("[Reminders] Run error:", error?.message || error);
    return NextResponse.json({ error: "Failed to run reminders" }, { status: 500 });
  }
}
