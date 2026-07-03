import { prisma } from "@/lib/prisma";

/**
 * Get the nearest reporting start date — checks current active period first,
 * then falls back to the next upcoming period.
 */
export async function getUpcomingReportingDate(): Promise<string> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // First: check if there's an active period where today falls within range
    const active = await prisma.reportingPeriod.findFirst({
      where: {
        startDate: { lte: today },
        endDate: { gte: today },
      },
      orderBy: { startDate: "asc" },
    });

    if (active?.startDate) {
      return active.startDate.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    }

    // Second: try the next upcoming period
    const next = await prisma.reportingPeriod.findFirst({
      where: {
        startDate: { gte: today },
      },
      orderBy: { startDate: "asc" },
    });

    if (next?.startDate) {
      return next.startDate.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    }

    return "To be communicated";
  } catch {
    return "To be communicated";
  }
}
