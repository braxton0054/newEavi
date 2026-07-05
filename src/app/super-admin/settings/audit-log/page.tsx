"use client";

import { useState, useEffect } from "react";

const ACTION_LABELS: Record<string, string> = {
  "student.approve": "Approved Application",
  "student.reject": "Rejected Application",
  "student.delete": "Deleted Student",
  "pdf.upload": "Uploaded PDF Template",
  "pdf.delete": "Deleted PDF Template",
  "email.change": "Changed Email",
  "fee.create": "Created Fee Structure",
  "fee.update": "Updated Fee Structure",
  "fee.delete": "Deleted Fee Structure",
  "seed.run": "Seeded Database",
  "backup.import": "Imported Backup",
};

const ACTION_COLORS: Record<string, string> = {
  "student.approve": "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950",
  "student.reject": "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950",
  "student.delete": "text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950",
  "pdf.upload": "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950",
  "pdf.delete": "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950",
  "email.change": "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950",
};

export default function AuditLogPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("");

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter]);

  async function fetchLogs() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "50" });
      if (actionFilter) params.set("action", actionFilter);
      const res = await fetch(`/api/super-admin/audit-logs?${params}`);
      const data = await res.json();
      if (res.ok) {
        setLogs(data.logs || []);
        setTotalPages(data.pages || 1);
      }
    } catch {} finally {
      setLoading(false);
    }
  }

  const uniqueActions = [...new Set(logs.map((l: any) => l.action))];

  return (
    <main className="px-6 py-6 max-w-5xl">
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-medium text-zinc-900 dark:text-zinc-100">Audit Trail</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
              All admin actions — approvals, deletions, uploads, and changes.
            </p>
          </div>
          {uniqueActions.length > 1 && (
            <select
              value={actionFilter}
              onChange={e => { setActionFilter(e.target.value); setPage(1); }}
              className="text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 dark:bg-zinc-900 dark:text-zinc-100"
            >
              <option value="">All actions</option>
              {uniqueActions.map(a => (
                <option key={a} value={a}>{ACTION_LABELS[a] || a}</option>
              ))}
            </select>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-2 border-blue-700 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : logs.length === 0 ? (
          <p className="text-sm text-zinc-400 dark:text-zinc-500 text-center py-10">
            No audit logs yet.
          </p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800">
                    <th className="text-left py-2.5 px-3 font-medium text-zinc-600 dark:text-zinc-400">Date/Time</th>
                    <th className="text-left py-2.5 px-3 font-medium text-zinc-600 dark:text-zinc-400">Admin</th>
                    <th className="text-left py-2.5 px-3 font-medium text-zinc-600 dark:text-zinc-400">Action</th>
                    <th className="text-left py-2.5 px-3 font-medium text-zinc-600 dark:text-zinc-400">Target</th>
                    <th className="text-left py-2.5 px-3 font-medium text-zinc-600 dark:text-zinc-400">Campus</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log: any) => (
                    <tr key={log.id} className="border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                      <td className="py-2.5 px-3 text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="text-zinc-700 dark:text-zinc-300">{log.email}</div>
                        <div className="text-[11px] text-zinc-400 dark:text-zinc-500">{log.role}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${ACTION_COLORS[log.action] || "text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800"}`}>
                          {ACTION_LABELS[log.action] || log.action}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-zinc-700 dark:text-zinc-300 text-xs max-w-[200px] truncate" title={log.target}>
                        {log.target}
                      </td>
                      <td className="py-2.5 px-3 text-zinc-500 dark:text-zinc-400 text-xs">
                        {log.campus || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-3 py-1.5 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed"
                >Previous</button>
                <span className="text-sm text-zinc-500 dark:text-zinc-400">Page {page} of {totalPages}</span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-3 py-1.5 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed"
                >Next</button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
