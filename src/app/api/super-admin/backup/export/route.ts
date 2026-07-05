import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user || user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Export all non-auth system data (skip Better Auth internal tables)
    const [
      users,
      courses,
      feeStructures,
      campusSettings,
      students,
      applications,
      admissionPdfTemplates,
      reportingPeriods,
      systemSettings,
      whatsAppSessions,
      notificationJobs,
    ] = await Promise.all([
      prisma.user.findMany({ select: { id: true, name: true, email: true, role: true, campus: true, createdAt: true } }),
      prisma.course.findMany(),
      prisma.feeStructure.findMany(),
      prisma.campusSetting.findMany(),
      prisma.student.findMany(),
      prisma.application.findMany(),
      prisma.admissionPdfTemplate.findMany({ select: { id: true, name: true, mimeType: true, createdAt: true, updatedAt: true } }),
      prisma.reportingPeriod.findMany(),
      prisma.systemSetting.findMany(),
      prisma.whatsAppSession.findMany({ select: { id: true, campus: true, phoneNumber: true, status: true, lastActive: true, createdAt: true, updatedAt: true } }),
      prisma.notificationJob.findMany(),
    ]);

    const backup = {
      version: 1,
      exportedAt: new Date().toISOString(),
      data: {
        users,
        courses,
        feeStructures,
        campusSettings,
        students,
        applications,
        admissionPdfTemplates,
        reportingPeriods,
        systemSettings,
        whatsAppSessions,
        notificationJobs,
      },
    };

    return new NextResponse(JSON.stringify(backup, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="eavi-backup-${new Date().toISOString().split("T")[0]}.json"`,
      },
    });
  } catch (e) {
    console.error("Backup export failed:", e);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
