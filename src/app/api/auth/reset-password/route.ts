import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { email, otp, password } = await req.json();
    if (!email || !otp || !password) {
      return NextResponse.json({ error: "Email, OTP, and new password are required" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    // Find valid token
    const tokenRecord = await prisma.passwordResetToken.findFirst({
      where: {
        email,
        token: otp,
        used: false,
        expiresAt: { gte: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!tokenRecord) {
      return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 });
    }

    // Mark token as used
    await prisma.passwordResetToken.update({
      where: { id: tokenRecord.id },
      data: { used: true },
    });

    // Update password via Better Auth's Account table
    const bcryptHash = await import("bcryptjs").then(m => m.hash(password, 10));
    await prisma.account.updateMany({
      where: { userId: (await prisma.user.findUnique({ where: { email }, select: { id: true } }))!.id },
      data: { password: bcryptHash },
    });

    return NextResponse.json({ message: "Password reset successful. You can now login." });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Something went wrong" }, { status: 500 });
  }
}
