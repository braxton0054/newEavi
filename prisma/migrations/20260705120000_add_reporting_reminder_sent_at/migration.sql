-- Add tracking column so each application is only ever reminded once per admission cycle
ALTER TABLE "applications" ADD COLUMN "reportingReminderSentAt" TIMESTAMP(3);

CREATE INDEX "applications_status_reportingReminderSentAt_idx" ON "applications"("status", "reportingReminderSentAt");

-- Add campus column to reporting_periods so reminders can target the right campus
ALTER TABLE "reporting_periods" ADD COLUMN "campus" "Campus";

DROP INDEX IF EXISTS "reporting_periods_year_month_key";
CREATE UNIQUE INDEX "reporting_periods_year_month_campus_key" ON "reporting_periods"("year", "month", "campus");
