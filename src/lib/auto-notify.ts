import { prisma } from "@/lib/prisma";
import { fillAdmissionPdf } from "@/lib/admission-pdf";
import { sendEmail } from "@/lib/email";
import { sendSms } from "@/lib/sms";
import { sendDocument, sendText, checkNumber, ensureReady } from "@/lib/whatsapp";

interface NotifyResult {
  whatsapp: boolean;
  email: boolean;
  sms: boolean;
  errors: string[];
}

/**
 * After a student's application is approved, send:
 * 1. Admission PDF + fee structure PDF + bursary PDF via WhatsApp (if available)
 * 2. Same PDFs via Email
 * 3. Congratulations SMS
 */
export async function sendApprovalNotifications(
  studentId: string
): Promise<NotifyResult> {
  const result: NotifyResult = {
    whatsapp: false,
    email: false,
    sms: false,
    errors: [],
  };

  try {
    // 1. Fetch student with application data
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { applications: { orderBy: { createdAt: "desc" } } },
    });

    if (!student) {
      result.errors.push("Student not found");
      return result;
    }

    const application = student.applications[0];
    if (!application || application.status !== "APPROVED") {
      result.errors.push("Student is not approved yet");
      return result;
    }

    const campus = student.preferredCampus;
    if (!campus) {
      result.errors.push("No campus assigned");
      return result;
    }

    const studentName = [student.firstName, student.middleName, student.lastName]
      .filter(Boolean)
      .join(" ");

    // 2. Get campus settings (email, sms config)
    const campusSetting = await prisma.campusSetting.findUnique({
      where: { campus },
    });

    const settings = (campusSetting?.settings as any) || {};
    const emailConfig = {
      email: settings.email || "",
      appPassword: settings.appPassword || "",
      enabled: !!(settings.email && settings.appPassword),
    };
    const smsConfig = {
      apiKey: settings.smsApiKey || "",
      apiSecret: settings.smsApiSecret || "",
      baseUrl: settings.smsBaseUrl || "https://api.sms-gate.app/3rdparty/v1",
      enabled: !!settings.smsEnabled,
    };

    // 3. Get admission PDF template
    const template = await prisma.admissionPdfTemplate.findFirst({
      orderBy: { createdAt: "desc" },
    });

    // 4. Parse course name to find the course record
    const courseName = application.course || "";
    const qualMatch = courseName.match(/\(([^)]+)\)\s*$/);
    const courseBaseName = qualMatch
      ? courseName.replace(/\s*\([^)]+\)\s*$/, "").trim()
      : courseName;
    const courseType = qualMatch ? qualMatch[1] : "";

    // 5. Find course and qualification for fee structure PDF
    let feePdfUrl = "";
    const courseRecord = await prisma.course.findFirst({
      where: { name: courseBaseName },
      include: { qualifications: true },
    });
    if (courseRecord && courseType) {
      const qual = courseRecord.qualifications.find(
        (q) => q.qualificationCategory === courseType
      );
      if (qual?.feePdf) {
        feePdfUrl = qual.feePdf;
      }
    }

    // 6. Get bursary form PDF
    let bursaryPdfBuffer: Buffer | null = null;
    if (campusSetting?.bursaryFormPdf) {
      bursaryPdfBuffer = Buffer.from(campusSetting.bursaryFormPdf);
    }

    // 7. Generate admission PDF if template exists
    let admissionPdfBuffer: Buffer | null = null;
    if (template) {
      try {
        const admissionNumber = `${campusSetting?.admissionFormat || `EAVI/${campus}/2026/`}${String((campusSetting as any)?.lastAdmissionNumber || 1).padStart(4, "0")}`;
        const reportingDates = (campusSetting?.reportingDates as any[]) || [];
        const reportDate =
          reportingDates.length > 0
            ? reportingDates[0]?.start || reportingDates[0] || "To be communicated"
            : "To be communicated";

        const currentDate = new Date().toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });
        const campusName = campus === "MAIN" ? "Main Campus" : "West Campus";

        // Build course display name (strip qualifier)
        let courseDisplayName = courseBaseName;
        if (courseType && courseDisplayName.startsWith(courseType + " ")) {
          courseDisplayName = courseDisplayName.substring(courseType.length + 1);
        }

        const pdfBytes = await fillAdmissionPdf(Buffer.from(template.pdfData), {
          letterDate: currentDate,
          studentName,
          courseType,
          courseName: courseDisplayName,
          admissionNumber,
          reportDate: typeof reportDate === "string" ? reportDate : String(reportDate),
          campus: campusName,
          academicYear: application.academicYear,
          educationQualification: student.educationQualification || "",
          studentPhone: student.phone || "",
          studentEmail: student.email || "",
        });
        admissionPdfBuffer = Buffer.from(pdfBytes);
      } catch (err) {
        result.errors.push(`Admission PDF generation failed: ${(err as Error).message}`);
      }
    }

    // 8. Download fee structure PDF from URL
    let feePdfBuffer: Buffer | null = null;
    if (feePdfUrl) {
      try {
        const resp = await fetch(feePdfUrl);
        if (resp.ok) {
          feePdfBuffer = Buffer.from(await resp.arrayBuffer());
        }
      } catch (err) {
        result.errors.push(`Fee structure download failed: ${(err as Error).message}`);
      }
    }

    // 9. Ensure WhatsApp sessions are restored, then check availability
    await ensureReady();
    const whatsappAvailable = await checkNumber(campus, student.phone || "");

    // 10. Prepare common attachments
    const attachments: { filename: string; content: Buffer }[] = [];
    if (admissionPdfBuffer) {
      attachments.push({ filename: `Admission-${studentName.replace(/\s+/g, "_")}.pdf`, content: admissionPdfBuffer });
    }
    if (feePdfBuffer) {
      attachments.push({ filename: `Fee_Structure-${courseBaseName.replace(/\s+/g, "_")}.pdf`, content: feePdfBuffer });
    }
    if (bursaryPdfBuffer) {
      attachments.push({ filename: "Bursary_Form.pdf", content: bursaryPdfBuffer });
    }

    // 11. Send via WhatsApp (if connected and number available)
    if (whatsappAvailable) {
      try {
        // Send admission PDF
        if (admissionPdfBuffer) {
          await sendDocument(
            campus,
            student.phone || "",
            admissionPdfBuffer,
            `Admission_Letter.pdf`,
            `🎓 Congratulations ${studentName}! Your admission letter from EAVI College.`
          );
        }

        // Send fee structure
        if (feePdfBuffer) {
          await sendDocument(
            campus,
            student.phone || "",
            feePdfBuffer,
            `Fee_Structure.pdf`,
            `📋 Fee structure for ${courseBaseName} (${courseType || "N/A"}).`
          );
        }

        // Send bursary form
        if (bursaryPdfBuffer) {
          await sendDocument(
            campus,
            student.phone || "",
            bursaryPdfBuffer,
            "Bursary_Form.pdf",
            "📄 Please fill and submit the bursary form if you need financial assistance."
          );
        }

        result.whatsapp = true;
      } catch (err) {
        result.errors.push(`WhatsApp send failed: ${(err as Error).message}`);
      }
    }

    // 12. Send via Email
    if (emailConfig.enabled && student.email) {
      try {
        await sendEmail(
          emailConfig,
          student.email,
          `Congratulations ${studentName} — Admission to EAVI College`,
          `Dear ${studentName},\n\n` +
            `Congratulations! Your application to EAVI College has been approved.\n\n` +
            `Course: ${courseName}\n` +
            `Campus: ${campus === "MAIN" ? "Main Campus" : "West Campus"}\n\n` +
            `Please find attached your admission letter, fee structure, and bursary form.\n\n` +
            `Welcome to EAVI College!\n\n` +
            `Regards,\nEAVI College Administration`,
          attachments
        );
        result.email = true;
      } catch (err) {
        result.errors.push(`Email send failed: ${(err as Error).message}`);
      }
    }

    // 13. Send congratulations SMS
    if (smsConfig.enabled && student.phone) {
      try {
        const phoneClean = student.phone.startsWith("0")
          ? "254" + student.phone.slice(1)
          : student.phone.startsWith("+")
          ? student.phone.slice(1)
          : student.phone;

        await sendSms(
          smsConfig,
          phoneClean,
          `🎉 Congratulations ${studentName}! Your application to EAVI College (${courseName}) has been approved. Welcome aboard!`
        );
        result.sms = true;
      } catch (err) {
        result.errors.push(`SMS send failed: ${(err as Error).message}`);
      }
    }

    return result;
  } catch (err) {
    result.errors.push(`Notification error: ${(err as Error).message}`);
    return result;
  }
}
