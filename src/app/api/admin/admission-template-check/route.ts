import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getTemplateFieldNames } from "@/lib/admission-pdf";
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

    const template = await prisma.admissionPdfTemplate.findFirst({
      orderBy: { createdAt: "desc" },
    });

    if (!template) {
      return NextResponse.json({ error: "No template uploaded" }, { status: 404 });
    }

    const templateBuffer = Buffer.from(template.pdfData);
    const fieldData = await getTemplateFieldNames(templateBuffer);

    // Expected fields the system looks for
    const expectedFields = [
      "letter_date",
      "student_name",
      "course_type",
      "course_name",
      "admission_number",
      "report_date",
      "campus",
      "academic_year",
      "education_qualification",
      "student_phone",
      "student_email",
    ];

    const found = expectedFields.filter(f => fieldData.some(d => d.name === f));
    const missing = expectedFields.filter(f => !fieldData.some(d => d.name === f));
    const duplicates = fieldData.filter(d => d.count > 1);

    return NextResponse.json({
      data: {
        templateName: template.name,
        allFieldsInPdf: fieldData,
        expectedFieldsFound: found,
        expectedFieldsMissing: missing,
        duplicates,
        ready: missing.length === 0,
      },
    });
  } catch (error) {
    console.error("Error checking template:", error);
    return NextResponse.json({ error: "Failed to check template" }, { status: 500 });
  }
}
