import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user || user.role === undefined) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const campus = searchParams.get("campus");

    const where = user.role === "ADMIN"
      ? { campus: user.campus! }
      : campus ? { campus: campus as "MAIN" | "WEST" } : {};

    const settings = await prisma.campusSetting.findMany({
      where,
      orderBy: { campus: "asc" },
    });

    const sanitized = (settings as any[]).map((s) => ({
      id: s.id,
      campus: s.campus,
      email: (s.settings as any)?.email || "",
      hasAppPassword: !!((s.settings as any)?.appPassword),
      smsBaseUrl: (s.settings as any)?.smsBaseUrl || "",
      hasSmsApiKey: !!((s.settings as any)?.smsApiKey),
      hasSmsApiSecret: !!((s.settings as any)?.smsApiSecret),
      smsEnabled: !!((s.settings as any)?.smsEnabled),
      admissionFormat: s.admissionFormat,
      admissionStart: s.admissionStart,
      reportingDates: s.reportingDates,
      hasBursaryForm: !!s.bursaryFormPdf,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    }));

    return NextResponse.json({ data: sanitized }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user || user.role === undefined) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { campus, email, appPassword, smsApiKey, smsApiSecret, smsBaseUrl, smsEnabled, admissionFormat, admissionStart, reportingDates, bursaryFormPdf } = body;

    if (!campus || email === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (user.role === "ADMIN" && campus !== user.campus) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const existing = await prisma.campusSetting.findUnique({
      where: { campus: campus as "MAIN" | "WEST" },
    });

    const existingSettings = (existing?.settings as any) || {};
    const merged = {
      email,
      appPassword: appPassword !== undefined && appPassword !== ""
        ? appPassword
        : existingSettings.appPassword || "",
      smsBaseUrl: smsBaseUrl !== undefined ? smsBaseUrl : existingSettings.smsBaseUrl || "",
      smsEnabled: smsEnabled !== undefined ? smsEnabled : existingSettings.smsEnabled || false,
      smsApiKey: smsApiKey !== undefined && smsApiKey !== ""
        ? smsApiKey
        : existingSettings.smsApiKey || "",
      smsApiSecret: smsApiSecret !== undefined && smsApiSecret !== ""
        ? smsApiSecret
        : existingSettings.smsApiSecret || "",
    };

    const admissionData: any = {};
    if (admissionFormat !== undefined) admissionData.admissionFormat = admissionFormat;
    if (admissionStart !== undefined) admissionData.admissionStart = admissionStart;
    if (reportingDates !== undefined) admissionData.reportingDates = reportingDates;
    if (bursaryFormPdf !== undefined) {
      admissionData.bursaryFormPdf = bursaryFormPdf === null ? null : Buffer.from(bursaryFormPdf.replace(/^data:application\/pdf;base64,/, ""), "base64");
    }

    await prisma.campusSetting.upsert({
      where: { campus: campus as "MAIN" | "WEST" },
      update: { settings: merged, ...admissionData },
      create: { campus: campus as "MAIN" | "WEST", settings: merged, ...admissionData },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
