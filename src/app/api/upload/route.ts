import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const type = formData.get("type") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ error: "Only PDF files are allowed" }, { status: 400 });
    }

    const subDir = type === "bursary_form" ? "bursary-forms" : "fees";
    const uploadDir = path.join(process.cwd(), "public", "uploads", subDir);
    await mkdir(uploadDir, { recursive: true });

    const uniqueName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const filePath = path.join(uploadDir, uniqueName);
    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));

    const url = `/uploads/${subDir}/${uniqueName}`;
    return NextResponse.json({ data: { url, name: file.name } }, { status: 200 });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
