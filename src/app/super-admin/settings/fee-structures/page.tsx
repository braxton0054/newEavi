"use client";

import { useState, useEffect } from "react";

interface FeeStructure {
  id: string;
  name: string;
  url: string;
  _count: { courses: number };
}

export default function FeeStructuresPage() {
  const [structures, setStructures] = useState<FeeStructure[]>([]);
  const [loading, setLoading] = useState(true);

  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { fetchStructures(); }, []);

  async function fetchStructures() {
    try {
      const res = await fetch("/api/fee-structures");
      const data = await res.json();
      if (res.ok) setStructures(data.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    try {
      const name = file.name.replace(/\.pdf$/i, "");
      const fd = new FormData();
      fd.append("file", file);
      const uploadRes = await fetch("/api/upload", { method: "POST", body: fd });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) { alert(uploadData.error || "Upload failed"); return; }

      const res = await fetch("/api/fee-structures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, url: uploadData.data.url }),
      });
      if (res.ok) { setFile(null); fetchStructures(); }
      else { const d = await res.json(); alert(d.error || "Failed"); }
    } catch (err) { console.error(err); }
    finally { setUploading(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this fee structure? Courses using it will lose the reference.")) return;
    fetch(`/api/fee-structures?id=${id}`, { method: "DELETE" }).then(() => fetchStructures());
  }

  if (loading) return (
    <div className="flex items-center justify-center py-12">
      <div className="w-7 h-7 border-2 border-blue-700 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <>
      <header className="bg-white border-b border-zinc-200 px-6 lg:px-8 py-3.5 sticky top-0 z-30">
        <div className="flex items-center justify-between">
          <div className="lg:pl-0 pl-10">
            <h1 className="text-base font-medium text-zinc-900">Fee Structures</h1>
            <p className="text-xs text-zinc-400 mt-0.5">Upload reusable fee structure PDFs</p>
          </div>
          <span className="text-[11px] text-zinc-400">{structures.length} file{structures.length !== 1 ? "s" : ""}</span>
        </div>
      </header>

      <main className="px-6 lg:px-8 py-6 max-w-4xl">
        <form onSubmit={handleUpload} className="bg-white rounded-xl border border-zinc-200 p-5 mb-5">
          <h2 className="text-sm font-medium text-zinc-900 mb-4">Upload fee structure</h2>
          <div className="mb-4">
            <label className="block text-[11px] font-medium text-zinc-500 mb-1">PDF file *</label>
            <input type="file" accept=".pdf" onChange={e => setFile(e.target.files?.[0] || null)} required className="w-full text-xs text-zinc-500 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
          </div>
          <button type="submit" disabled={uploading} className="flex items-center gap-1.5 bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium rounded-lg px-3.5 py-1.5 transition-colors disabled:opacity-50">
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </form>

        {structures.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200/80 p-12 text-center">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
            <p className="text-sm text-gray-500">No fee structures uploaded yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {structures.map(s => (
              <div key={s.id} className="bg-white border border-zinc-200 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-900">{s.name}</p>
                    <p className="text-xs text-zinc-400">{s._count.courses} course{s._count.courses !== 1 ? "s" : ""} using this</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a href={s.url} target="_blank" className="text-[11px] text-blue-700 hover:underline font-medium">View PDF</a>
                  <button onClick={() => handleDelete(s.id)} className="w-7 h-7 rounded-lg border border-zinc-200 bg-zinc-50 flex items-center justify-center text-zinc-500 hover:bg-zinc-100 transition-colors" title="Delete">
                    <svg className="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
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
