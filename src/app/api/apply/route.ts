import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { sendApprovalNotifications } from "@/lib/auto-notify";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // Rate limit: 5 requests per IP per minute
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || req.headers.get("x-real-ip")
      || "unknown";
    const result = rateLimit(`apply:${ip}`, 5, 60_000);
    if (!result.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: { "Retry-After": String(Math.ceil((result.resetAt - Date.now()) / 1000)) } }
      );
    }

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
      ? `${courseRecord.name} (${matchedQual.qualificationCategory || matchedQual.qualificationLevel})`
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
        status: "APPROVED",
        applications: {
          create: {
            course: courseName,
            academicYear,
            status: "APPROVED",
          },
        },
      },
      include: { applications: true },
    });

    // Send notifications (WhatsApp + Email + SMS) — fire and forget
    sendApprovalNotifications(student.id).catch(err =>
      console.error("Auto-notify error:", err)
    );

    return NextResponse.json({ data: student }, { status: 201 });
  } catch (error) {
    console.error("Application error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
