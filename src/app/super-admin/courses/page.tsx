"use client";

import { useState, useEffect } from "react";
import AdminSidebar from "@/components/AdminSidebar";

interface Course {
  id: string;
  name: string;
  qualificationType: string | null;
  qualificationLevel: string | null;
  minGrade: string | null;
  feePdf: string | null;
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [minGrade, setMinGrade] = useState("");
  const [qualificationType, setQualificationType] = useState("");
  const [qualificationLevel, setQualificationLevel] = useState("");
  const [feeFile, setFeeFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editQualificationType, setEditQualificationType] = useState("");
  const [editQualificationLevel, setEditQualificationLevel] = useState("");
  const [editMinGrade, setEditMinGrade] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchCourses(); }, []);

  async function fetchCourses() {
    try {
      const res = await fetch("/api/courses");
      const data = await res.json();
      if (res.ok) setCourses(data.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name) return;
    setUploading(true);
    try {
      let feePdf: string | null = null;
      if (feeFile) {
        const fd = new FormData();
        fd.append("file", feeFile);
        const uploadRes = await fetch("/api/upload", { method: "POST", body: fd });
        const uploadData = await uploadRes.json();
        if (uploadRes.ok) feePdf = uploadData.data.url;
      }
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, qualificationType, qualificationLevel, minGrade: minGrade || null, feePdf }),
      });
      if (res.ok) {
        setName(""); setQualificationType(""); setQualificationLevel(""); setMinGrade(""); setFeeFile(null);
        fetchCourses();
      }
    } catch (e) { console.error(e); }
    finally { setUploading(false); }
  }

  function startEdit(course: Course) {
    setEditingId(course.id);
    setEditName(course.name);
    setEditQualificationType(course.qualificationType || "");
    setEditQualificationLevel(course.qualificationLevel || "");
    setEditMinGrade(course.minGrade || "");
  }

  function cancelEdit() { setEditingId(null); }

  async function handleEditSave(id: string) {
    if (!editName) return;
    setSaving(true);
    try {
      const res = await fetch("/api/courses", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, name: editName, qualificationType: editQualificationType || null, qualificationLevel: editQualificationLevel || null, minGrade: editMinGrade || null }),
      });
      if (res.ok) { cancelEdit(); fetchCourses(); }
      else { const data = await res.json(); alert(data.error || "Failed to update"); }
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this course? This cannot be undone.")) return;
    await fetch(`/api/courses?id=${id}`, { method: "DELETE" });
    fetchCourses();
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <div className="w-7 h-7 border-2 border-blue-700 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-50 flex">
      <AdminSidebar role="SUPER_ADMIN" />
      <div className="flex-1 min-w-0 lg:ml-48">
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
          {/* Add Form */}
          <form onSubmit={handleAdd} className="bg-white rounded-xl border border-zinc-200 p-5 mb-5">
            <h2 className="text-sm font-medium text-zinc-900 mb-4">Add new course</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-[11px] font-medium text-zinc-500 mb-1">Course name *</label>
                <input value={name} onChange={e => setName(e.target.value)} required className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700" placeholder="e.g. Education (Secondary)" />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-zinc-500 mb-1">Qualification type</label>
                <select value={qualificationType} onChange={e => setQualificationType(e.target.value)} className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700">
                  <option value="">Select type</option>
                  <option value="Artisan">Artisan</option>
                  <option value="Certificate">Certificate</option>
                  <option value="Diploma">Diploma</option>
                  <option value="Higher Diploma">Higher Diploma</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-[11px] font-medium text-zinc-500 mb-1">Qualification level</label>
                <select value={qualificationLevel} onChange={e => setQualificationLevel(e.target.value)} className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700">
                  <option value="">Select level</option>
                  <option value="Level 4">Level 4</option>
                  <option value="Level 5">Level 5</option>
                  <option value="Level 6">Level 6</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-zinc-500 mb-1">Min grade</label>
                <input value={minGrade} onChange={e => setMinGrade(e.target.value)} placeholder="e.g. C+" className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700" />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-[11px] font-medium text-zinc-500 mb-1">Fee structure (PDF)</label>
              <input type="file" accept=".pdf" onChange={e => setFeeFile(e.target.files?.[0] || null)} className="w-full text-sm text-zinc-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
            </div>
            <button type="submit" disabled={uploading} className="flex items-center gap-1.5 bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium rounded-lg px-3.5 py-1.5 transition-colors disabled:opacity-50">
              {uploading ? "Adding..." : "Add course"}
            </button>
          </form>

          {/* Course List */}
          {courses.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200/80 p-12 text-center">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
              <p className="text-sm text-gray-500">No courses added yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {courses.map(course => (
                <div key={course.id} className="bg-white border border-zinc-200 rounded-xl p-4">
                  {editingId === course.id ? (
                    <div className="p-5">
                      <h3 className="text-sm font-medium text-zinc-900 mb-3">Edit course</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="block text-[11px] font-medium text-zinc-500 mb-1">Course name</label>
                          <input value={editName} onChange={e => setEditName(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0066ff]/20 focus:border-[#0066ff]" />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-gray-500 mb-1">Qualification Type</label>
                          <select value={editQualificationType} onChange={e => setEditQualificationType(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0066ff]/20 focus:border-[#0066ff]">
                            <option value="">Select type</option>
                            <option value="Artisan">Artisan</option>
                            <option value="Certificate">Certificate</option>
                            <option value="Diploma">Diploma</option>
                            <option value="Higher Diploma">Higher Diploma</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                        <div>
                          <label className="block text-[11px] font-medium text-gray-500 mb-1">Qualification Level</label>
                          <select value={editQualificationLevel} onChange={e => setEditQualificationLevel(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0066ff]/20 focus:border-[#0066ff]">
                            <option value="">Select level</option>
                            <option value="Level 4">Level 4</option>
                            <option value="Level 5">Level 5</option>
                            <option value="Level 6">Level 6</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-gray-500 mb-1">Min Grade</label>
                          <input value={editMinGrade} onChange={e => setEditMinGrade(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0066ff]/20 focus:border-[#0066ff]" placeholder="e.g. C+" />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleEditSave(course.id)} disabled={saving} className="flex items-center gap-1.5 bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium rounded-lg px-3.5 py-1.5 transition-colors disabled:opacity-50">
                          {saving ? "Saving..." : "Save"}
                        </button>
                        <button onClick={cancelEdit} className="px-3.5 py-1.5 rounded-lg bg-zinc-100 text-zinc-700 text-sm font-medium hover:bg-zinc-200 transition-colors">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 sm:p-5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#0066ff]/10 to-[#00c9a7]/10 flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 text-[#0066ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-zinc-900">{course.name}</h3>
                          <p className="text-xs text-zinc-500 mt-0.5">
                            {course.qualificationType && <span>{course.qualificationType}</span>}
                            {course.qualificationType && course.qualificationLevel && <span> · </span>}
                            {course.qualificationLevel && <span>{course.qualificationLevel}</span>}
                            {course.minGrade && <span> · Min: {course.minGrade}</span>}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {course.feePdf && (
                          <a href={course.feePdf} target="_blank" className="text-[11px] text-blue-700 hover:underline font-medium">View PDF</a>
                        )}
                        <button onClick={() => startEdit(course)} className="w-7 h-7 rounded-lg border border-zinc-200 bg-zinc-50 flex items-center justify-center text-zinc-500 hover:bg-zinc-100 transition-colors" title="Edit">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button onClick={() => handleDelete(course.id)} className="w-7 h-7 rounded-lg border border-zinc-200 bg-zinc-50 flex items-center justify-center text-zinc-500 hover:bg-zinc-100 transition-colors" title="Delete">
                          <svg className="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
