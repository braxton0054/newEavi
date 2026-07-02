import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { fillAdmissionPdf } from "@/lib/admission-pdf";
export const dynamic = "force-dynamic";

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

    // Build admission number from campus format and increment
    const format = campusSetting?.admissionFormat || `EAVI/${student.preferredCampus}/${new Date().getFullYear()}/`;
    const lastNum = campusSetting?.lastAdmissionNumber || 0;
    const nextNum = lastNum + 1;
    const admissionNumber = `${format}${String(nextNum).padStart(4, "0")}`;

    // Persist the incremented number to the DB
    await prisma.campusSetting.update({
      where: { campus: student.preferredCampus as "MAIN" | "WEST" },
      data: { lastAdmissionNumber: nextNum },
    });

    // Get next reporting date from campus settings
    const reportingDates = (campusSetting?.reportingDates as any[]) || [];
    const now = new Date();
    const nextReporting = reportingDates
      .filter(d => d.startDate && new Date(d.startDate) > now)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())[0];
    const reportDate = nextReporting
      ? `${new Date(nextReporting.startDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`
      : "To be communicated";

    const application = student.applications[0];
    const courseName = application?.course || "N/A";

    const studentName = [student.firstName, student.middleName, student.lastName]
      .filter(Boolean)
      .join(" ");

    const currentDate = new Date().toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const campusName = student.preferredCampus === "MAIN" ? "Main Campus" : "West Campus";

    // Fill the template PDF with real data
    const templateBuffer = Buffer.from(template.pdfData);
    const pdfBytes = await fillAdmissionPdf(templateBuffer, {
      letterDate: currentDate,
      studentName,
      courseType: "",
      courseName,
      admissionNumber,
      reportDate: typeof reportDate === "string" ? reportDate : String(reportDate),
      campus: campusName,
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