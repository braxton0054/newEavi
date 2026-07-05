"use client";

import { useState, useEffect } from "react";

export default function LoginHistoryPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, [page]);

  async function fetchLogs() {
    setLoading(true);
    try {
      const res = await fetch(`/api/super-admin/login-logs?page=${page}&limit=50`);
      const data = await res.json();
      if (res.ok) {
        setLogs(data.logs || []);
        setTotalPages(data.pages || 1);
      }
    } catch {} finally {
      setLoading(false);
    }
  }

  return (
    <main className="px-6 py-6 max-w-4xl">
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-xl p-5">
        <h2 className="text-base font-medium text-zinc-900 dark:text-zinc-100 mb-2">Login History</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
          Audit trail of all admin and super admin sign-ins.
        </p>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-2 border-blue-700 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : logs.length === 0 ? (
          <p className="text-sm text-zinc-400 dark:text-zinc-500 text-center py-10">
            No login activity recorded yet.
          </p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800">
                    <th className="text-left py-2.5 px-3 font-medium text-zinc-600 dark:text-zinc-400">Date/Time</th>
                    <th className="text-left py-2.5 px-3 font-medium text-zinc-600 dark:text-zinc-400">Email</th>
                    <th className="text-left py-2.5 px-3 font-medium text-zinc-600 dark:text-zinc-400">Role</th>
                    <th className="text-left py-2.5 px-3 font-medium text-zinc-600 dark:text-zinc-400">IP Address</th>
                    <th className="text-left py-2.5 px-3 font-medium text-zinc-600 dark:text-zinc-400">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log: any) => (
                    <tr key={log.id} className="border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                      <td className="py-2.5 px-3 text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-zinc-700 dark:text-zinc-300">{log.email}</td>
                      <td className="py-2.5 px-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                          log.role === "SUPER_ADMIN"
                            ? "bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-400"
                            : "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-400"
                        }`}>
                          {log.role === "SUPER_ADMIN" ? "Super Admin" : "Admin"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-zinc-500 dark:text-zinc-400 font-mono text-xs">{log.ipAddress || "—"}</td>
                      <td className="py-2.5 px-3">
                        <span className={`inline-flex items-center gap-1 ${
                          log.status === "success"
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            log.status === "success" ? "bg-green-500" : "bg-red-500"
                          }`} />
                          {log.status === "success" ? "Success" : "Failed"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-3 py-1.5 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-zinc-500 dark:text-zinc-400">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-3 py-1.5 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
