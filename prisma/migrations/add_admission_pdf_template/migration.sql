-- CreateTable
CREATE TABLE "admission_pdf_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "pdfData" BYTEA NOT NULL,
    "mimeType" TEXT NOT NULL DEFAULT 'application/pdf',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admission_pdf_templates_pkey" PRIMARY KEY ("id")
);
