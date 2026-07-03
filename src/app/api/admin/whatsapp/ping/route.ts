import { NextResponse } from "next/server";
import { connect } from "@/lib/whatsapp";
import { prisma } from "@/lib/prisma";
import type { Campus } from "@/types";

export async function GET() {
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
