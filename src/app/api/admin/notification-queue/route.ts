import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: new Headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [pending, processing, completed, failed, recent] = await Promise.all([
      prisma.notificationJob.count({ where: { status: "PENDING" } }),
      prisma.notificationJob.count({ where: { status: "PROCESSING" } }),
      prisma.notificationJob.count({ where: { status: "COMPLETED" } }),
      prisma.notificationJob.count({ where: { status: "FAILED" } }),
      prisma.notificationJob.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

    const total = pending + processing + completed + failed;

    return NextResponse.json({
      pending,
      processing,
      completed,
      failed,
      total,
      recent,
    });
  } catch (error) {
    console.error("Queue stats error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
