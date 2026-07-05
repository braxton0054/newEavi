import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encryption";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return NextResponse.json({ error: "No account with that email" }, { status: 404 });

    // Generate 6-digit OTP
    const token = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await prisma.passwordResetToken.create({ data: { email, token, expiresAt } });

    // Try system email first, fall back to campus-specific
    let emailConfig = { email: "", appPassword: "", enabled: false };

    const systemSetting = await prisma.systemSetting.findUnique({ where: { key: "email_system" } });
    if (systemSetting) {
      const sys = JSON.parse(systemSetting.value);
      if (sys.user && sys.appPassword) {
        emailConfig = {
          email: sys.user,
          appPassword: decrypt(sys.appPassword),
          enabled: true,
        };
      }
    }

    if (!emailConfig.enabled) {
      // Fallback: campus-specific email config
      let settings: Record<string, any> = {};
      if (user.campus) {
        const cs = await prisma.campusSetting.findUnique({ where: { campus: user.campus as any } });
        if (cs) settings = cs.settings as Record<string, any>;
      } else {
        for (const c of ["MAIN", "WEST"] as const) {
          const cs = await prisma.campusSetting.findUnique({ where: { campus: c } });
          if (cs?.settings && (cs.settings as Record<string, any>).email) {
            settings = cs.settings as Record<string, any>;
            break;
          }
        }
      }

      emailConfig = {
        email: settings.email || "",
        appPassword: settings.appPassword ? decrypt(settings.appPassword) : "",
        enabled: !!(settings.email && settings.appPassword),
      };
    }

    if (!emailConfig.enabled) {
      return NextResponse.json({
        error: "Email is not configured. Contact your administrator.",
      }, { status: 503 });
    }

    const { sendEmail } = await import("@/lib/email");
    await sendEmail(
      emailConfig,
      email,
      "EAVI College - Password Reset OTP",
      `Your password reset OTP is: ${token}\n\nThis code expires in 10 minutes.\n\nIf you did not request this, ignore this message.`
    );

    return NextResponse.json({ message: "OTP sent to your email" });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Something went wrong" }, { status: 500 });
  }
}
