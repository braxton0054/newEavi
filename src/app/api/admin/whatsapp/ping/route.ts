import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/lib/whatsapp";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import type { Campus } from "@/types";

export async function GET(req: NextRequest) {
  // Allow either a cron-secret header (for external pingers) or an admin session
  const cronSecret = req.headers.get("x-cron-secret");
  const expectedSecret = process.env.CRON_SECRET;

  if (cronSecret && expectedSecret && cronSecret === expectedSecret) {
    // Authenticated via cron secret — proceed
  } else {
    // Fall back to session-based auth
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const campuses: Campus[] = ["MAIN", "WEST"];
  const results: Record<string, string> = {};

  for (const campus of campuses) {
    const dbSession = await prisma.whatsAppSession.findUnique({ where: { campus } });
    if (dbSession?.sessionData && dbSession.status !== "connected") {
      try {
        await connect(campus);
        results[campus] = "reconnecting";
      } catch {
        results[campus] = "reconnect_failed";
      }
    } else {
      results[campus] = dbSession?.status || "no_session";
    }
  }

  return NextResponse.json({ ok: true, results });
}
