import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";

let started = false;

export async function POST(req: NextRequest) {
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
