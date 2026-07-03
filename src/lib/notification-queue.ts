import { prisma } from "@/lib/prisma";
import { sendApprovalNotifications } from "@/lib/auto-notify";

const JOB_TIMEOUT = 60_000; // 60s before a PROCESSING job is considered stuck
const POLL_INTERVAL = 5_000; // check every 5s
const MAX_RETRIES = 3;

let processorTimer: ReturnType<typeof setInterval> | null = null;

export async function enqueueNotification(studentId: string) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { applications: { orderBy: { createdAt: "desc" }, take: 1 } },
  });

  if (!student || !student.preferredCampus) return;

  const name = [student.firstName, student.middleName, student.lastName]
    .filter(Boolean)
    .join(" ");

  const course = student.applications[0]?.course || "";

  await prisma.notificationJob.create({
    data: {
      studentId: student.id,
      studentName: name,
      course,
      campus: student.preferredCampus,
      status: "PENDING",
    },
  });
}

async function processNextJob() {
  try {
    // Pick the oldest PENDING job
    const job = await prisma.notificationJob.findFirst({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
    });

    if (!job) return;

    // Also release any stuck PROCESSING jobs (server restarted mid-job)
    await prisma.notificationJob.updateMany({
      where: {
        status: "PROCESSING",
        startedAt: { lte: new Date(Date.now() - JOB_TIMEOUT) },
      },
      data: {
        status: "PENDING",
        attempts: { increment: 1 },
        lastError: "Job timed out (stuck for over 60s)",
      },
    });

    // Mark as PROCESSING
    await prisma.notificationJob.update({
      where: { id: job.id },
      data: { status: "PROCESSING", startedAt: new Date() },
    });

    const result = await sendApprovalNotifications(job.studentId);

    const succeeded = result.whatsapp || result.email || result.sms;
    const errorMessages = result.errors.join("; ");

    if (succeeded) {
      await prisma.notificationJob.update({
        where: { id: job.id },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
        },
      });
    } else if (job.attempts + 1 >= MAX_RETRIES) {
      await prisma.notificationJob.update({
        where: { id: job.id },
        data: {
          status: "FAILED",
          lastError: errorMessages || "All delivery methods failed",
          completedAt: new Date(),
        },
      });
    } else {
      // Retry
      await prisma.notificationJob.update({
        where: { id: job.id },
        data: {
          status: "PENDING",
          attempts: { increment: 1 },
          lastError: errorMessages || "All delivery methods failed",
        },
      });
    }
  } catch (err: any) {
    console.error("[Queue] Processor error:", err.message);
  }
}

export function startQueueProcessor() {
  if (processorTimer) return;
  console.log("[Queue] Notification processor started (every 5s)");
  processorTimer = setInterval(processNextJob, POLL_INTERVAL);
  // Fire immediately too
  processNextJob();
}

export function stopQueueProcessor() {
  if (processorTimer) {
    clearInterval(processorTimer);
    processorTimer = null;
    console.log("[Queue] Notification processor stopped");
  }
}

export async function getQueueStats() {
  const [pending, processing, completed, failed, recent] = await Promise.all([
    prisma.notificationJob.count({ where: { status: "PENDING" } }),
    prisma.notificationJob.count({ where: { status: "PROCESSING" } }),
    prisma.notificationJob.count({ where: { status: "COMPLETED" } }),
    prisma.notificationJob.count({ where: { status: "FAILED" } }),
    prisma.notificationJob.findMany({
      where: {},
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  return { pending, processing, completed, failed, recent };
}
