"use client";

import { useState, useEffect } from "react";
import AdminSidebar from "@/components/AdminSidebar";
import { QUALIFICATION_TYPES, QUALIFICATION_LEVELS } from "@/lib/course-constants";

interface CourseQualification {
  id: string;
  qualificationType: string;
  qualificationLevel: string;
  minGrade: string;
  feePdf: string | null;
}

interface Course {
  id: string;
  name: string;
  qualifications: CourseQualification[];
}

interface QualRow {
  qualificationType: string;
  qualificationLevel: string;
  minGrade: string;
  feeFile: File | null;
}

const emptyQualRow = (): QualRow => ({
  qualificationType: "",
  qualificationLevel: "",
  minGrade: "",
  feeFile: null,
});

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  // Add form state
  const [name, setName] = useState("");
  const [qualRows, setQualRows] = useState<QualRow[]>([emptyQualRow()]);
  const [uploading, setUploading] = useState(false);

  // Edit form state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editQualRows, setEditQualRows] = useState<QualRow[]>([emptyQualRow()]);
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

  function updateQualRow(rows: QualRow[], index: number, field: keyof QualRow, value: string | File | null) {
    const updated = [...rows];
    updated[index] = { ...updated[index], [field]: value };
    return updated;
  }

  function addQualRow(rows: QualRow[], setRows: (r: QualRow[]) => void) {
    setRows([...rows, emptyQualRow()]);
  }

  function removeQualRow(rows: QualRow[], index: number, setRows: (r: QualRow[]) => void) {
    if (rows.length <= 1) return;
    setRows(rows.filter((_, i) => i !== index));
  }

  async function uploadFeePdf(file: File): Promise<string | null> {
    const fd = new FormData();
    fd.append("file", file);
    const uploadRes = await fetch("/api/upload", { method: "POST", body: fd });
    const uploadData = await uploadRes.json();
    return uploadRes.ok ? uploadData.data.url : null;
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name) return;
    const validQuals = qualRows.filter(q => q.qualificationType && q.qualificationLevel && q.minGrade);
    if (validQuals.length === 0) return alert("Add at least one qualification track");

    setUploading(true);
    try {
      // Upload fee PDFs for each qualification
      const qualifications = await Promise.all(validQuals.map(async (q) => ({
        qualificationType: q.qualificationType,
        qualificationLevel: q.qualificationLevel,
        minGrade: q.minGrade,
        feePdf: q.feeFile ? await uploadFeePdf(q.feeFile) : null,
      })));

      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, qualifications }),
      });
      if (res.ok) {
        setName("");
        setQualRows([emptyQualRow()]);
        fetchCourses();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to add course");
      }
    } catch (e) { console.error(e); }
    finally { setUploading(false); }
  }

  function startEdit(course: Course) {
    setEditingId(course.id);
    setEditName(course.name);
    setEditQualRows(
      course.qualifications.length > 0
        ? course.qualifications.map(q => ({
            qualificationType: q.qualificationType,
            qualificationLevel: q.qualificationLevel,
            minGrade: q.minGrade,
            feeFile: null,
          }))
        : [emptyQualRow()]
    );
  }

  function cancelEdit() { setEditingId(null); }

  async function handleEditSave(id: string) {
    if (!editName) return;
    const validQuals = editQualRows.filter(q => q.qualificationType && q.qualificationLevel && q.minGrade);
    if (validQuals.length === 0) return alert("At least one qualification is required");

    setSaving(true);
    try {
      const qualifications = await Promise.all(validQuals.map(async (q) => ({
        qualificationType: q.qualificationType,
        qualificationLevel: q.qualificationLevel,
        minGrade: q.minGrade,
        feePdf: q.feeFile ? await uploadFeePdf(q.feeFile) : null,
      })));

      const res = await fetch("/api/courses", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, name: editName, qualifications }),
      });
      if (res.ok) { cancelEdit(); fetchCourses(); }
      else { const data = await res.json(); alert(data.error || "Failed to update"); }
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this course and all its qualifications? This cannot be undone.")) return;
    await fetch(`/api/courses?id=${id}`, { method: "DELETE" });
    fetchCourses();
  }

  // Reusable qualification row input
  function QualificationRow({ rows, setRows, index, prefix }: { rows: QualRow[]; setRows: (r: QualRow[]) => void; index: number; prefix: string }) {
    const row = rows[index];
    return (
      <div className="flex gap-2 items-start flex-wrap sm:flex-nowrap">
        <select value={row.qualificationType} onChange={e => setRows(updateQualRow(rows, index, "qualificationType", e.target.value))} className="flex-1 min-w-[120px] rounded-lg border border-zinc-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700">
          <option value="">Type</option>
          {QUALIFICATION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={row.qualificationLevel} onChange={e => setRows(updateQualRow(rows, index, "qualificationLevel", e.target.value))} className="flex-1 min-w-[100px] rounded-lg border border-zinc-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700">
          <option value="">Level</option>
          {QUALIFICATION_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        <input value={row.minGrade} onChange={e => setRows(updateQualRow(rows, index, "minGrade", e.target.value))} placeholder="Min grade" className="w-24 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700" />
        <div className="w-full sm:w-auto">
          <input type="file" accept=".pdf" onChange={e => setRows(updateQualRow(rows, index, "feeFile", e.target.files?.[0] || null))} className="w-full text-xs text-zinc-500 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
        </div>
        <button type="button" onClick={() => removeQualRow(rows, index, setRows)} disabled={rows.length <= 1} className="w-7 h-7 rounded-lg border border-zinc-200 bg-zinc-50 flex items-center justify-center text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0" title="Remove">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
    );
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <div className="w-7 h-7 border-2 border-blue-700 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-50 flex">
      <AdminSidebar role="SUPER_ADMIN" />
      <div className="flex-1 min-w-0">
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
            <div className="mb-3">
              <label className="block text-[11px] font-medium text-zinc-500 mb-1">Course name *</label>
              <input value={name} onChange={e => setName(e.target.value)} required className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700" placeholder="e.g. ICT" />
            </div>

            {/* Qualification rows */}
            <div className="mb-3">
              <label className="block text-[11px] font-medium text-zinc-500 mb-2">Qualification tracks *</label>
              <div className="space-y-2">
                {qualRows.map((row, idx) => (
                  <QualificationRow key={idx} rows={qualRows} setRows={setQualRows} index={idx} prefix="add" />
                ))}
              </div>
              <button type="button" onClick={() => addQualRow(qualRows, setQualRows)} className="mt-2 text-xs text-blue-700 hover:text-blue-800 font-medium flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Add qualification
              </button>
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
                <div key={course.id} className="bg-white border border-zinc-200 rounded-xl">
                  {editingId === course.id ? (
                    <div className="p-5">
                      <h3 className="text-sm font-medium text-zinc-900 mb-3">Edit course</h3>
                      <div className="mb-3">
                        <label className="block text-[11px] font-medium text-zinc-500 mb-1">Course name</label>
                        <input value={editName} onChange={e => setEditName(e.target.value)} className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700" />
                      </div>

                      <div className="mb-3">
                        <label className="block text-[11px] font-medium text-zinc-500 mb-2">Qualification tracks *</label>
                        <div className="space-y-2">
                          {editQualRows.map((row, idx) => (
                            <QualificationRow key={idx} rows={editQualRows} setRows={setEditQualRows} index={idx} prefix="edit" />
                          ))}
                        </div>
                        <button type="button" onClick={() => addQualRow(editQualRows, setEditQualRows)} className="mt-2 text-xs text-blue-700 hover:text-blue-800 font-medium flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                          Add qualification
                        </button>
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
                    <div className="p-4 sm:p-5">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#0066ff]/10 to-[#00c9a7]/10 flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-[#0066ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                          </div>
                          <h3 className="text-sm font-medium text-zinc-900">{course.name}</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => startEdit(course)} className="w-7 h-7 rounded-lg border border-zinc-200 bg-zinc-50 flex items-center justify-center text-zinc-500 hover:bg-zinc-100 transition-colors" title="Edit">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          </button>
                          <button onClick={() => handleDelete(course.id)} className="w-7 h-7 rounded-lg border border-zinc-200 bg-zinc-50 flex items-center justify-center text-zinc-500 hover:bg-zinc-100 transition-colors" title="Delete">
                            <svg className="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </div>

                      {/* Qualification list */}
                      {course.qualifications.length > 0 && (
                        <div className="ml-[52px] space-y-1">
                          {course.qualifications.map(q => (
                            <div key={q.id} className="flex items-center gap-2 text-xs text-zinc-500">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-700/30 flex-shrink-0"></span>
                              <span>{q.qualificationType}</span>
                              <span className="text-zinc-300">·</span>
                              <span>{q.qualificationLevel}</span>
                              <span className="text-zinc-300">·</span>
                              <span>Min: {q.minGrade}</span>
                              {q.feePdf && (
                                <>
                                  <span className="text-zinc-300">·</span>
                                  <a href={q.feePdf} target="_blank" className="text-blue-700 hover:underline">Fee PDF</a>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
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
