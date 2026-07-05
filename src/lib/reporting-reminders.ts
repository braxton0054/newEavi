import { prisma } from "@/lib/prisma";
import { sendText } from "@/lib/whatsapp";
import { sendSms, type SmsConfig } from "@/lib/sms";
import { decrypt } from "@/lib/encryption";
import type { Campus } from "@/types";

const REMINDER_LEAD_DAYS = 4;

interface ReminderResult {
  studentId: string;
  studentName: string;
  phone: string | null;
  whatsapp: boolean;
  sms: boolean;
  errors: string[];
}

function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function addDays(d: Date, days: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + days);
  return copy;
}

/**
 * Runs the reporting-date reminder sweep.
 *
 * For every ReportingPeriod whose startDate is exactly REMINDER_LEAD_DAYS
 * from today, find APPROVED students on that campus who haven't been
 * reminded yet for their current application, and send them a WhatsApp
 * text + SMS nudging them to report.
 *
 * Safe to call repeatedly (e.g. every few hours) — reportingReminderSentAt
 * guarantees each student is only ever messaged once per admission cycle.
 */
export async function runReportingReminders(): Promise<{
  periodsChecked: number;
  remindersSent: number;
  results: ReminderResult[];
}> {
  const targetDate = startOfDay(addDays(new Date(), REMINDER_LEAD_DAYS));
  const nextDay = addDays(targetDate, 1);

  // Reporting periods that start exactly 4 days from today
  const periods = await prisma.reportingPeriod.findMany({
    where: {
      startDate: { gte: targetDate, lt: nextDay },
    },
  });

  const results: ReminderResult[] = [];

  for (const period of periods) {
    const campus = period.campus as Campus;

    // Approved students on this campus, whose current application hasn't
    // been reminded yet for this cycle
    const students = await prisma.student.findMany({
      where: {
        preferredCampus: campus,
        status: "APPROVED",
        applications: {
          some: {
            status: "APPROVED",
            reportingReminderSentAt: null,
          },
        },
      },
      include: {
        applications: {
          where: { status: "APPROVED" },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (students.length === 0) continue;

    // Campus SMS config (same pattern as auto-notify.ts)
    const campusSetting = await prisma.campusSetting.findUnique({ where: { campus } });
    const settings = (campusSetting?.settings as any) || {};
    const smsConfig: SmsConfig = {
      apiKey: settings.smsApiKey ? decrypt(settings.smsApiKey) : "",
      apiSecret: settings.smsApiSecret ? decrypt(settings.smsApiSecret) : "",
      baseUrl: settings.smsBaseUrl || "https://api.sms-gate.app/3rdparty/v1",
      enabled: !!settings.smsEnabled,
    };

    const campusName = campus === "MAIN" ? "Main Campus" : "West Campus";
    const reportDateLabel = period.startDate?.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }) || "TBD";

    for (const student of students) {
      const application = student.applications[0];
      if (!application) continue;

      const studentName = [student.firstName, student.middleName, student.lastName]
        .filter(Boolean)
        .join(" ");

      const result: ReminderResult = {
        studentId: student.id,
        studentName,
        phone: student.phone,
        whatsapp: false,
        sms: false,
        errors: [],
      };

      if (!student.phone) {
        result.errors.push("No phone number on file");
        results.push(result);
        continue;
      }

      const message =
        `📢 Reminder: Hi ${studentName}, your reporting date to EAVI College - ${campusName} ` +
        `for ${application.course} is on ${reportDateLabel} (in ${REMINDER_LEAD_DAYS} days). ` +
        `Please have your admission letter, required documents, and fee payment ready. See you soon!`;

      try {
        result.whatsapp = await sendText(campus, student.phone, message);
        if (!result.whatsapp) result.errors.push("WhatsApp send failed or not connected");
      } catch (err) {
        result.errors.push(`WhatsApp error: ${(err as Error).message}`);
      }

      if (smsConfig.enabled) {
        try {
          await sendSms(smsConfig, student.phone, message);
          result.sms = true;
        } catch (err) {
          result.errors.push(`SMS error: ${(err as Error).message}`);
        }
      }

      // Mark reminded regardless of delivery outcome so we never spam on
      // retries — delivery failures should be visible in errors/logs, not
      // resolved by silently re-sending every few hours.
      await prisma.application.update({
        where: { id: application.id },
        data: { reportingReminderSentAt: new Date() },
      });

      results.push(result);
    }
  }

  const remindersSent = results.filter((r) => r.whatsapp || r.sms).length;
  return { periodsChecked: periods.length, remindersSent, results };
}
