"use client";
import { useState, useEffect } from "react";

export default function ReportingDateReminder() {
  const [missing, setMissing] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetch("/api/admin/reporting-check")
      .then(r => r.json())
      .then(d => setMissing(d.missing))
      .catch(() => setMissing(false))
      .finally(() => setChecking(false));
  }, []);

  if (checking || !missing) return null;

  return (
    <div className="mx-4 sm:mx-6 lg:mx-8 mt-4">
      <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
        <svg className="w-5 h-5 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Reporting date not set</p>
          <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
            No reporting period is configured for the current month.{" "}
            <a href="/super-admin/settings/reporting" className="underline font-medium hover:text-amber-900 dark:hover:text-amber-200">
              Set it now
            </a>{" "}
            so admission letters show the correct reporting date.
          </p>
        </div>
      </div>
    </div>
  );
}
