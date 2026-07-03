import { prisma } from "@/lib/prisma";

/**
 * Get the next upcoming reporting start date from the shared ReportingPeriod model.
 */
export async function getUpcomingReportingDate(): Promise<string> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const next = await prisma.reportingPeriod.findFirst({
      where: {
        startDate: { gte: today },
      },
      orderBy: { startDate: "asc" },
    });

    if (!next?.startDate) return "To be communicated";

    return next.startDate.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "To be communicated";
  }
}
