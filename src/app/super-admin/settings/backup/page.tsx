"use client";

import { useState, useRef } from "react";

export default function BackupPage() {
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleExport() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/super-admin/backup/export");
      if (!res.ok) {
        const err = await res.json();
        setMessage({ type: "error", text: err.error || "Export failed" });
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `eavi-backup-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setMessage({ type: "success", text: "Backup downloaded successfully" });
    } catch (e) {
      setMessage({ type: "error", text: "Export failed" });
    } finally {
      setLoading(false);
    }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setMessage(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/super-admin/backup/import", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: "success", text: data.message || "Import completed" });
      } else {
        setMessage({ type: "error", text: data.error || "Import failed" });
      }
    } catch {
      setMessage({ type: "error", text: "Import failed" });
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <main className="px-6 py-6 max-w-3xl">
      {message && (
        <div className={`p-4 rounded-lg mb-6 text-sm ${
          message.type === "success"
            ? "bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800"
            : "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800"
        }`}>
          {message.text}
        </div>
      )}

      {/* Export */}
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-xl p-5 mb-6">
        <h2 className="text-base font-medium text-zinc-900 dark:text-zinc-100 mb-2">Export Backup</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
          Download all system data as a JSON file. Excludes authentication sessions and passwords.
        </p>
        <button
          onClick={handleExport}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export Backup
            </>
          )}
        </button>
      </div>

      {/* Import */}
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-xl p-5">
        <h2 className="text-base font-medium text-zinc-900 dark:text-zinc-100 mb-2">Import Backup</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
          Upload a previously exported backup JSON file. Existing records with matching IDs will be updated.
        </p>
        <label className={`inline-flex items-center gap-2 rounded-lg bg-zinc-800 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer ${importing ? "opacity-50 cursor-not-allowed" : ""}`}>
          {importing ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Importing...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Upload Backup File
            </>
          )}
          <input
            ref={fileRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            disabled={importing}
            className="hidden"
          />
        </label>
        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-3">
          Warning: Importing will overwrite existing records. The database will not be cleared beforehand — use with caution.
        </p>
      </div>
    </main>
  );
}
