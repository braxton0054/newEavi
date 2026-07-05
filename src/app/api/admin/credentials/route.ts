import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";
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
    const { newEmail, currentPassword } = body;
    if (!newEmail) return NextResponse.json({ error: "New email is required" }, { status: 400 });

    // Require current password to change email
    if (!currentPassword) {
      return NextResponse.json({ error: "Current password is required to change email" }, { status: 400 });
    }

    // Verify current password against stored hash
    const account = await prisma.account.findFirst({
      where: { userId: user.id, providerId: "email" },
    });
    if (!account?.password) {
      return NextResponse.json({ error: "No password set on this account" }, { status: 400 });
    }
    const valid = await bcrypt.compare(currentPassword, account.password);
    if (!valid) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 403 });
    }

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
