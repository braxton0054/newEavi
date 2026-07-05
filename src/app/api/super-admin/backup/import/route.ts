import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { audit } from "@/lib/audit";
export const dynamic = "force-dynamic";

function deserializeRecord(record: any): any {
  if (!record || typeof record !== "object") return record;
  const result: any = {};
  for (const [k, v] of Object.entries(record)) {
    // Base64 strings → Buffer for Prisma Bytes fields
    if (typeof v === "string" && (
      k === "pdfData" || k === "bursaryFormPdf" || k === "sessionData"
    )) {
      result[k] = Buffer.from(v, "base64");
    } else {
      result[k] = v;
    }
  }
  return result;
}

async function upsertMany(model: any, records: any[]) {
  let count = 0;
  for (const raw of records) {
    const record = deserializeRecord(raw);
    await model.upsert({
      where: { id: record.id },
      create: record,
      update: record,
    });
    count++;
  }
  return count;
}

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

    // Import in dependency order (children before parents)

    // FeeStructures (no dependencies)
    if (Array.isArray(data.feeStructures)) {
      imported += await upsertMany(prisma.feeStructure, data.feeStructures);
    }

    // Courses (depends on FeeStructure via feeStructureId)
    if (Array.isArray(data.courses)) {
      imported += await upsertMany(prisma.course, data.courses);
    }

    // CampusSettings (no dependencies) — includes bursaryFormPdf binary
    if (Array.isArray(data.campusSettings)) {
      imported += await upsertMany(prisma.campusSetting, data.campusSettings);
    }

    // Students (no dependencies)
    if (Array.isArray(data.students)) {
      imported += await upsertMany(prisma.student, data.students);
    }

    // Applications (depends on Student, User via reviewedBy)
    if (Array.isArray(data.applications)) {
      imported += await upsertMany(prisma.application, data.applications);
    }

    // AdmissionPdfTemplates (no dependencies) — includes pdfData binary
    if (Array.isArray(data.admissionPdfTemplates)) {
      imported += await upsertMany(prisma.admissionPdfTemplate, data.admissionPdfTemplates);
    }

    // ReportingPeriods (no dependencies)
    if (Array.isArray(data.reportingPeriods)) {
      imported += await upsertMany(prisma.reportingPeriod, data.reportingPeriods);
    }

    // SystemSettings (no dependencies)
    if (Array.isArray(data.systemSettings)) {
      imported += await upsertMany(prisma.systemSetting, data.systemSettings);
    }

    // WhatsAppSessions (no dependencies) — includes sessionData binary
    if (Array.isArray(data.whatsAppSessions)) {
      imported += await upsertMany(prisma.whatsAppSession, data.whatsAppSessions);
    }

    // NotificationJobs (no dependencies)
    if (Array.isArray(data.notificationJobs)) {
      imported += await upsertMany(prisma.notificationJob, data.notificationJobs);
    }

    // LoginLogs (no dependencies)
    if (Array.isArray(data.loginLogs)) {
      imported += await upsertMany(prisma.loginLog, data.loginLogs);
    }

    // Users last (depended on by Applications and Sessions)
    if (Array.isArray(data.users)) {
      imported += await upsertMany(prisma.user, data.users);
    }

    audit({
      userId: user.id,
      email: user.email,
      role: user.role,
      campus: null,
      action: "backup.import",
      target: file.name,
      detail: JSON.stringify({ imported }),
    });

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
