import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { audit } from "@/lib/audit";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const url = new URL(req.url);
    const campus = url.searchParams.get("campus");

    let where: any = {};
    if (user.role === "ADMIN" && user.campus) {
      where = { preferredCampus: user.campus };
    } else if (campus) {
      where = { preferredCampus: campus as "MAIN" | "WEST" };
    }

    const students = await prisma.student.findMany({
      where,
      include: { applications: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ data: students }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { id, firstName, middleName, lastName, gender, phone, email, educationQualification, preferredCampus, status } = body;

    if (!id) {
      return NextResponse.json({ error: "Student ID is required" }, { status: 400 });
    }

    const existing = await prisma.student.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // ADMIN can only edit students from their own campus
    if (user.role === "ADMIN" && user.campus && existing.preferredCampus !== user.campus) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updateData: any = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (middleName !== undefined) updateData.middleName = middleName || null;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (gender !== undefined) updateData.gender = gender || null;
    if (phone !== undefined) updateData.phone = phone || null;
    if (email !== undefined) updateData.email = email || null;
    if (educationQualification !== undefined) updateData.educationQualification = educationQualification || null;
    if (preferredCampus !== undefined) updateData.preferredCampus = preferredCampus;
    if (status !== undefined) updateData.status = status;

    const student = await prisma.student.update({
      where: { id },
      data: updateData,
      include: { applications: true },
    });

    return NextResponse.json({ data: student }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user || user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    // Delete applications first (foreign key constraint)
    const student = await prisma.student.findUnique({ where: { id } });
    await prisma.application.deleteMany({ where: { studentId: id } });
    await prisma.student.delete({ where: { id } });

    audit({
      userId: user.id,
      email: user.email,
      role: user.role,
      campus: user.campus || null,
      action: "student.delete",
      target: student ? `${student.firstName} ${student.lastName} (${id})` : id,
      detail: student ? JSON.stringify({ email: student.email, phone: student.phone }) : null,
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
