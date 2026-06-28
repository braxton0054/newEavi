"use client";

import { useSettings } from "../SettingsContext";

export default function BursarySettingsPage() {
  const { loading, form, message, handleBursaryFormUpload, handleDeleteBursaryForm } = useSettings();

  if (loading) return <div className="flex items-center justify-center py-12 text-sm text-zinc-400">Loading...</div>;

  const f = form["MAIN"] || { bursaryFormPdf: null };
  const hasPdf = f.bursaryFormPdf !== null;

  return (
    <main className="px-6 py-6 max-w-3xl">
      {message && (
        <div className={`p-4 rounded-lg mb-6 ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>{message.text}</div>
      )}

      <h1 className="text-base font-medium text-zinc-900 mb-1">Bursary Form</h1>
      <p className="text-xs text-zinc-400 mb-5">Upload a bursary application PDF form. Shared across all campuses.</p>

      <div className="bg-white border border-zinc-200 rounded-xl p-5">
        {hasPdf ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 mb-3">
            <span className="inline-block w-3 h-3 rounded-full bg-green-500" />
            <span className="text-sm font-medium text-green-700">Bursary form configured</span>
            <a href={f.bursaryFormPdf || ""} target="_blank" className="text-sm text-blue-700 hover:underline">View PDF</a>
            <button onClick={() => handleDeleteBursaryForm("MAIN")} className="text-sm text-red-600 hover:underline">Remove</button>
          </div>
        ) : (
          <p className="text-sm text-zinc-400 mb-3">No bursary form PDF uploaded.</p>
        )}
        <label className="inline-block cursor-pointer rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 transition-colors">
          {hasPdf ? "Replace PDF" : "Upload PDF"}
          <input type="file" accept=".pdf" className="hidden" onChange={e => { const file = e.target.files?.[0]; if (file) handleBursaryFormUpload("MAIN", file); e.target.value = ""; }} />
        </label>
      </div>
    </main>
  );
}
