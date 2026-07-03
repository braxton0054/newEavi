"use client";

import { useState, useEffect } from "react";

interface QueueStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  total: number;
  recent: any[];
}

export default function NotificationQueueStatus() {
  const [stats, setStats] = useState<QueueStats | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch("/api/admin/notification-queue")
      .then(r => r.json())
      .then(d => { if (d.total !== undefined) setStats(d); })
      .catch(() => {});
  }, []);

  if (!stats || (stats.pending === 0 && stats.failed === 0 && stats.processing === 0)) {
    return null;
  }

  const totalPending = stats.pending + stats.processing;

  return (
    <div className="mb-6">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between bg-white rounded-xl border border-zinc-100 p-3 sm:p-4 hover:border-zinc-200 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-900">
              {totalPending > 0
                ? `${totalPending} notification${totalPending > 1 ? "s" : ""} pending`
                : `${stats.failed} failed notification${stats.failed > 1 ? "s" : ""}`}
            </p>
            <p className="text-xs text-zinc-400">
              {stats.completed} sent · {stats.failed} failed
            </p>
          </div>
        </div>
        <svg className={`w-4 h-4 text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && stats.recent.length > 0 && (
        <div className="mt-2 bg-white rounded-xl border border-zinc-100 overflow-hidden">
          {stats.recent
            .filter((j: any) => j.status === "FAILED" || j.status === "PENDING")
            .slice(0, 5)
            .map((job: any) => (
              <div key={job.id} className="flex items-center justify-between px-4 py-3 border-b border-zinc-50 last:border-0">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-zinc-900 truncate">{job.studentName}</p>
                  <p className="text-xs text-zinc-400 truncate">{job.course}</p>
                  {job.lastError && (
                    <p className="text-xs text-red-500 mt-0.5 truncate">{job.lastError}</p>
                  )}
                </div>
                <span className={`ml-3 shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                  job.status === "FAILED"
                    ? "bg-red-50 text-red-700 border border-red-200"
                    : "bg-amber-50 text-amber-700 border border-amber-200"
                }`}>
                  {job.status === "FAILED" ? "Failed" : "Pending"}
                </span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
