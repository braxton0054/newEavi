import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
export const dynamic = "force-dynamic";

let started = false;

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (started) return NextResponse.json({ started: true });

  try {
    const { startQueueProcessor } = await import("@/lib/notification-queue");
    startQueueProcessor();
    started = true;
    return NextResponse.json({ started: true });
  } catch (error: any) {
    console.error("[Queue] Start error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
