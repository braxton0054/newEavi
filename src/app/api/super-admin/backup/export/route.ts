import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
export const dynamic = "force-dynamic";

function serializeForJson(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (Buffer.isBuffer(obj)) return obj.toString("base64");
  if (Array.isArray(obj)) return obj.map(serializeForJson);
  if (typeof obj === "object") {
    const result: any = {};
    for (const [k, v] of Object.entries(obj)) {
      result[k] = serializeForJson(v);
    }
    return result;
  }
  return obj;
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user || user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

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
      loginLogs,
    ] = await Promise.all([
      prisma.user.findMany({ select: { id: true, name: true, email: true, role: true, campus: true, createdAt: true, updatedAt: true } }),
      prisma.course.findMany(),
      prisma.feeStructure.findMany(),
      prisma.campusSetting.findMany(),
      prisma.student.findMany(),
      prisma.application.findMany(),
      prisma.admissionPdfTemplate.findMany(),
      prisma.reportingPeriod.findMany(),
      prisma.systemSetting.findMany(),
      prisma.whatsAppSession.findMany(),
      prisma.notificationJob.findMany(),
      prisma.loginLog.findMany({ orderBy: { createdAt: "desc" } }),
    ]);

    const backup = {
      version: 2,
      exportedAt: new Date().toISOString(),
      data: {
        users,
        courses,
        feeStructures: serializeForJson(feeStructures),
        campusSettings: serializeForJson(campusSettings),
        students,
        applications,
        admissionPdfTemplates: serializeForJson(admissionPdfTemplates),
        reportingPeriods,
        systemSettings,
        whatsAppSessions: serializeForJson(whatsAppSessions),
        notificationJobs,
        loginLogs,
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
