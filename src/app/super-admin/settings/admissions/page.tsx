"use client";

import { useSettings } from "../SettingsContext";

export default function AdmissionsSettingsPage() {
  const { loading, saving, form, message, setField, handleSave } = useSettings();

  if (loading) return <div className="flex items-center justify-center py-12 text-sm text-zinc-400">Loading...</div>;

  return (
    <main className="px-6 py-6 max-w-3xl">
      {message && (
        <div className={`p-4 rounded-lg mb-6 ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>{message.text}</div>
      )}

      <h1 className="text-base font-medium text-zinc-900 mb-1">Admission Number Configuration</h1>
      <p className="text-xs text-zinc-400 mb-5">Set the admission number format and starting number for each campus.</p>

      {["MAIN", "WEST"].map(campus => {
        const f = form[campus] || { admissionFormat: "", admissionStart: 1 };
        const isSaving = saving[campus];

        return (
          <div key={campus} className="bg-white border border-zinc-200 rounded-xl p-5 mb-4">
            <h2 className="text-sm font-medium text-zinc-900 mb-4">{campus === "MAIN" ? "Main Campus" : "West Campus"}</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Admission Number Format</label>
                <input type="text" value={f.admissionFormat} onChange={e => setField(campus, "admissionFormat", e.target.value)} placeholder={`EAVI/${campus}/2026/`} className="w-full rounded-lg border border-zinc-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700" />
                <p className="text-xs text-zinc-400 mt-1">Prefix before auto-increment number. e.g. EAVI/{campus}/2026/</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Starting Number</label>
                <input type="number" value={f.admissionStart} onChange={e => setField(campus, "admissionStart", Number(e.target.value))} min="1" className="w-full rounded-lg border border-zinc-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700" />
                <p className="text-xs text-zinc-400 mt-1">Next admission number based on where manual admissions have reached.</p>
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
