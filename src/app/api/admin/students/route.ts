import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const url = new URL(req.url);
    const campus = url.searchParams.get("campus");

    let where: any = {};
    if (user.role === "ADMIN" && user.campus) {
      where = { preferredCampus: user.campus };
    } else if (campus) {
      where = { preferredCampus: campus as "MAIN" | "WEST" };
    }

    const students = await prisma.student.findMany({
      where,
      include: { applications: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ data: students }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
