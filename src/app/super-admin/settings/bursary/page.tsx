"use client";

import { useSettings } from "../SettingsContext";

export default function BursarySettingsPage() {
  const { loading, conf, message, handleBursaryFormUpload, handleDeleteBursaryForm } = useSettings();

  if (loading) return <div className="flex items-center justify-center py-12 text-sm text-zinc-400 dark:text-zinc-500">Loading...</div>;

  const hasPdf = conf["MAIN"]?.hasBursaryForm || conf["WEST"]?.hasBursaryForm;

  return (
    <main className="px-6 py-6 max-w-3xl">
      {message && (
        <div className={`p-4 rounded-lg mb-6 ${message.type === "success" ? "bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800" : "bg-red-50 dark:bg-red-950 text-red-700 border border-red-200 dark:border-red-800"}`}>{message.text}</div>
      )}

      <h1 className="text-base font-medium text-zinc-900 dark:text-zinc-100 mb-1">Bursary Form</h1>
      <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-5">Upload a bursary application PDF. The same form is shared across all campuses.</p>

      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-xl p-5">
        {hasPdf ? (
          <div className="flex items-center gap-3 mb-4">
            <span className="inline-block w-3 h-3 rounded-full bg-green-50 dark:bg-green-9500" />
            <span className="text-sm font-medium text-green-700 dark:text-green-400">Bursary form uploaded</span>
            <button onClick={() => handleDeleteBursaryForm("MAIN")} className="text-sm text-red-600 dark:text-red-400 hover:underline ml-auto">Remove</button>
          </div>
        ) : (
          <p className="text-sm text-zinc-400 dark:text-zinc-500 mb-4">No bursary form PDF uploaded.</p>
        )}
        <label className="inline-block cursor-pointer rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 transition-colors">
          {hasPdf ? "Replace PDF" : "Upload PDF"}
          <input type="file" accept=".pdf" className="hidden" onChange={e => { const file = e.target.files?.[0]; if (file) handleBursaryFormUpload("MAIN", file); e.target.value = ""; }} />
        </label>
      </div>
    </main>
  );
}
