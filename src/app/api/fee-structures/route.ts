import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const structures = await prisma.feeStructure.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, url: true, _count: { select: { courses: true } } },
    });
    return NextResponse.json({ data: structures }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user || user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { name, url, pdfData } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (!url && !pdfData) {
      return NextResponse.json({ error: "File URL or PDF data is required" }, { status: 400 });
    }

    let pdfBuffer: Buffer | null = null;
    if (pdfData) {
      const base64 = pdfData.replace(/^data:application\/pdf;base64,/, "");
      pdfBuffer = Buffer.from(base64, "base64");
    }

    const existing = await prisma.feeStructure.findFirst({ where: { name } });

    let structure;
    if (existing) {
      structure = await prisma.feeStructure.update({
        where: { id: existing.id },
        data: { url: url || existing.url, pdfData: pdfBuffer ?? existing.pdfData },
      });
    } else {
      structure = await prisma.feeStructure.create({
        data: { name, url: url || null, pdfData: pdfBuffer },
      });
    }

    return NextResponse.json({ data: structure }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user || user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { id, name, pdfData } = body;

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (pdfData) {
      const base64 = pdfData.replace(/^data:application\/pdf;base64,/, "");
      updateData.pdfData = Buffer.from(base64, "base64");
    }

    const structure = await prisma.feeStructure.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ data: structure }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user || user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    await prisma.feeStructure.delete({ where: { id } });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
