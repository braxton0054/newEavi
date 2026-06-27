import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const admins = [
      { email: "super@eavi-college.edu", password: "admin123", name: "Super Admin", role: "SUPER_ADMIN" as const },
      { email: "main@eavi-college.edu", password: "admin123", name: "Main Campus Admin", role: "ADMIN" as const, campus: "MAIN" as const },
      { email: "west@eavi-college.edu", password: "admin123", name: "West Campus Admin", role: "ADMIN" as const, campus: "WEST" as const },
    ];

    const results = [];
    for (const admin of admins) {
      const existing = await prisma.user.findUnique({ where: { email: admin.email } });
      if (existing) {
        results.push({ email: admin.email, status: "already exists" });
        continue;
      }

      try {
        const { user } = await auth.api.signUpEmail({
          body: {
            email: admin.email,
            password: admin.password,
            name: admin.name,
            role: admin.role,
            campus: admin.campus,
          },
        });

        results.push({ email: admin.email, role: admin.role, campus: admin.campus });
      } catch (err: any) {
        results.push({ email: admin.email, error: err?.message || String(err) });
      }
    }

    return NextResponse.json({ data: results }, { status: 201 });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json({ error: "Seed failed" }, { status: 500 });
  }
}
