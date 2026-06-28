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

    // Look up the course with all its qualification tracks
    const courseRecord = await prisma.course.findUnique({
      where: { id: course },
      include: { qualifications: true },
    });

    if (!courseRecord) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Find qualification tracks the student meets (educationQualification >= minGrade)
    const { meetsQualification } = await import("@/lib/education-qualifications");
    let matchedQual = null;

    if (educationQualification) {
      for (const q of courseRecord.qualifications) {
        if (q.minGrade && meetsQualification(educationQualification, q.minGrade)) {
          matchedQual = q;
          break; // pick the first match
        }
      }
    }

    // If student has no educationQualification or doesn't meet any track, still allow apply (pending review)
    // Store the course name + matched qualification type
    const courseName = matchedQual
      ? `${courseRecord.name} (${matchedQual.qualificationType})`
      : courseRecord.name;

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
