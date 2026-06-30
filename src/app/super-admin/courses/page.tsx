"use client";

import { useState, useEffect } from "react";

interface FeeStructure {
  id: string;
  name: string;
  url: string;
}

interface Course {
  id: string;
  name: string;
  minGrade: string;
  feeStructureId: string | null;
  feeStructure: FeeStructure | null;
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [minGrade, setMinGrade] = useState("");
  const [feeStructureId, setFeeStructureId] = useState("");
  const [uploadNewFee, setUploadNewFee] = useState(false);
  const [newFeeFile, setNewFeeFile] = useState<File | null>(null);
  const [newFeeName, setNewFeeName] = useState("");
  const [uploading, setUploading] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editMinGrade, setEditMinGrade] = useState("");
  const [editFeeStructureId, setEditFeeStructureId] = useState("");
  const [editUploadNewFee, setEditUploadNewFee] = useState(false);
  const [editNewFeeFile, setEditNewFeeFile] = useState<File | null>(null);
  const [editNewFeeName, setEditNewFeeName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchCourses(); fetchFeeStructures(); }, []);

  async function fetchCourses() {
    try {
      const res = await fetch("/api/courses");
      const data = await res.json();
      if (res.ok) setCourses(data.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function fetchFeeStructures() {
    try {
      const res = await fetch("/api/fee-structures");
      const data = await res.json();
      if (res.ok) setFeeStructures(data.data);
    } catch (e) { console.error(e); }
  }

  async function uploadPdf(file: File): Promise<string | null> {
    const fd = new FormData();
    fd.append("file", file);
    const r = await fetch("/api/upload", { method: "POST", body: fd });
    const d = await r.json();
    return r.ok ? d.data.url : null;
  }

  function resetForm() {
    setName(""); setMinGrade("");
    setFeeStructureId(""); setUploadNewFee(false);
    setNewFeeFile(null); setNewFeeName("");
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !minGrade) return;
    setUploading(true);
    try {
      let fsId = feeStructureId || null;
      if (uploadNewFee && newFeeFile && newFeeName) {
        const url = await uploadPdf(newFeeFile);
        if (!url) { alert("Failed to upload fee PDF"); return; }
        const res = await fetch("/api/fee-structures", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: newFeeName, url }),
        });
        const d = await res.json();
        if (res.ok) fsId = d.data.id;
        else { alert(d.error || "Failed"); return; }
      }
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, minGrade, feeStructureId: fsId }),
      });
      if (res.ok) { resetForm(); fetchCourses(); fetchFeeStructures(); }
      else { const d = await res.json(); alert(d.error || "Failed"); }
    } catch (err) { console.error(err); }
    finally { setUploading(false); }
  }

  function startEdit(course: Course) {
    setEditingId(course.id);
    setEditName(course.name);
    setEditMinGrade(course.minGrade);
    setEditFeeStructureId(course.feeStructureId || "");
    setEditUploadNewFee(false);
    setEditNewFeeFile(null);
    setEditNewFeeName("");
  }

  function cancelEdit() { setEditingId(null); }

  async function handleEditSave(id: string) {
    if (!editName || !editMinGrade) return;
    setSaving(true);
    try {
      let fsId = editFeeStructureId || null;
      if (editUploadNewFee && editNewFeeFile && editNewFeeName) {
        const url = await uploadPdf(editNewFeeFile);
        if (!url) { alert("Failed to upload fee PDF"); return; }
        const res = await fetch("/api/fee-structures", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: editNewFeeName, url }),
        });
        const d = await res.json();
        if (res.ok) fsId = d.data.id;
        else { alert(d.error || "Failed"); return; }
      }
      const res = await fetch("/api/courses", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, name: editName, minGrade: editMinGrade, feeStructureId: fsId }),
      });
      if (res.ok) { cancelEdit(); fetchCourses(); fetchFeeStructures(); }
      else { const d = await res.json(); alert(d.error || "Failed"); }
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this course?")) return;
    fetch(`/api/courses?id=${id}`, { method: "DELETE" }).then(() => fetchCourses());
  }

  function FeeSelector({ value, onChange, showUpload, setShowUpload, newName, setNewName, newFile, setNewFile }: {
    value: string; onChange: (v: string) => void;
    showUpload: boolean; setShowUpload: (v: boolean) => void;
    newName: string; setNewName: (v: string) => void;
    newFile: File | null; setNewFile: (f: File | null) => void;
  }) {
    return (
      <div>
        <label className="block text-[11px] font-medium text-zinc-500 mb-1">Fee structure</label>
        {!showUpload ? (
          <div className="flex gap-2">
            <select value={value} onChange={e => onChange(e.target.value)} className="flex-1 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700">
              <option value="">None</option>
              {feeStructures.map(fs => (
                <option key={fs.id} value={fs.id}>{fs.name}</option>
              ))}
            </select>
            <button type="button" onClick={() => setShowUpload(true)} className="text-[11px] text-blue-700 hover:underline whitespace-nowrap">+ New</button>
          </div>
        ) : (
          <div className="space-y-2 p-3 rounded-lg border border-blue-200 bg-blue-50/30">
            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Fee structure name" className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700" />
            <input type="file" accept=".pdf" onChange={e => setNewFile(e.target.files?.[0] || null)} className="w-full text-xs text-zinc-500 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
            <button type="button" onClick={() => setShowUpload(false)} className="text-[11px] text-zinc-500 hover:underline">Cancel</button>
          </div>
        )}
      </div>
    );
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
            <h1 className="text-base font-medium text-zinc-900">Courses</h1>
            <p className="text-xs text-zinc-400 mt-0.5">Manage academic programs</p>
          </div>
          <span className="text-[11px] text-zinc-400">{courses.length} course{courses.length !== 1 ? "s" : ""}</span>
        </div>
      </header>

      <main className="px-6 lg:px-8 py-6 max-w-4xl">
        <form onSubmit={handleAdd} className="bg-white rounded-xl border border-zinc-200 p-5 mb-5">
          <h2 className="text-sm font-medium text-zinc-900 mb-4">Add new course</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-[11px] font-medium text-zinc-500 mb-1">Course name *</label>
              <input value={name} onChange={e => setName(e.target.value)} required className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700" placeholder="e.g. Diploma in ICT" />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-zinc-500 mb-1">Min education qualification *</label>
              <input value={minGrade} onChange={e => setMinGrade(e.target.value)} required className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700" placeholder="e.g. C+" />
            </div>
            <FeeSelector
              value={feeStructureId} onChange={setFeeStructureId}
              showUpload={uploadNewFee} setShowUpload={setUploadNewFee}
              newName={newFeeName} setNewName={setNewFeeName}
              newFile={newFeeFile} setNewFile={setNewFeeFile}
            />
          </div>
          <button type="submit" disabled={uploading} className="flex items-center gap-1.5 bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium rounded-lg px-3.5 py-1.5 transition-colors disabled:opacity-50">
            {uploading ? "Adding..." : "Add course"}
          </button>
        </form>

        {courses.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200/80 p-12 text-center">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            <p className="text-sm text-gray-500">No courses added yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {courses.map(course => (
              <div key={course.id} className="bg-white border border-zinc-200 rounded-xl">
                {editingId === course.id ? (
                  <div className="p-5">
                    <h3 className="text-sm font-medium text-zinc-900 mb-3">Edit course</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-[11px] font-medium text-zinc-500 mb-1">Course name</label>
                        <input value={editName} onChange={e => setEditName(e.target.value)} className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-zinc-500 mb-1">Min education qualification</label>
                        <input value={editMinGrade} onChange={e => setEditMinGrade(e.target.value)} className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700" />
                      </div>
                      <FeeSelector
                        value={editFeeStructureId} onChange={setEditFeeStructureId}
                        showUpload={editUploadNewFee} setShowUpload={setEditUploadNewFee}
                        newName={editNewFeeName} setNewName={setEditNewFeeName}
                        newFile={editNewFeeFile} setNewFile={setEditNewFeeFile}
                      />
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button onClick={() => handleEditSave(course.id)} disabled={saving} className="flex items-center gap-1.5 bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium rounded-lg px-3.5 py-1.5 transition-colors disabled:opacity-50">
                        {saving ? "Saving..." : "Save"}
                      </button>
                      <button onClick={cancelEdit} className="px-3.5 py-1.5 rounded-lg bg-zinc-100 text-zinc-700 text-sm font-medium hover:bg-zinc-200 transition-colors">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 sm:p-5">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="text-sm font-medium text-zinc-900">{course.name}</h3>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          Min: <span className="font-medium text-zinc-700">{course.minGrade}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {course.feeStructure && (
                          <a href={course.feeStructure.url} target="_blank" className="text-[11px] text-blue-700 hover:underline font-medium">{course.feeStructure.name}</a>
                        )}
                        <button onClick={() => startEdit(course)} className="w-7 h-7 rounded-lg border border-zinc-200 bg-zinc-50 flex items-center justify-center text-zinc-500 hover:bg-zinc-100 transition-colors" title="Edit">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button onClick={() => handleDelete(course.id)} className="w-7 h-7 rounded-lg border border-zinc-200 bg-zinc-50 flex items-center justify-center text-zinc-500 hover:bg-zinc-100 transition-colors" title="Delete">
                          <svg className="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
