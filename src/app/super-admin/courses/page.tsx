"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [minGrade, setMinGrade] = useState("");
  const [qualificationType, setQualificationType] = useState("");
  const [qualificationLevel, setQualificationLevel] = useState("");
  const [feeFile, setFeeFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  async function fetchCourses() {
    try {
      const res = await fetch("/api/courses");
      const data = await res.json();
      if (res.ok) setCourses(data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
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
    } catch (e) {
      console.error(e);
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this course?")) return;
    await fetch(`/api/courses?id=${id}`, { method: "DELETE" });
    fetchCourses();
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar role="SUPER_ADMIN" />
      <div className="flex-1 min-w-0 lg:ml-72">
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center justify-between gap-4 lg:pl-6">
          <div className="lg:pl-0 pl-12">
            <h1 className="text-xl font-bold text-gray-900">Course Management</h1>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <form onSubmit={handleAdd} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8 space-y-4">
          <h2 className="font-semibold text-gray-900">Add New Course</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Course Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Qualification Type</label>
              <select value={qualificationType} onChange={e => setQualificationType(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                <option value="">Select type</option>
                <option value="Artisan">Artisan</option>
                <option value="Certificate">Certificate</option>
                <option value="Diploma">Diploma</option>
                <option value="Higher Diploma">Higher Diploma</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Qualification Level</label>
              <select value={qualificationLevel} onChange={e => setQualificationLevel(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                <option value="">Select level</option>
                <option value="Level 4">Level 4</option>
                <option value="Level 5">Level 5</option>
                <option value="Level 6">Level 6</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Minimum KCSE/KCPE Grade</label>
            <input value={minGrade} onChange={e => setMinGrade(e.target.value)} placeholder="e.g. B+, C+" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fee Structure (PDF)</label>
            <input type="file" accept=".pdf" onChange={e => setFeeFile(e.target.files?.[0] || null)} className="w-full text-sm" />
          </div>
          <button type="submit" disabled={uploading} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
            {uploading ? "Adding..." : "Add Course"}
          </button>
        </form>

        <div className="space-y-3">
          {courses.map(course => (
            <div key={course.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">{course.name}</h3>
                <p className="text-sm text-gray-500">
                  {course.qualificationType ? `${course.qualificationType}` : ""}
                  {course.qualificationType && course.qualificationLevel ? " • " : ""}
                  {course.qualificationLevel || ""}
                  {((course.qualificationType || course.qualificationLevel) && course.minGrade) ? " • " : ""}
                  {course.minGrade ? `Min: ${course.minGrade}` : ""}
                </p>
                {course.feePdf && (
                  <a href={course.feePdf} target="_blank" className="text-xs text-blue-600 hover:underline">View Fee Structure</a>
                )}
              </div>
              <button onClick={() => handleDelete(course.id)} className="text-sm text-red-600 hover:underline">Delete</button>
            </div>
          ))}
          {courses.length === 0 && <p className="text-gray-500 text-center py-8">No courses added yet.</p>}
        </div>
        </main>
      </div>
    </div>
  );
}
