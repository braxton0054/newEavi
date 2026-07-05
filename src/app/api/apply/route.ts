import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { meetsQualification, GRADE_RANK } from "@/lib/education-qualifications";
import { enqueueNotification } from "@/lib/notification-queue";
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
    const { firstName, middleName, lastName, gender, phone, email, educationQualification, preferredCampus, course } = body;

    if (!firstName || !lastName || !phone || !preferredCampus || !course) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (email) {
      const existing = await prisma.student.findUnique({ where: { email } });
      if (existing) {
        return NextResponse.json({ error: "A student with this email already exists" }, { status: 409 });
      }
    }

    // Duplicate detection: same phone + similar name across campuses
    const normalizedFirst = firstName.trim().toLowerCase();
    const normalizedLast = lastName.trim().toLowerCase();
    const phoneClean = phone.replace(/[\s\-\(\)\+]/g, "");

    const phoneDupes = await prisma.student.findMany({
      where: { phone: { contains: phoneClean.slice(-9) } }, // match last 9 digits
    });
    for (const dupe of phoneDupes) {
      const dupeFirst = dupe.firstName.trim().toLowerCase();
      const dupeLast = dupe.lastName.trim().toLowerCase();
      const firstNameMatch = dupeFirst === normalizedFirst
        || dupeFirst.includes(normalizedFirst)
        || normalizedFirst.includes(dupeFirst);
      const lastNameMatch = dupeLast === normalizedLast
        || dupeLast.includes(normalizedLast)
        || normalizedLast.includes(dupeLast);
      if (firstNameMatch && lastNameMatch) {
        return NextResponse.json({
          error: "A student with this name and phone number already exists. If this is a mistake, contact the admin.",
          existingStudentId: dupe.id,
          existingCampus: dupe.preferredCampus,
          existingStatus: dupe.status,
        }, { status: 409 });
      }
    }

    // Look up the course
    const courseRecord = await prisma.course.findUnique({
      where: { id: course },
    });

    if (!courseRecord) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const courseName = courseRecord.name;

    // Check if student's education qualification meets the course minimum
    if (educationQualification) {
      const qualified = meetsQualification(educationQualification, courseRecord.minGrade);
      if (!qualified) {
        // Find all courses the student IS qualified for
        const allCourses = await prisma.course.findMany({ orderBy: { name: "asc" } });
        const suggested = allCourses
          .filter(c => c.id !== course && meetsQualification(educationQualification, c.minGrade))
          .map(c => ({ id: c.id, name: c.name, minGrade: c.minGrade }));

        const studentRank = GRADE_RANK[educationQualification] ?? 0;
        const requiredRank = GRADE_RANK[courseRecord.minGrade] ?? 0;

        return NextResponse.json({
          error: `Your qualification (${educationQualification}, rank ${studentRank}) does not meet the minimum requirement for ${courseName} (${courseRecord.minGrade}, rank ${requiredRank}).`,
          suggested,
          qualification: educationQualification,
        }, { status: 422 });
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
        status: "APPROVED",
        applications: {
          create: {
            course: courseName,
            status: "APPROVED",
          },
        },
      },
      include: { applications: true },
    });

    // Enqueue notifications (WhatsApp, Email, SMS) — processed in background one at a time
    enqueueNotification(student.id).catch(err =>
      console.error("Enqueue error:", err)
    );

    return NextResponse.json({ data: student }, { status: 201 });
  } catch (error) {
    console.error("Application error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
