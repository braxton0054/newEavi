import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { audit } from "@/lib/audit";
export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest) {
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
    const { applicationId, status, notes } = body;

    if (!applicationId || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!["APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { student: true },
    });

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    if (user.role === "ADMIN" && user.campus !== application.student.preferredCampus) {
      return NextResponse.json({ error: "You can only review applications from your campus" }, { status: 403 });
    }

    const updated = await prisma.application.update({
      where: { id: applicationId },
      data: {
        status,
        notes: notes || null,
        reviewedBy: user.id,
      },
    });

    await prisma.student.update({
      where: { id: application.studentId },
      data: { status },
    });

    // Audit log
    const action = status === "APPROVED" ? "student.approve" : "student.reject";
    audit({
      userId: user.id,
      email: user.email,
      role: user.role,
      campus: user.campus || null,
      action,
      target: `${application.student.firstName} ${application.student.lastName} (${application.studentId})`,
      detail: JSON.stringify({ course: application.course, notes: notes || null }),
    });

    // If approved, send notifications in the background
    if (status === "APPROVED") {
      const { sendApprovalNotifications } = await import("@/lib/auto-notify");
      sendApprovalNotifications(application.studentId)
        .then((result) => {
          console.log(
            `Approval notifications for ${application.studentId}:`,
            JSON.stringify(result)
          );
          if (result.errors.length > 0) {
            console.error("Notification errors:", result.errors.join("; "));
          }
        })
        .catch((err) => {
          console.error("Notification failed:", err);
        });
    }

    return NextResponse.json({ data: updated }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
