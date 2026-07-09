"use client";

import { useState, useEffect } from "react";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface Period {
  id?: string;
  year: number;
  month: number;
  startDate: string;
  endDate: string;
}

export default function ReportingDatesPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [periods, setPeriods] = useState<Period[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => { fetchDates(); }, [year]);

  async function fetchDates() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/reporting-dates");
      const d = await res.json();
      if (res.ok) {
        const all = d.data || [];
        const yearPeriods = all.filter((p: any) => p.year === year);
        // Build full 12-month list with defaults
        const filled: Period[] = MONTHS.map((_, i) => {
          const m = i + 1;
          const existing = yearPeriods.find((p: any) => p.month === m);
          return {
            year,
            month: m,
            startDate: existing?.startDate ? existing.startDate.slice(0, 10) : "",
            endDate: existing?.endDate ? existing.endDate.slice(0, 10) : "",
          };
        });
        setPeriods(filled);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  function setDate(month: number, field: "startDate" | "endDate", value: string) {
    setPeriods(prev => prev.map(p => p.month === month ? { ...p, [field]: value } : p));
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);

    // Filter to only periods with at least one date filled
    const toSave = periods.filter(p => p.startDate || p.endDate);

    try {
      const res = await fetch("/api/admin/reporting-dates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ periods: toSave }),
      });
      if (res.ok) {
        setMessage({ type: "success", text: `Reporting dates for ${year} saved` });
      } else {
        const d = await res.json();
        setMessage({ type: "error", text: d.error || "Failed to save" });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to save" });
    }
    finally { setSaving(false); }
  }

  return (
    <main className="px-4 sm:px-6 py-6 max-w-4xl">
      {message && (
        <div className={`p-4 rounded-lg mb-6 text-sm font-medium ${message.type === "success" ? "bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 dark:border-green-800" : "bg-red-50 dark:bg-red-950 text-red-700 border border-red-200 dark:border-red-800 dark:border-red-800"}`}>
          {message.text}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-base font-medium text-zinc-900 dark:text-zinc-100">Reporting Dates</h1>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">Set reporting start and end dates per month. Shared across all campuses.</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-zinc-500 dark:text-zinc-400 dark:text-zinc-500 font-medium">Year</label>
          <select
            value={year}
            onChange={e => setYear(Number(e.target.value))}
            className="rounded-lg border border-zinc-300 dark:border-zinc-600 px-3 py-1.5 text-sm bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700 outline-none"
          >
            {(() => { const cy = new Date().getFullYear(); return Array.from({ length: 10 }, (_, i) => cy - 4 + i); })().map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-zinc-400 dark:text-zinc-500">Loading...</div>
      ) : (
        <>
          {/* Desktop: table */}
          <div className="hidden sm:block bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-700">
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 dark:text-zinc-400 dark:text-zinc-500 w-32">Month</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">Report Start</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 dark:text-zinc-400 dark:text-zinc-500">Report End</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {periods.map(p => (
                  <tr key={p.month} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 dark:bg-zinc-900 transition-colors">
                    <td className="px-4 py-3 font-medium text-zinc-800 dark:text-zinc-200 text-sm">{MONTHS[p.month - 1]}</td>
                    <td className="px-4 py-3">
                      <input
                        type="date"
                        value={p.startDate}
                        onChange={e => setDate(p.month, "startDate", e.target.value)}
                        className="w-full max-w-48 rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700 outline-none"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="date"
                        value={p.endDate}
                        onChange={e => setDate(p.month, "endDate", e.target.value)}
                        className="w-full max-w-48 rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700 outline-none"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile: cards */}
          <div className="sm:hidden space-y-2">
            {periods.map(p => (
              <div key={p.month} className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-xl p-4">
                <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 mb-3">{MONTHS[p.month - 1]}</p>
                <div className="space-y-2">
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 dark:text-zinc-500 mb-1">Report Start</label>
                    <input type="date" value={p.startDate} onChange={e => setDate(p.month, "startDate", e.target.value)}
                      className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700 outline-none" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 dark:text-zinc-500 mb-1">Report End</label>
                    <input type="date" value={p.endDate} onChange={e => setDate(p.month, "endDate", e.target.value)}
                      className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700 outline-none" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-between">
            <p className="text-xs text-zinc-400 dark:text-zinc-500">{periods.filter(p => p.startDate || p.endDate).length} / 12 months configured</p>
            <button onClick={handleSave} disabled={saving}
              className="rounded-lg bg-blue-700 px-5 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-50 transition-colors">
              {saving ? "Saving..." : "Save All Dates"}
            </button>
          </div>
        </>
      )}
    </main>
  );
}
