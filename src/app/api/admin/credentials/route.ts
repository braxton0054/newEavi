// POST /api/admin/credentials — change login email
// User is already authenticated via session — no extra password verify needed
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { newEmail } = body;
    if (!newEmail) return NextResponse.json({ error: "New email is required" }, { status: 400 });

    if (newEmail !== user.email) {
      const existing = await prisma.user.findUnique({ where: { email: newEmail } });
      if (existing) return NextResponse.json({ error: "Email already in use" }, { status: 409 });

      await prisma.user.update({
        where: { id: user.id },
        data: { email: newEmail, emailVerified: true },
      });
    }

    return NextResponse.json({ success: true, email: newEmail });
  } catch (error: any) {
    console.error("Credentials update error:", error?.message || error);
    return NextResponse.json(
      { error: error?.message || "Failed to update email" },
      { status: error?.status || 500 }
    );
  }
}
