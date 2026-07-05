"use client";

import { useSettings } from "../SettingsContext";

export default function AdmissionsSettingsPage() {
  const { loading, saving, form, message, setField, handleSave } = useSettings();

  if (loading) return <div className="flex items-center justify-center py-12 text-sm text-zinc-400 dark:text-zinc-500">Loading...</div>;

  return (
    <main className="px-6 py-6 max-w-3xl">
      {message && (
        <div className={`p-4 rounded-lg mb-6 ${message.type === "success" ? "bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 dark:border-green-800" : "bg-red-50 dark:bg-red-950 text-red-700 border border-red-200 dark:border-red-800 dark:border-red-800"}`}>{message.text}</div>
      )}

      <h1 className="text-base font-medium text-zinc-900 dark:text-zinc-100 mb-1">Admission Number Configuration</h1>
      <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-5">Set the admission number format and starting number for each campus.</p>

      {["MAIN", "WEST"].map(campus => {
        const f = form[campus] || { admissionFormat: "", admissionStart: 1 };
        const isSaving = saving[campus];

        return (
          <div key={campus} className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-xl p-5 mb-4">
            <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-4">{campus === "MAIN" ? "Main Campus" : "West Campus"}</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Admission Number Format</label>
                <input type="text" value={f.admissionFormat} onChange={e => setField(campus, "admissionFormat", e.target.value)} placeholder={`EAVI/${campus}/${new Date().getFullYear()}/`} className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700" />
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">Prefix before auto-increment number. e.g. EAVI/{campus}/{new Date().getFullYear()}/</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Starting Number</label>
                <input type="number" value={f.admissionStart} onChange={e => setField(campus, "admissionStart", Number(e.target.value))} min="1" className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700" />
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">Next admission number based on where manual admissions have reached.</p>
              </div>
            </div>
            <button onClick={() => handleSave(campus, "Admission", { email: form[campus]?.email || "", admissionFormat: f.admissionFormat, admissionStart: f.admissionStart })} disabled={isSaving === "Admission"} className="mt-4 rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-50 transition-colors">
              {isSaving === "Admission" ? "Saving..." : "Save admissions"}
            </button>
          </div>
        );
      })}
    </main>
  );
}
