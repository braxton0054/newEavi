export function getUpcomingReportingDate(reportingDates: { month: string; startDate: string; endDate: string }[]): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcoming = reportingDates
    .filter(d => d.startDate && new Date(d.startDate) >= today)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  const next = upcoming[0]?.startDate;
  if (!next) return "To be communicated";
  return new Date(next).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
