import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export interface AdmissionPdfData {
  studentName: string;
  course: string;
  campus: string;
  admissionNumber: string;
  reportingDate: string;
  academicYear: string;
  currentDate: string;
  kcseGrade?: string | null;
  phone?: string | null;
  email?: string | null;
}

export async function generateAdmissionPdf(
  templateBytes: Buffer,
  data: AdmissionPdfData
): Promise<Uint8Array> {
  // Load the template PDF
  const pdfDoc = await PDFDocument.load(templateBytes);

  // Get pages
  const pages = pdfDoc.getPages();
  const firstPage = pages[0];
  const { width, height } = firstPage.getSize();

  // Embed a font for drawing text
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Draw placeholder replacements on the template
  // We draw text at positions that align with typical admission letter layouts
  // Coordinates are from bottom-left (0,0)
  // Page is typically A4: 595.28 x 841.89

  const fontSize = 11;
  const lineHeight = 16;

  // Current date — top right area
  firstPage.drawText(data.currentDate, {
    x: width - 180,
    y: height - 80,
    size: fontSize,
    font,
    color: rgb(0, 0, 0),
  });

  // Admission number — top right area, below date
  firstPage.drawText(data.admissionNumber, {
    x: width - 180,
    y: height - 100,
    size: fontSize,
    font: boldFont,
    color: rgb(0, 0, 0),
  });

  // Student name — below header area
  firstPage.drawText(data.studentName, {
    x: 72,
    y: height - 180,
    size: fontSize + 2,
    font: boldFont,
    color: rgb(0, 0, 0),
  });

  // Course
  firstPage.drawText(data.course, {
    x: 72,
    y: height - 210,
    size: fontSize,
    font,
    color: rgb(0, 0, 0),
  });

  // Campus
  firstPage.drawText(data.campus, {
    x: 72,
    y: height - 230,
    size: fontSize,
    font,
    color: rgb(0, 0, 0),
  });

  // Reporting date
  firstPage.drawText(data.reportingDate, {
    x: 72,
    y: height - 250,
    size: fontSize,
    font,
    color: rgb(0, 0, 0),
  });

  // Academic year
  firstPage.drawText(data.academicYear, {
    x: 72,
    y: height - 270,
    size: fontSize,
    font,
    color: rgb(0, 0, 0),
  });

  // Optional fields
  if (data.kcseGrade) {
    firstPage.drawText(data.kcseGrade, {
      x: 72,
      y: height - 290,
      size: fontSize,
      font,
      color: rgb(0, 0, 0),
    });
  }

  if (data.phone) {
    firstPage.drawText(data.phone, {
      x: 72,
      y: height - 310,
      size: fontSize,
      font,
      color: rgb(0, 0, 0),
    });
  }

  if (data.email) {
    firstPage.drawText(data.email, {
      x: 72,
      y: height - 330,
      size: fontSize,
      font,
      color: rgb(0, 0, 0),
    });
  }

  // Save and return bytes
  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}

/**
 * Generate a simple admission letter from scratch
 * (fallback if no template is uploaded)
 */
export function generateSimpleAdmissionLetter(data: AdmissionPdfData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Admission Letter - ${data.studentName}</title>
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; color: #1a1a1a; line-height: 1.6; }
    .header { text-align: center; border-bottom: 3px solid #1e40af; padding-bottom: 20px; margin-bottom: 30px; }
    .header h1 { color: #1e40af; margin: 0; font-size: 24px; }
    .header p { margin: 5px 0; color: #555; font-size: 14px; }
    .date { text-align: right; color: #555; margin-bottom: 20px; }
    .ref { background: #f3f4f6; padding: 10px 15px; border-left: 4px solid #1e40af; margin-bottom: 20px; }
    .content { margin-bottom: 30px; }
    .content h2 { color: #1e40af; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; }
    .info-grid { display: grid; grid-template-columns: 180px 1fr; gap: 8px; margin: 15px 0; }
    .info-grid .label { font-weight: bold; color: #374151; }
    .info-grid .value { color: #1a1a1a; }
    .signature { margin-top: 50px; border-top: 1px solid #e5e7eb; padding-top: 20px; }
    .signature p { margin: 4px 0; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <h1>EAST AFRICA VISION INSTITUTE</h1>
    <p>Excellence in Education &amp; Training</p>
    <p>Admission Letter</p>
  </div>

  <div class="date">Date: ${data.currentDate}</div>

  <div class="ref">
    <strong>Admission Number:</strong> ${data.admissionNumber}<br>
    <strong>Academic Year:</strong> ${data.academicYear}
  </div>

  <div class="content">
    <h2>Student Information</h2>
    <div class="info-grid">
      <div class="label">Full Name:</div>
      <div class="value">${data.studentName}</div>
      <div class="label">Course:</div>
      <div class="value">${data.course}</div>
      <div class="label">Campus:</div>
      <div class="value">${data.campus} Campus</div>
      <div class="label">Reporting Date:</div>
      <div class="value">${data.reportingDate}</div>
      ${data.kcseGrade ? `<div class="label">KCSE Grade:</div><div class="value">${data.kcseGrade}</div>` : ""}
      ${data.phone ? `<div class="label">Phone:</div><div class="value">${data.phone}</div>` : ""}
      ${data.email ? `<div class="label">Email:</div><div class="value">${data.email}</div>` : ""}
    </div>

    <h2>Welcome Message</h2>
    <p>Dear ${data.studentName},</p>
    <p>We are pleased to inform you that your application has been <strong>APPROVED</strong> and you have been admitted to East Africa Vision Institute for the <strong>${data.course}</strong> program at our <strong>${data.campus} Campus</strong>.</p>
    <p>Please report to the campus on <strong>${data.reportingDate}</strong> with the following documents:</p>
    <ul>
      <li>Original and copies of academic certificates</li>
      <li>Original and copies of ID/Passport</li>
      <li>4 passport-size photographs</li>
      <li>This admission letter (printed)</li>
      <li>Proof of fee payment</li>
    </ul>
    <p>If you have any questions, please do not hesitate to contact the admissions office.</p>
  </div>

  <div class="signature">
    <p><strong>Admissions Office</strong></p>
    <p>East Africa Vision Institute</p>
    <p>_________________________</p>
    <p>Date: ${data.currentDate}</p>
  </div>

  <div class="footer">
    <p>This is a computer-generated document. For verification, contact the admissions office.</p>
    <p>EAVI — Building Tomorrow's Leaders Today</p>
  </div>
</body>
</html>
`;
}
