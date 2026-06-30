import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const campus = searchParams.get("campus");

    if (!campus || !["MAIN", "WEST"].includes(campus)) {
      return NextResponse.json({ error: "Invalid campus" }, { status: 400 });
    }

    const setting = await prisma.campusSetting.findUnique({
      where: { campus: campus as "MAIN" | "WEST" },
    });

    if (!setting || !setting.bursaryFormPdf) {
      return NextResponse.json({ error: "No bursary form PDF found" }, { status: 404 });
    }

    return new NextResponse(new Uint8Array(setting.bursaryFormPdf), {
      status: 200,
      headers: { "Content-Type": "application/pdf" },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
