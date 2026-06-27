import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { firstName, middleName, lastName, gender, phone, email, kcseGrade, preferredCampus, course, academicYear } = body;

    if (!firstName || !lastName || !phone || !preferredCampus || !course || !academicYear) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (email) {
      const existing = await prisma.student.findUnique({ where: { email } });
      if (existing) {
        return NextResponse.json({ error: "A student with this email already exists" }, { status: 409 });
      }
    }

    const courseRecord = await prisma.course.findUnique({ where: { id: course } });
    const courseName = courseRecord?.name || course;

    const student = await prisma.student.create({
      data: {
        firstName,
        middleName: middleName || null,
        lastName,
        gender: gender || null,
        phone,
        email: email || null,
        kcseGrade: kcseGrade || null,
        preferredCampus: preferredCampus as "MAIN" | "WEST",
        applications: {
          create: {
            course: courseName,
            academicYear,
          },
        },
      },
      include: { applications: true },
    });

    return NextResponse.json({ data: student }, { status: 201 });
  } catch (error) {
    console.error("Application error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
