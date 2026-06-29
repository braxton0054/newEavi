"use client";

import { useState, useEffect } from "react";
import { QUALIFICATION_TYPES, QUALIFICATION_LEVELS } from "@/lib/course-constants";

interface CourseQualification {
  id: string;
  qualificationCategory: string | null;
  qualificationLevel: string | null;
  minGrade: string;
  feePdf: string | null;
}

interface Course {
  id: string;
  name: string;
  qualifications: CourseQualification[];
}

interface Entry {
  uid: string;
  category: string; // for category entries
  level: string;     // for level entries
  minGrade: string;
  feeFile: File | null;
}

let counter = 0;
const mk = (category = "", level = ""): Entry => ({
  uid: String(++counter),
  category,
  level,
  minGrade: "",
  feeFile: null,
});

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  // Add form
  const [name, setName] = useState("");
  const [catEntries, setCatEntries] = useState<Entry[]>(QUALIFICATION_TYPES.map(t => mk(t, ""))); // each category is one row, toggled by minGrade
  const [lvlEntries, setLvlEntries] = useState<Entry[]>(QUALIFICATION_LEVELS.map(l => mk("", l))); // each level is one row, toggled by minGrade
  const [uploading, setUploading] = useState(false);

  // Edit form
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editCatEntries, setEditCatEntries] = useState<Entry[]>([]);
  const [editLvlEntries, setEditLvlEntries] = useState<Entry[]>([]);
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

  async function uploadPdf(file: File): Promise<string | null> {
    const fd = new FormData();
    fd.append("file", file);
    const r = await fetch("/api/upload", { method: "POST", body: fd });
    const d = await r.json();
    return r.ok ? d.data.url : null;
  }

  function validCats(entries: Entry[]) { return entries.filter(e => e.category && e.minGrade); }
  function validLvls(entries: Entry[]) { return entries.filter(e => e.level && e.minGrade); }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name) return;
    const allQuals = [...validCats(catEntries), ...validLvls(lvlEntries)];
    if (allQuals.length === 0) return alert("Add at least one qualification with min grade");

    setUploading(true);
    try {
      const qualifications = await Promise.all(allQuals.map(async q => ({
        qualificationCategory: q.category || null,
        qualificationLevel: q.level || null,
        minGrade: q.minGrade,
        feePdf: q.feeFile ? await uploadPdf(q.feeFile) : null,
      })));

      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, qualifications }),
      });
      if (res.ok) {
        setName("");
        setCatEntries(QUALIFICATION_TYPES.map(t => mk(t, "")));
        setLvlEntries(QUALIFICATION_LEVELS.map(l => mk("", "")));
        fetchCourses();
      } else { const d = await res.json(); alert(d.error || "Failed"); }
    } catch (err) { console.error(err); }
    finally { setUploading(false); }
  }

  function startEdit(course: Course) {
    setEditingId(course.id);
    setEditName(course.name);

    const eCats = QUALIFICATION_TYPES.map(t => mk(t, ""));
    const eLvls = QUALIFICATION_LEVELS.map(l => mk("", l));

    // Fill in existing data
    for (const q of course.qualifications) {
      if (q.qualificationCategory) {
        const cat = eCats.find(c => c.category === q.qualificationCategory);
        if (cat) { cat.minGrade = q.minGrade; }
      }
      if (q.qualificationLevel) {
        const lvl = eLvls.find(l => l.level === q.qualificationLevel);
        if (lvl) { lvl.minGrade = q.minGrade; }
      }
    }

    setEditCatEntries(eCats);
    setEditLvlEntries(eLvls);
  }

  function cancelEdit() { setEditingId(null); }

  async function handleEditSave(id: string) {
    if (!editName) return;
    const allQuals = [...validCats(editCatEntries), ...validLvls(editLvlEntries)];
    if (allQuals.length === 0) return alert("Add at least one qualification with min grade");

    setSaving(true);
    try {
      const qualifications = await Promise.all(allQuals.map(async q => ({
        qualificationCategory: q.category || null,
        qualificationLevel: q.level || null,
        minGrade: q.minGrade,
        feePdf: q.feeFile ? await uploadPdf(q.feeFile) : null,
      })));

      const res = await fetch("/api/courses", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, name: editName, qualifications }),
      });
      if (res.ok) { cancelEdit(); fetchCourses(); }
      else { const d = await res.json(); alert(d.error || "Failed"); }
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this course?")) return;
    fetch(`/api/courses?id=${id}`, { method: "DELETE" }).then(() => fetchCourses());
  }

  // Reusable row renderer
  function CategorySection({ entries, setEntries }: { entries: Entry[]; setEntries: (e: Entry[]) => void }) {
    return (
      <div className="space-y-2">
        <h3 className="text-xs font-medium text-zinc-700">Categories</h3>
        {entries.map(entry => {
          const enabled = !!entry.minGrade;
          return (
            <div key={entry.uid} className={`rounded-lg border p-3 transition-colors ${enabled ? "border-blue-200 bg-blue-50/30" : "border-zinc-200 bg-zinc-50/50"}`}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
                <div>
                  <label className="block text-[11px] text-zinc-500 mb-1">Category</label>
                  <input value={entry.category} readOnly className="w-full rounded-lg border border-zinc-200 bg-zinc-100 px-2.5 py-1.5 text-sm text-zinc-600 cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-500 mb-1">Min grade *</label>
                  <input value={entry.minGrade} onChange={e => setEntries(entries.map(x => x.uid === entry.uid ? { ...x, minGrade: e.target.value } : x))} placeholder="e.g. C plain" className="w-full rounded-lg border border-zinc-200 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700" />
                </div>
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <label className="block text-[11px] text-zinc-500 mb-1">Fee structure (PDF)</label>
                    <input type="file" accept=".pdf" onChange={e => setEntries(entries.map(x => x.uid === entry.uid ? { ...x, feeFile: e.target.files?.[0] || null } : x))} className="w-full text-xs text-zinc-500 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                  </div>
                  {!enabled && (
                    <button type="button" onClick={() => setEntries(entries.map(x => x.uid === entry.uid ? { ...x, minGrade: " " } : x))} className="text-[10px] text-blue-700 hover:underline whitespace-nowrap">Enable</button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  function LevelSection({ entries, setEntries }: { entries: Entry[]; setEntries: (e: Entry[]) => void }) {
    return (
      <div className="space-y-2">
        <h3 className="text-xs font-medium text-zinc-700">Levels</h3>
        {entries.map(entry => {
          const enabled = !!entry.minGrade;
          return (
            <div key={entry.uid} className={`rounded-lg border p-3 transition-colors ${enabled ? "border-violet-200 bg-violet-50/30" : "border-zinc-200 bg-zinc-50/50"}`}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
                <div>
                  <label className="block text-[11px] text-zinc-500 mb-1">Level</label>
                  <input value={entry.level} readOnly className="w-full rounded-lg border border-zinc-200 bg-zinc-100 px-2.5 py-1.5 text-sm text-zinc-600 cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-500 mb-1">Min grade *</label>
                  <input value={entry.minGrade} onChange={e => setEntries(entries.map(x => x.uid === entry.uid ? { ...x, minGrade: e.target.value } : x))} placeholder="e.g. C plain" className="w-full rounded-lg border border-zinc-200 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700" />
                </div>
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <label className="block text-[11px] text-zinc-500 mb-1">Fee structure (PDF)</label>
                    <input type="file" accept=".pdf" onChange={e => setEntries(entries.map(x => x.uid === entry.uid ? { ...x, feeFile: e.target.files?.[0] || null } : x))} className="w-full text-xs text-zinc-500 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                  </div>
                  {!enabled && (
                    <button type="button" onClick={() => setEntries(entries.map(x => x.uid === entry.uid ? { ...x, minGrade: " " } : x))} className="text-[10px] text-blue-700 hover:underline whitespace-nowrap">Enable</button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
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
      {/* Header */}
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
            <div className="mb-4">
              <label className="block text-[11px] font-medium text-zinc-500 mb-1">Course name *</label>
              <input value={name} onChange={e => setName(e.target.value)} required className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700" placeholder="e.g. ICT" />
            </div>

            <CategorySection entries={catEntries} setEntries={setCatEntries} />
            <div className="my-4 border-t border-zinc-100"></div>
            <LevelSection entries={lvlEntries} setEntries={setLvlEntries} />

            <button type="submit" disabled={uploading} className="mt-4 flex items-center gap-1.5 bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium rounded-lg px-3.5 py-1.5 transition-colors disabled:opacity-50">
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
                      <div className="mb-4">
                        <label className="block text-[11px] font-medium text-zinc-500 mb-1">Course name</label>
                        <input value={editName} onChange={e => setEditName(e.target.value)} className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700" />
                      </div>
                      <CategorySection entries={editCatEntries} setEntries={setEditCatEntries} />
                      <div className="my-4 border-t border-zinc-100"></div>
                      <LevelSection entries={editLvlEntries} setEntries={setEditLvlEntries} />
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
                        <h3 className="text-sm font-medium text-zinc-900">{course.name}</h3>
                        <div className="flex items-center gap-2">
                          <button onClick={() => startEdit(course)} className="w-7 h-7 rounded-lg border border-zinc-200 bg-zinc-50 flex items-center justify-center text-zinc-500 hover:bg-zinc-100 transition-colors" title="Edit">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          </button>
                          <button onClick={() => handleDelete(course.id)} className="w-7 h-7 rounded-lg border border-zinc-200 bg-zinc-50 flex items-center justify-center text-zinc-500 hover:bg-zinc-100 transition-colors" title="Delete">
                            <svg className="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </div>
                      {course.qualifications.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {course.qualifications.map(q => (
                            <div key={q.id} className="flex items-center gap-2 text-xs text-zinc-500">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-700/30 flex-shrink-0"></span>
                              {q.qualificationCategory && <span className="font-medium text-zinc-700">{q.qualificationCategory}</span>}
                              {q.qualificationCategory && q.qualificationLevel && <span className="text-zinc-300">·</span>}
                              {q.qualificationLevel && <span className="font-medium text-zinc-700">{q.qualificationLevel}</span>}
                              <span className="text-zinc-300">·</span>
                              <span>Min: {q.minGrade}</span>
                              {q.feePdf && (<><span className="text-zinc-300">·</span><a href={q.feePdf} target="_blank" className="text-blue-700 hover:underline">Fee PDF</a></>)}
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
      </>
  );
}
