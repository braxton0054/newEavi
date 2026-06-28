import { PDFDocument } from "pdf-lib";

/**
 * Field names in the admission PDF template.
 * These must match the text field names in your PDF template.
 * 
 * To add more fields, just update this interface and the fillAdmissionPdf function.
 */
export interface AdmissionPdfFields {
  letterDate: string;
  studentName: string;
  courseType: string;
  courseName: string;
  admissionNumber: string;
  reportDate: string;
  campus?: string;
  academicYear?: string;
  educationQualification?: string;
  studentPhone?: string;
  studentEmail?: string;
}

/**
 * Fill an admission PDF template with student data.
 * 
 * The template PDF must have text fields with these exact names:
 * - letter_date
 * - student_name (can appear twice — one for letter body, one for M-Pesa account name)
 * - course_type
 * - course_name
 * - admission_number
 * - report_date
 * - campus (optional)
 * - academic_year (optional)
 * - education_qualification (optional)
 * - student_phone (optional)
 * - student_email (optional)
 * 
 * To create a template:
 * 1. Create a PDF with form fields (use Adobe Acrobat, LibreOffice, or similar)
 * 2. Name each field to match the keys above
 * 3. Upload via Super Admin → Settings → Admission PDF Template
 */
export async function fillAdmissionPdf(
  templateBytes: Buffer,
  fields: AdmissionPdfFields
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(templateBytes);
  const form = pdfDoc.getForm();

  // Helper to fill ALL fields with a given name (handles duplicates like student_name)
  function fillAllFields(name: string, value: string) {
    const allFields = form.getFields();
    const matching = allFields.filter(f => f.getName() === name);
    matching.forEach(f => {
      try {
        if ('setText' in f) {
          (f as any).setText(value);
        }
      } catch {
        // skip
      }
    });
  }

  // Helper to fill only the first occurrence of a field name
  function fillFirstField(name: string, value: string) {
    try {
      const field = form.getTextField(name);
      field.setText(value);
    } catch {
      // Field not found — skip silently
    }
  }

  // Fill fields that may appear multiple times (like student_name)
  fillAllFields("student_name", fields.studentName);

  // Fill unique fields
  fillFirstField("letter_date", fields.letterDate);
  fillFirstField("course_type", fields.courseType);
  fillFirstField("course_name", fields.courseName);
  fillFirstField("admission_number", fields.admissionNumber);
  fillFirstField("report_date", fields.reportDate);

  if (fields.campus) fillFirstField("campus", fields.campus);
  if (fields.academicYear) fillFirstField("academic_year", fields.academicYear);
  if (fields.educationQualification) fillFirstField("education_qualification", fields.educationQualification);
  if (fields.studentPhone) fillFirstField("student_phone", fields.studentPhone);
  if (fields.studentEmail) fillFirstField("student_email", fields.studentEmail);

  // Flatten so the values are baked in and can't be edited
  form.flatten();

  return await pdfDoc.save();
}

/**
 * Get the list of text field names in a PDF template.
 * Useful for verifying template has the right fields before upload.
 */
export async function getTemplateFieldNames(templateBytes: Buffer): Promise<{ name: string; count: number }[]> {
  const pdfDoc = await PDFDocument.load(templateBytes);
  const form = pdfDoc.getForm();
  const allFields = form.getFields();
  
  // Count occurrences of each field name
  const counts: Record<string, number> = {};
  allFields.forEach(f => {
    const name = f.getName();
    counts[name] = (counts[name] || 0) + 1;
  });

  return Object.entries(counts).map(([name, count]) => ({ name, count }));
}
