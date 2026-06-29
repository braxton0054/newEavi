import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Auto-approve endpoint — called by cron every minute.
 * Finds PENDING applications older than 5 minutes, approves them,
 * and triggers the notification system.
 */
export async function POST(req: NextRequest) {
  try {
    // Verify secret via Authorization header (not URL query param)
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    // Find pending applications older than 5 minutes
    const pendingApps = await prisma.application.findMany({
      where: {
        status: "PENDING",
        createdAt: { lte: fiveMinutesAgo },
      },
      include: { student: true },
    });

    const results: { id: string; student: string; notifications?: any }[] = [];

    for (const app of pendingApps) {
      // Auto-approve
      await prisma.application.update({
        where: { id: app.id },
        data: { status: "APPROVED" },
      });

      await prisma.student.update({
        where: { id: app.studentId },
        data: { status: "APPROVED" },
      });

      // Send notifications
      let notifyResult = null;
      try {
        const { sendApprovalNotifications } = await import("@/lib/auto-notify");
        notifyResult = await sendApprovalNotifications(app.studentId);
      } catch (err) {
        console.error(`Auto-approve notification error for ${app.studentId}:`, err);
        notifyResult = { error: (err as Error).message };
      }

      results.push({
        id: app.id,
        student: [app.student.firstName, app.student.lastName]
          .filter(Boolean)
          .join(" "),
        notifications: notifyResult,
      });
    }

    return NextResponse.json({
      approved: results.length,
      results,
    });
  } catch (error) {
    console.error("Auto-approve error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
