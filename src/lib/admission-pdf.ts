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
 * - student_name
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

  // Helper to safely fill a field — skips if field doesn't exist in template
  function fillField(name: string, value: string) {
    try {
      const field = form.getTextField(name);
      field.setText(value);
    } catch {
      // Field not found in template — skip silently
    }
  }

  fillField("letter_date", fields.letterDate);
  fillField("student_name", fields.studentName);
  fillField("course_type", fields.courseType);
  fillField("course_name", fields.courseName);
  fillField("admission_number", fields.admissionNumber);
  fillField("report_date", fields.reportDate);

  if (fields.campus) fillField("campus", fields.campus);
  if (fields.academicYear) fillField("academic_year", fields.academicYear);
  if (fields.educationQualification) fillField("education_qualification", fields.educationQualification);
  if (fields.studentPhone) fillField("student_phone", fields.studentPhone);
  if (fields.studentEmail) fillField("student_email", fields.studentEmail);

  // Flatten so the values are baked in and can't be edited
  form.flatten();

  return await pdfDoc.save();
}

/**
 * Get the list of text field names in a PDF template.
 * Useful for verifying template has the right fields.
 */
export async function getTemplateFieldNames(templateBytes: Buffer): Promise<string[]> {
  const pdfDoc = await PDFDocument.load(templateBytes);
  const form = pdfDoc.getForm();
  return form.getFields().map(f => f.getName());
}
