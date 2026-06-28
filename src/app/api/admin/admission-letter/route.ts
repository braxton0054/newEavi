import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { fillAdmissionPdf } from "@/lib/admission-pdf";
import { EDUCATION_QUALIFICATIONS } from "@/lib/education-qualifications";

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");

    if (!studentId) {
      return NextResponse.json({ error: "studentId is required" }, { status: 400 });
    }

    // Fetch student with application data
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { applications: true },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    if (student.status !== "APPROVED") {
      return NextResponse.json({ error: "Student is not approved yet" }, { status: 400 });
    }

    // Get campus settings for reporting dates and admission format
    const campusSetting = student.preferredCampus
      ? await prisma.campusSetting.findUnique({
          where: { campus: student.preferredCampus },
        })
      : null;

    // Get admission PDF template
    const template = await prisma.admissionPdfTemplate.findFirst({
      orderBy: { createdAt: "desc" },
    });

    if (!template) {
      return NextResponse.json(
        { error: "No admission PDF template uploaded. Please upload one in Super Admin → Settings." },
        { status: 404 }
      );
    }

    // Build admission number from campus format
    const format = campusSetting?.admissionFormat || `EAVI/${student.preferredCampus}/2026/`;
    const lastNum = campusSetting?.lastAdmissionNumber || 0;
    const admissionNumber = `${format}${String(lastNum + 1).padStart(4, "0")}`;

    // Get reporting date from campus settings
    const reportingDates = (campusSetting?.reportingDates as any[]) || [];
    const reportDate = reportingDates.length > 0
      ? (reportingDates[0]?.start || reportingDates[0] || "To be communicated")
      : "To be communicated";

    const application = student.applications[0];
    const courseName = application?.course || "N/A";
    const academicYear = application?.academicYear || "2026-2027";

    const studentName = [student.firstName, student.middleName, student.lastName]
      .filter(Boolean)
      .join(" ");

    const currentDate = new Date().toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    // Extract course type from stored course name (format: "ICT (Diploma)")
    // The qualification type is in parentheses
    let courseType = "";
    let courseDisplayName = courseName;
    const qualMatch = courseName.match(/\(([^)]+)\)\s*$/);
    if (qualMatch) {
      courseType = qualMatch[1]; // e.g. "Diploma"
      // Strip the qualification suffix for display: "ICT (Diploma)" → "ICT"
      courseDisplayName = courseName.replace(/\s*\([^)]+\)\s*$/, "").trim();
    }

    // Also try to find the qualification record for additional details
    if (qualMatch) {
      const courseBaseName = courseDisplayName;
      const existingCourse = await prisma.course.findFirst({
        where: { name: courseBaseName },
        include: { qualifications: true },
      });
      if (existingCourse) {
        const qualRecord = existingCourse.qualifications.find(
          q => q.qualificationType === courseType
        );
        if (qualRecord) {
          // Use the qualification record details if needed
          courseType = qualRecord.qualificationType || courseType;
        }
      }
    }

    // Strip qualification type prefix to avoid "Diploma in Diploma in..."
    if (courseType && courseDisplayName.startsWith(courseType + " ")) {
      courseDisplayName = courseDisplayName.substring(courseType.length + 1);
    }

    const campusName = student.preferredCampus === "MAIN" ? "Main Campus" : "West Campus";

    // Fill the template PDF with real data
    const templateBuffer = Buffer.from(template.pdfData);
    const pdfBytes = await fillAdmissionPdf(templateBuffer, {
      letterDate: currentDate,
      studentName,
      courseType,
      courseName: courseDisplayName,
      admissionNumber,
      reportDate: typeof reportDate === "string" ? reportDate : String(reportDate),
      campus: campusName,
      academicYear,
      educationQualification: student.educationQualification || "",
      studentPhone: student.phone || "",
      studentEmail: student.email || "",
    });

    return new Response(new Blob([pdfBytes.slice()], { type: "application/pdf" }), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="admission-${admissionNumber}.pdf"`,
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Error generating admission PDF:", error);
    return NextResponse.json({ error: "Failed to generate admission letter" }, { status: 500 });
  }
}
