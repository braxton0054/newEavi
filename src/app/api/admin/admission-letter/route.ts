import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { generateAdmissionPdf, generateSimpleAdmissionLetter } from "@/lib/admission-pdf";

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

    // Build admission number
    const format = campusSetting?.admissionFormat || `EAVI/${student.preferredCampus}/2026/`;
    const lastNum = campusSetting?.lastAdmissionNumber || 0;
    const admissionNumber = `${format}${String(lastNum + 1).padStart(4, "0")}`;

    // Get reporting date from settings
    const reportingDates = (campusSetting?.reportingDates as any[]) || [];
    const reportingDate = reportingDates.length > 0
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

    const pdfData = {
      studentName,
      course: courseName,
      campus: student.preferredCampus || "MAIN",
      admissionNumber,
      reportingDate: typeof reportingDate === "string" ? reportingDate : String(reportingDate),
      academicYear,
      currentDate,
      kcseGrade: student.kcseGrade,
      phone: student.phone,
      email: student.email,
    };

    if (template) {
      // Generate PDF from template
      const templateBuffer = Buffer.from(template.pdfData);
      const pdfBytes = await generateAdmissionPdf(templateBuffer, pdfData);

      return new Response(new Blob([pdfBytes.slice()], { type: "application/pdf" }), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename="admission-${admissionNumber}.pdf"`,
          "Cache-Control": "no-cache",
        },
      });
    } else {
      // Fallback: generate HTML admission letter
      const html = generateSimpleAdmissionLetter(pdfData);

      return new NextResponse(html, {
        status: 200,
        headers: {
          "Content-Type": "text/html",
          "Content-Disposition": `inline; filename="admission-${admissionNumber}.html"`,
        },
      });
    }
  } catch (error) {
    console.error("Error generating admission PDF:", error);
    return NextResponse.json({ error: "Failed to generate admission letter" }, { status: 500 });
  }
}
