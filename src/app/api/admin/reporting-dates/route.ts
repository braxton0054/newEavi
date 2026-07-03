// GET/PUT /api/admin/reporting-dates — shared across all campuses, super admin manages
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const periods = await prisma.reportingPeriod.findMany({
      orderBy: [{ year: "asc" }, { month: "asc" }],
    });
    return NextResponse.json({ data: periods });
  } catch (error) {
    console.error("GET reporting-dates error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user || user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden — super admin only" }, { status: 403 });
    }

    const body = await req.json();
    const { periods } = body; // [{ year, month, startDate, endDate }]

    if (!Array.isArray(periods)) {
      return NextResponse.json({ error: "periods array is required" }, { status: 400 });
    }

    // Replace all periods atomically
    await prisma.$transaction(async (tx) => {
      await tx.reportingPeriod.deleteMany();
      if (periods.length > 0) {
        await tx.reportingPeriod.createMany({
          data: periods.map((p: any) => ({
            year: p.year,
            month: p.month,
            startDate: p.startDate ? new Date(p.startDate) : null,
            endDate: p.endDate ? new Date(p.endDate) : null,
          })),
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PUT reporting-dates error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
