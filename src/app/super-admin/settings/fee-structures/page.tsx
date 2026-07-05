"use client";

import { useState, useEffect } from "react";

interface FeeStructure {
  id: string;
  name: string;
  url: string | null;
  pdfData: string | null;
  _count: { courses: number };
}

export default function FeeStructuresPage() {
  const [structures, setStructures] = useState<FeeStructure[]>([]);
  const [loading, setLoading] = useState(true);

  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  useEffect(() => { fetchStructures(); }, []);

  async function fetchStructures() {
    try {
      const res = await fetch("/api/fee-structures");
      const data = await res.json();
      if (res.ok) setStructures(data.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  function readFileAsBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function handleSingleUpload(file: File) {
    const name = file.name.replace(/\.pdf$/i, "");
    const pdfData = await readFileAsBase64(file);
    const res = await fetch("/api/fee-structures", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, pdfData }),
    });
    if (!res.ok) {
      const d = await res.json();
      throw new Error(d.error || "Upload failed");
    }
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (files.length === 0) return;
    setUploading(true);
    try {
      for (const file of files) {
        await handleSingleUpload(file);
      }
      setFiles([]);
      await fetchStructures();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setUploading(false);
    }
  }

  async function handleRename(id: string, newName: string) {
    if (!newName.trim()) return;
    try {
      const res = await fetch("/api/fee-structures", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, name: newName.trim() }),
      });
      if (res.ok) {
        setRenamingId(null);
        await fetchStructures();
      } else {
        const d = await res.json();
        alert(d.error || "Rename failed");
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this fee structure? Courses using it will lose the reference.")) return;
    await fetch(`/api/fee-structures?id=${id}`, { method: "DELETE" });
    await fetchStructures();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files || []);
    if (selected.length > 15) {
      alert("Maximum 15 files at once");
      return;
    }
    const pdfs = selected.filter(f => f.name.toLowerCase().endsWith(".pdf"));
    if (pdfs.length !== selected.length) {
      alert("Only PDF files are allowed");
      return;
    }
    setFiles(pdfs);
  }

  function removeFile(index: number) {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }

  if (loading) return (
    <div className="flex items-center justify-center py-12">
      <div className="w-7 h-7 border-2 border-blue-700 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <>
      <header className="bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-700 px-6 lg:px-8 py-3.5 sticky top-0 z-30">
        <div className="flex items-center justify-between">
          <div className="lg:pl-0 pl-10">
            <h1 className="text-base font-medium text-zinc-900 dark:text-zinc-100">Fee Structures</h1>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">Upload reusable fee structure PDFs (stored in database)</p>
          </div>
          <span className="text-[11px] text-zinc-400 dark:text-zinc-500">{structures.length} file{structures.length !== 1 ? "s" : ""}</span>
        </div>
      </header>

      <main className="px-6 lg:px-8 py-6 max-w-4xl">
        <form onSubmit={handleUpload} className="bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-700 p-5 mb-5">
          <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1">Upload fee structures</h2>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-4">Select up to 15 PDF files — they will all be uploaded at once</p>
          <div className="mb-4">
            <label className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 dark:text-zinc-500 mb-1">PDF files *</label>
            <input
              type="file"
              accept=".pdf"
              multiple
              onChange={handleFileChange}
              className="w-full text-xs text-zinc-500 dark:text-zinc-400 dark:text-zinc-500 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-blue-50 dark:bg-blue-950 dark:file:bg-blue-950 file:text-blue-700 hover:file:bg-blue-100 dark:hover:file:bg-blue-900"
            />
          </div>

          {files.length > 0 && (
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/40 dark:bg-blue-950/40 rounded-lg border border-blue-100 dark:border-blue-900">
              <p className="text-[11px] font-medium text-blue-700 mb-2">{files.length} file{files.length !== 1 ? "s" : ""} selected</p>
              <div className="space-y-1">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400 dark:text-zinc-500">
                    <span className="truncate">{f.name}</span>
                    <button type="button" onClick={() => removeFile(i)} className="text-red-500 dark:text-red-400 hover:text-red-700 ml-2 shrink-0">&times;</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button type="submit" disabled={uploading || files.length === 0} className="flex items-center gap-1.5 bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium rounded-lg px-3.5 py-1.5 transition-colors disabled:opacity-50">
            {uploading ? "Uploading..." : `Upload${files.length > 0 ? ` (${files.length})` : ""}`}
          </button>
        </form>

        {structures.length === 0 ? (
          <div className="bg-white dark:bg-zinc-950 rounded-xl border border-gray-200/80 dark:border-zinc-700/80 p-12 text-center">
            <svg className="w-12 h-12 text-gray-300 dark:text-zinc-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
            <p className="text-sm text-gray-500 dark:text-zinc-400">No fee structures uploaded yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {structures.map(s => (
              <div key={s.id} className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    {renamingId === s.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          value={renameValue}
                          onChange={e => setRenameValue(e.target.value)}
                          className="flex-1 rounded-lg border border-zinc-200 dark:border-zinc-700 px-2.5 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700"
                          autoFocus
                          onKeyDown={e => {
                            if (e.key === "Enter") handleRename(s.id, renameValue);
                            if (e.key === "Escape") setRenamingId(null);
                          }}
                        />
                        <button onClick={() => handleRename(s.id, renameValue)} className="text-[11px] text-blue-700 hover:underline font-medium">Save</button>
                        <button onClick={() => setRenamingId(null)} className="text-[11px] text-zinc-500 dark:text-zinc-400 dark:text-zinc-500 hover:underline">Cancel</button>
                      </div>
                    ) : (
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{s.name}</p>
                    )}
                    <p className="text-xs text-zinc-400 dark:text-zinc-500">{s._count.courses} course{s._count.courses !== 1 ? "s" : ""} using this</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-3 shrink-0">
                  <a
                    href={s.pdfData ? `/api/fee-structures/${s.id}` : (s.url || "#")}
                    target="_blank"
                    className="text-[11px] text-blue-700 hover:underline font-medium"
                  >
                    View PDF
                  </a>
                  <button
                    onClick={() => { setRenamingId(s.id); setRenameValue(s.name); }}
                    className="w-7 h-7 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center text-zinc-500 dark:text-zinc-400 dark:text-zinc-500 hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-800 transition-colors"
                    title="Rename"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  </button>
                  <button onClick={() => handleDelete(s.id)} className="w-7 h-7 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center text-zinc-500 dark:text-zinc-400 dark:text-zinc-500 hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-800 transition-colors" title="Delete">
                    <svg className="w-3.5 h-3.5 text-red-500 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
