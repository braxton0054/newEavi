import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const courses = await prisma.course.findMany({
      orderBy: { name: "asc" },
      include: { qualifications: { orderBy: { qualificationType: "asc" } } },
    });
    return NextResponse.json({ data: courses }, { status: 200 });
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
    const { name, feePdf, qualifications } = body;

    if (!name) {
      return NextResponse.json({ error: "Course name is required" }, { status: 400 });
    }

    if (!qualifications || !Array.isArray(qualifications) || qualifications.length === 0) {
      return NextResponse.json({ error: "At least one qualification is required" }, { status: 400 });
    }

    for (const q of qualifications) {
      if ((!q.qualificationType && !q.qualificationLevel) || !q.minGrade) {
        return NextResponse.json(
          { error: "Each qualification needs a category or level, plus min grade" },
          { status: 400 }
        );
      }
    }

    const course = await prisma.course.create({
      data: {
        name,
        feePdf: feePdf || null,
        qualifications: {
          create: qualifications.map((q: { qualificationType?: string; qualificationLevel?: string; minGrade: string }) => ({
            qualificationType: q.qualificationType || null,
            qualificationLevel: q.qualificationLevel || null,
            minGrade: q.minGrade,
          })),
        },
      },
      include: { qualifications: true },
    });

    return NextResponse.json({ data: course }, { status: 201 });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "A course with this name already exists" }, { status: 409 });
    }
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
    const { id, name, feePdf, qualifications } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing course id" }, { status: 400 });
    }

    const existing = await prisma.course.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    if (!qualifications || !Array.isArray(qualifications) || qualifications.length === 0) {
      return NextResponse.json({ error: "At least one qualification is required" }, { status: 400 });
    }

    for (const q of qualifications) {
      if ((!q.qualificationType && !q.qualificationLevel) || !q.minGrade) {
        return NextResponse.json(
          { error: "Each qualification needs a category or level, plus min grade" },
          { status: 400 }
        );
      }
    }

    const course = await prisma.course.update({
      where: { id },
      data: {
        name: name !== undefined ? name : undefined,
        feePdf: feePdf !== undefined ? (feePdf || null) : undefined,
        qualifications: {
          deleteMany: {},
          create: qualifications.map((q: { qualificationType?: string; qualificationLevel?: string; minGrade: string }) => ({
            qualificationType: q.qualificationType || null,
            qualificationLevel: q.qualificationLevel || null,
            minGrade: q.minGrade,
          })),
        },
      },
      include: { qualifications: true },
    });

    return NextResponse.json({ data: course }, { status: 200 });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "A course with this name already exists" }, { status: 409 });
    }
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

    await prisma.course.delete({ where: { id } });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
