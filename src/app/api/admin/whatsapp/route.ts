import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getStatus, connect, disconnect } from "@/lib/whatsapp";

async function getUser(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return null;
  return prisma.user.findUnique({ where: { id: session.user.id } });
}

export async function GET(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const campus = searchParams.get("campus");

  if (!campus) return NextResponse.json({ error: "Missing campus" }, { status: 400 });
  if (user.role === "ADMIN" && campus !== user.campus) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const status = await getStatus(campus);
  return NextResponse.json({ data: status }, { status: 200 });
}

export async function POST(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const campus = searchParams.get("campus");

  if (!campus) return NextResponse.json({ error: "Missing campus" }, { status: 400 });
  if (user.role === "ADMIN" && campus !== user.campus) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { action } = body;

  if (action === "connect") {
    try {
      const result = await connect(campus);
      return NextResponse.json({ data: result }, { status: 200 });
    } catch (err) {
      console.error("WhatsApp connect error:", err);
      return NextResponse.json({ error: "Failed to connect" }, { status: 500 });
    }
  }

  if (action === "disconnect") {
    await disconnect(campus);
    return NextResponse.json({ success: true }, { status: 200 });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
