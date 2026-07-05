import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user || user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

    const text = await file.text();
    let backup: any;
    try {
      backup = JSON.parse(text);
    } catch {
      return NextResponse.json({ error: "Invalid JSON file" }, { status: 400 });
    }

    if (!backup.version || !backup.data) {
      return NextResponse.json({ error: "Invalid backup format" }, { status: 400 });
    }

    const { data } = backup;
    let imported = 0;

    // Import in dependency order
    if (Array.isArray(data.feeStructures) && data.feeStructures.length > 0) {
      for (const fs of data.feeStructures) {
        await prisma.feeStructure.upsert({
          where: { id: fs.id },
          create: fs,
          update: fs,
        });
        imported++;
      }
    }

    if (Array.isArray(data.courses) && data.courses.length > 0) {
      for (const c of data.courses) {
        await prisma.course.upsert({
          where: { id: c.id },
          create: c,
          update: c,
        });
        imported++;
      }
    }

    if (Array.isArray(data.campusSettings) && data.campusSettings.length > 0) {
      for (const cs of data.campusSettings) {
        await prisma.campusSetting.upsert({
          where: { id: cs.id },
          create: cs,
          update: cs,
        });
        imported++;
      }
    }

    if (Array.isArray(data.students) && data.students.length > 0) {
      for (const s of data.students) {
        await prisma.student.upsert({
          where: { id: s.id },
          create: s,
          update: s,
        });
        imported++;
      }
    }

    if (Array.isArray(data.applications) && data.applications.length > 0) {
      for (const a of data.applications) {
        await prisma.application.upsert({
          where: { id: a.id },
          create: a,
          update: a,
        });
        imported++;
      }
    }

    if (Array.isArray(data.admissionPdfTemplates) && data.admissionPdfTemplates.length > 0) {
      for (const t of data.admissionPdfTemplates) {
        await prisma.admissionPdfTemplate.upsert({
          where: { id: t.id },
          create: t,
          update: t,
        });
        imported++;
      }
    }

    if (Array.isArray(data.reportingPeriods) && data.reportingPeriods.length > 0) {
      for (const rp of data.reportingPeriods) {
        await prisma.reportingPeriod.upsert({
          where: { id: rp.id },
          create: rp,
          update: rp,
        });
        imported++;
      }
    }

    if (Array.isArray(data.systemSettings) && data.systemSettings.length > 0) {
      for (const ss of data.systemSettings) {
        await prisma.systemSetting.upsert({
          where: { id: ss.id },
          create: ss,
          update: ss,
        });
        imported++;
      }
    }

    if (Array.isArray(data.whatsAppSessions) && data.whatsAppSessions.length > 0) {
      for (const ws of data.whatsAppSessions) {
        await prisma.whatsAppSession.upsert({
          where: { id: ws.id },
          create: ws,
          update: ws,
        });
        imported++;
      }
    }

    if (Array.isArray(data.notificationJobs) && data.notificationJobs.length > 0) {
      for (const nj of data.notificationJobs) {
        await prisma.notificationJob.upsert({
          where: { id: nj.id },
          create: nj,
          update: nj,
        });
        imported++;
      }
    }

    // Import users last (has foreign key dependencies from other tables)
    if (Array.isArray(data.users) && data.users.length > 0) {
      for (const u of data.users) {
        await prisma.user.upsert({
          where: { id: u.id },
          create: u,
          update: u,
        });
        imported++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Imported ${imported} records successfully`,
      imported,
    });
  } catch (e) {
    console.error("Backup import failed:", e);
    return NextResponse.json({ error: "Import failed: " + (e instanceof Error ? e.message : String(e)) }, { status: 500 });
  }
}
