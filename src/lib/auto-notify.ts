import { prisma } from "@/lib/prisma";
import { fillAdmissionPdf } from "@/lib/admission-pdf";
import { sendEmail } from "@/lib/email";
import { sendSms } from "@/lib/sms";
import { getClient, sendDocument } from "@/lib/whatsapp";
import { getUpcomingReportingDate } from "@/lib/reporting-dates";
import { decrypt } from "@/lib/encryption";

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
      appPassword: settings.appPassword ? decrypt(settings.appPassword) : "",
      enabled: !!(settings.email && settings.appPassword),
    };
    const smsConfig = {
      apiKey: settings.smsApiKey ? decrypt(settings.smsApiKey) : "",
      apiSecret: settings.smsApiSecret ? decrypt(settings.smsApiSecret) : "",
      baseUrl: settings.smsBaseUrl || "https://api.sms-gate.app/3rdparty/v1",
      enabled: !!settings.smsEnabled,
    };

    // 3. Get admission PDF template
    const template = await prisma.admissionPdfTemplate.findFirst({
      orderBy: { createdAt: "desc" },
    });

    // 4. Find course for fee structure PDF
    const courseName = application.course || "";
    const courseRecord = await prisma.course.findFirst({
      where: { name: courseName },
      include: { feeStructure: true },
    });

    // 6. Get bursary form PDF
    let bursaryPdfBuffer: Buffer | null = null;
    if (campusSetting?.bursaryFormPdf) {
      bursaryPdfBuffer = Buffer.from(campusSetting.bursaryFormPdf);
    }

    // 7. Generate admission PDF if template exists
    let admissionPdfBuffer: Buffer | null = null;
    let admissionNumber = "";
    if (template) {
      try {
        // Atomically increment admission number in DB first
        const incremented = await prisma.campusSetting.update({
          where: { campus },
          data: { lastAdmissionNumber: { increment: 1 } },
        });
        const nextNum = incremented.lastAdmissionNumber;
        admissionNumber = `${campusSetting?.admissionFormat || `EAVI/${campus}/${new Date().getFullYear()}/`}${String(nextNum).padStart(4, "0")}`;
        const reportDate = await getUpcomingReportingDate();

        const currentDate = new Date().toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });
        const campusName = campus === "MAIN" ? "Main Campus" : "West Campus";

        const pdfBytes = await fillAdmissionPdf(Buffer.from(template.pdfData), {
          letterDate: currentDate,
          studentName,
          courseType: "",
          courseName: courseName,
          admissionNumber,
          reportDate,
          campus: campusName,
          educationQualification: student.educationQualification || "",
          studentPhone: student.phone || "",
          studentEmail: student.email || "",
        });
        admissionPdfBuffer = Buffer.from(pdfBytes);
      } catch (err) {
        result.errors.push(`Admission PDF generation failed: ${(err as Error).message}`);
      }
    }

    // 8. Get fee structure PDF from DB
    let feePdfBuffer: Buffer | null = null;
    if (courseRecord?.feeStructure?.pdfData) {
      feePdfBuffer = Buffer.from(courseRecord.feeStructure.pdfData);
    }

    // 9. Check WhatsApp availability — attempt to send regardless, don't block on onWhatsApp check
    // (onWhatsApp API calls from Baileys are unreliable under load and silently fail for
    // subsequent students, causing PDFs to never send. Just try sending directly instead.)
    const sock = await getClient(campus);
    if (!sock) {
      result.errors.push(`WhatsApp not connected for campus ${campus}`);
    }

    // 10. Prepare common attachments
    const attachments: { filename: string; content: Buffer }[] = [];
    if (admissionPdfBuffer) {
      attachments.push({ filename: `Admission-${studentName.replace(/\s+/g, "_")}.pdf`, content: admissionPdfBuffer });
    }
    if (feePdfBuffer) {
      attachments.push({ filename: `Fee_Structure-${(courseRecord?.name || courseName).replace(/\s+/g, "_")}.pdf`, content: feePdfBuffer });
    }
    if (bursaryPdfBuffer) {
      attachments.push({ filename: "Bursary_Form.pdf", content: bursaryPdfBuffer });
    }

    // 11. Send via WhatsApp (if connected)
    if (sock) {
      let sentAnything = false;
      try {
        // Send admission PDF
        if (admissionPdfBuffer) {
          const ok = await sendDocument(
            campus,
            student.phone || "",
            admissionPdfBuffer,
            `Admission_Letter.pdf`,
            `🎓 Congratulations ${studentName}! Your admission letter from EAVI College.`
          );
          if (ok) sentAnything = true;
          else result.errors.push(`WhatsApp admission PDF send returned false for ${campus}`);
        }

        // Send fee structure
        if (feePdfBuffer) {
          const ok = await sendDocument(
            campus,
            student.phone || "",
            feePdfBuffer,
            `Fee_Structure.pdf`,
            `📋 Fee structure for ${courseRecord?.name || courseName}.`
          );
          if (ok) sentAnything = true;
          else result.errors.push(`WhatsApp fee structure send returned false for ${campus}`);
        }

        // Send bursary form
        if (bursaryPdfBuffer) {
          const ok = await sendDocument(
            campus,
            student.phone || "",
            bursaryPdfBuffer,
            "Bursary_Form.pdf",
            "📄 Please fill and submit the bursary form if you need financial assistance."
          );
          if (ok) sentAnything = true;
          else result.errors.push(`WhatsApp bursary form send returned false for ${campus}`);
        }

        if (sentAnything) {
          result.whatsapp = true;
        } else {
          result.errors.push(`WhatsApp: no documents were sent for ${campus} (no PDF data or all sends failed)`);
        }
      } catch (err) {
        result.errors.push(`WhatsApp send failed for ${campus}: ${(err as Error).message}`);
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

    // 13. Send SMS with reporting date and contact info
    if (smsConfig.enabled && student.phone) {
      try {
        const phoneClean = student.phone.startsWith("0")
          ? "254" + student.phone.slice(1)
          : student.phone.startsWith("+")
          ? student.phone.slice(1)
          : student.phone;

        const reportDate = await getUpcomingReportingDate();

        await sendSms(
          smsConfig,
          phoneClean,
          `Congratulations ${studentName}! Your application to EAVI College (${courseName}) has been approved. Report on ${reportDate}. Download your admission letter sent via WhatsApp or email. For inquiries call 0726022044 (Main) or 0748022044 (West).`
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
