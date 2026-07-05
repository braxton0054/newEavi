import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { encrypt } from "@/lib/encryption";
export const dynamic = "force-dynamic";

const KEY = "email_system";
const DEFAULT_SMTP = { host: "smtp.gmail.com", port: 587, fromName: "EAVI College" };

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user || user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const setting = await prisma.systemSetting.findUnique({ where: { key: KEY } });
    if (!setting) {
      return NextResponse.json({ data: { ...DEFAULT_SMTP, user: "", appPassword: false, hasAppPassword: false } }, { status: 200 });
    }

    const val = JSON.parse(setting.value);
    return NextResponse.json({
      data: {
        host: val.host || DEFAULT_SMTP.host,
        port: val.port || DEFAULT_SMTP.port,
        fromName: val.fromName || DEFAULT_SMTP.fromName,
        user: val.user || "",
        appPassword: false,
        hasAppPassword: !!val.appPassword,
      },
    }, { status: 200 });
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
    if (!user || user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { user: emailUser, appPassword, host, port, fromName } = body;

    if (!emailUser) {
      return NextResponse.json({ error: "Email user is required" }, { status: 400 });
    }

    const existing = await prisma.systemSetting.findUnique({ where: { key: KEY } });
    const existingVal = existing ? JSON.parse(existing.value) : {};

    const value = {
      host: host || DEFAULT_SMTP.host,
      port: port || DEFAULT_SMTP.port,
      fromName: fromName || DEFAULT_SMTP.fromName,
      user: emailUser,
      appPassword: appPassword !== undefined && appPassword !== ""
        ? encrypt(appPassword)
        : existingVal.appPassword || "",
    };

    await prisma.systemSetting.upsert({
      where: { key: KEY },
      update: { value: JSON.stringify(value) },
      create: { key: KEY, value: JSON.stringify(value) },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
