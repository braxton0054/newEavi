import { NextRequest, NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import path from "path";
import { auth } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    // AUTH CHECK: require valid session
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { path: filePath } = await params;
    const fileId = filePath.join("/");

    // Prevent path traversal attacks
    if (fileId.includes("..") || fileId.startsWith("/")) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }

    const fullPath = path.join(process.cwd(), "storage", fileId);

    // Verify file exists and is within storage directory
    try {
      const fileStat = await stat(fullPath);
      if (!fileStat.isFile()) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
    } catch {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const buffer = await readFile(fullPath);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${path.basename(fullPath)}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("File serve error:", error);
    return NextResponse.json({ error: "Failed to serve file" }, { status: 500 });
  }
}
