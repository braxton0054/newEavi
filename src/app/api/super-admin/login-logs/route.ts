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

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50")));
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.loginLog.findMany({
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.loginLog.count(),
    ]);

    return NextResponse.json({ logs, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (e) {
    console.error("Failed to fetch login logs:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
