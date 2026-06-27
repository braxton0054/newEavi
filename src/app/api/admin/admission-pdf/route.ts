import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const template = await prisma.admissionPdfTemplate.findFirst({
      orderBy: { createdAt: "desc" },
    });

    if (!template) {
      return new NextResponse("No admission PDF template found", { status: 404 });
    }

    return new NextResponse(new Uint8Array(template.pdfData), {
      status: 200,
      headers: {
        "Content-Type": template.mimeType || "application/pdf",
        "Content-Disposition": `inline; filename="${template.name}"`,
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Error fetching admission PDF:", error);
    return NextResponse.json({ error: "Failed to fetch PDF" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ error: "Only PDF files are allowed" }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large. Max 10MB." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Remove existing template, then insert new one
    await prisma.admissionPdfTemplate.deleteMany();

    const template = await prisma.admissionPdfTemplate.create({
      data: {
        name: file.name,
        pdfData: buffer,
        mimeType: file.type || "application/pdf",
      },
    });

    return NextResponse.json({
      data: { id: template.id, name: template.name },
    }, { status: 200 });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await prisma.admissionPdfTemplate.deleteMany();
    return NextResponse.json({ data: { message: "Admission PDF template removed" } });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
