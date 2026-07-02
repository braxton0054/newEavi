"use client";

import { useSettings } from "../SettingsContext";
import ReportingDatesEditor from "@/components/ReportingDatesEditor";

export default function ReportingSettingsPage() {
  const { loading, saving, form, message, setField, handleSave } = useSettings();

  if (loading) return <div className="flex items-center justify-center py-12 text-sm text-zinc-400">Loading...</div>;

  return (
    <main className="px-6 py-6 max-w-3xl">
      {message && (
        <div className={`p-4 rounded-lg mb-6 ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>{message.text}</div>
      )}

      <h1 className="text-base font-medium text-zinc-900 mb-1">Reporting Dates</h1>
      <p className="text-xs text-zinc-400 mb-5">Set reporting start and end dates for each month — {new Date().getFullYear()}-{new Date().getFullYear() + 1}.</p>

      {["MAIN", "WEST"].map(campus => {
        const f = form[campus] || { reportingDates: [] };
        const isSaving = saving[campus];

        return (
          <div key={campus} className="bg-white border border-zinc-200 rounded-xl p-5 mb-4">
            <h2 className="text-sm font-medium text-zinc-900 mb-4">{campus === "MAIN" ? "Main Campus" : "West Campus"}</h2>
            <ReportingDatesEditor year={new Date().getFullYear()} dates={f.reportingDates} onChange={v => setField(campus, "reportingDates", v)} />
            <button onClick={() => handleSave(campus, "Reporting", { email: form[campus]?.email || "", reportingDates: f.reportingDates })} disabled={isSaving === "Reporting"} className="mt-4 rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-50 transition-colors">
              {isSaving === "Reporting" ? "Saving..." : "Save reporting dates"}
            </button>
          </div>
        );
      })}
    </main>
  );
}
