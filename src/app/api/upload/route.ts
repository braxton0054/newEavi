import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    // AUTH CHECK: only super admin can upload
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (user?.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const type = formData.get("type") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ error: "Only PDF files are allowed" }, { status: 400 });
    }

    // Store OUTSIDE public/ so files are not directly accessible
    const subDir = type === "bursary_form" ? "bursary-forms" : type === "bus_routes" ? "bus-routes" : "fees";
    const uploadDir = path.join(process.cwd(), "storage", subDir);
    await mkdir(uploadDir, { recursive: true });

    const uniqueName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const filePath = path.join(uploadDir, uniqueName);
    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));

    // Return a secure file ID (not a direct URL)
    const fileId = `${subDir}/${uniqueName}`;
    return NextResponse.json({ data: { fileId, name: file.name } }, { status: 200 });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

// Need to import prisma for user lookup
import { prisma } from "@/lib/prisma";
