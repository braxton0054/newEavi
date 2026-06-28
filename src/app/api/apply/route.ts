import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { firstName, middleName, lastName, gender, phone, email, educationQualification, preferredCampus, course, academicYear } = body;

    if (!firstName || !lastName || !phone || !preferredCampus || !course || !academicYear) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (email) {
      const existing = await prisma.student.findUnique({ where: { email } });
      if (existing) {
        return NextResponse.json({ error: "A student with this email already exists" }, { status: 409 });
      }
    }

    // Look up the qualification record (course is a CourseQualification ID)
    const courseQual = await prisma.courseQualification.findUnique({
      where: { id: course },
      include: { course: true },
    });
    const courseName = courseQual ? `${courseQual.course.name} (${courseQual.qualificationType})` : course;

    // Validate education qualification against course minimum grade
    if (courseQual?.minGrade && educationQualification) {
      const { meetsQualification } = await import("@/lib/education-qualifications");
      if (!meetsQualification(educationQualification, courseQual.minGrade)) {
        return NextResponse.json(
          { error: `Your qualification (${educationQualification}) does not meet the minimum requirement (${courseQual.minGrade}) for this course.` },
          { status: 400 }
        );
      }
    }

    const student = await prisma.student.create({
      data: {
        firstName,
        middleName: middleName || null,
        lastName,
        gender: gender || null,
        phone,
        email: email || null,
        educationQualification: educationQualification || null,
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
