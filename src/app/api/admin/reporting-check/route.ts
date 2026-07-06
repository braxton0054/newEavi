import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // JS months are 0-indexed

    // Check if any reporting period exists for this month
    const period = await prisma.reportingPeriod.findFirst({
      where: { year: currentYear, month: currentMonth },
    });

    return NextResponse.json({
      missing: !period,
      year: currentYear,
      month: currentMonth,
    });
  } catch (error) {
    console.error("GET reporting-check error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
