"use client";

import { useSettings } from "./SettingsContext";

export default function AdmissionPdfPage() {
  const { conf, message, setMessage } = useSettings();

  return (
    <main className="px-6 py-6 max-w-3xl">
      {message && (
        <div className={`p-4 rounded-lg mb-6 ${message.type === "success" ? "bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800" : "bg-red-50 dark:bg-red-950 text-red-700 border border-red-200 dark:border-red-800"}`}>{message.text}</div>
      )}

      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-xl p-5">
        <h2 className="text-base font-medium text-zinc-900 dark:text-zinc-100 mb-2">Admission PDF Template</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 dark:text-zinc-500 mb-4">Upload a PDF template for admission letters. Stored in the database.</p>
        {(() => {
          const hasPdf = conf["_global_"]?.hasBursaryForm;
          return (
            <>
              {hasPdf ? (
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 mb-3">
                  <span className="inline-block w-3 h-3 rounded-full bg-green-50 dark:bg-green-9500" />
                  <span className="text-sm font-medium text-green-700 dark:text-green-400">PDF template configured</span>
                  <a href="/api/admin/admission-pdf" target="_blank" className="text-sm text-blue-700 hover:underline">View PDF</a>
                  <button onClick={async () => {
                    setMessage(null);
                    try {
                      const res = await fetch("/api/admin/admission-pdf", { method: "DELETE" });
                      if (res.ok) {
                        setMessage({ type: "success", text: "Admission PDF template removed" });
                        // Force refresh by reloading the page since conf is in context
                        window.location.reload();
                      } else {
                        const d = await res.json();
                        setMessage({ type: "error", text: d.error || "Failed to remove" });
                      }
                    } catch { setMessage({ type: "error", text: "Failed to remove" }); }
                  }} className="text-sm text-red-600 dark:text-red-400 hover:underline">Remove</button>
                </div>
              ) : (
                <p className="text-sm text-zinc-400 dark:text-zinc-500 mb-3">No admission PDF template uploaded.</p>
              )}
              <label className="inline-block cursor-pointer rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 transition-colors">
                {hasPdf ? "Replace PDF" : "Upload PDF"}
                <input type="file" accept=".pdf" className="hidden" onChange={async e => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setMessage(null);
                  try {
                    const fd = new FormData();
                    fd.append("file", file);
                    const res = await fetch("/api/admin/admission-pdf", { method: "POST", body: fd });
                    const data = await res.json();
                    if (res.ok) {
                      setMessage({ type: "success", text: "Admission PDF template uploaded" });
                      window.location.reload();
                    } else {
                      setMessage({ type: "error", text: data.error || "Upload failed" });
                    }
                  } catch { setMessage({ type: "error", text: "Upload failed" }); }
                  e.target.value = "";
                }} />
              </label>
            </>
          );
        })()}
      </div>
    </main>
  );
}
