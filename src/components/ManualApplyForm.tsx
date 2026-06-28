"use client";

import { useState, useEffect } from "react";

import { EDUCATION_QUALIFICATIONS } from "@/lib/education-qualifications";

interface CourseQualification {
  id: string;
  qualificationType: string;
  qualificationLevel: string;
  minGrade: string;
}

interface Course {
  id: string;
  name: string;
  feePdf: string | null;
  qualifications: CourseQualification[];
}

interface Props {
  defaultCampus?: string;
  onSuccess?: () => void;
}

export default function ManualApplyForm({ defaultCampus, onSuccess }: Props) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [form, setForm] = useState({
    firstName: "", middleName: "", lastName: "", gender: "",
    phone: "", email: "", educationQualification: "",
    preferredCampus: defaultCampus || "",
    course: "", academicYear: "",
  });
  const [selectedCourseId, setSelectedCourseId] = useState("");

  useEffect(() => {
    fetch("/api/courses").then(r => r.json()).then(d => { if (d.data) setCourses(d.data); }).catch(() => {});
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name: elName, value } = e.target;
    if (elName === "selectedCourse") {
      setSelectedCourseId(value);
      setForm({ ...form, course: "" });
    } else {
      setForm({ ...form, [elName]: value, ...(elName === "preferredCampus" ? { course: "" } : {}) });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: "success", text: "Application submitted successfully!" });
        setForm({ firstName: "", middleName: "", lastName: "", gender: "", phone: "", email: "", educationQualification: "", preferredCampus: defaultCampus || "", course: "", academicYear: "" });
        setSelectedCourseId("");
        onSuccess?.();
      } else {
        setMessage({ type: "error", text: data.error || "Something went wrong." });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to submit application." });
    } finally {
      setSubmitting(false);
    }
  }

  const selectedCourse = courses.find(c => c.id === selectedCourseId);
  const selectedQual = selectedCourse?.qualifications.find(q => q.id === form.course);

  return (
    <div className="w-full">
      <button onClick={() => setOpen(!open)} className="w-full sm:w-auto inline-flex items-center justify-center rounded-lg border border-blue-600 bg-white px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors">
        {open ? "− Close Form" : "+ Add Student Manually"}
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="mt-4 bg-white rounded-xl shadow-sm border border-gray-200 p-5 sm:p-6 space-y-5">
          <div className="border-b border-gray-100 pb-3">
            <h3 className="text-base font-semibold text-gray-900">New Student Application</h3>
            <p className="text-xs text-gray-500 mt-0.5">Fill in the details to manually add a student</p>
          </div>
          {message && (
            <div className={`p-3 rounded-lg text-sm ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
              {message.text}
            </div>
          )}

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Student Name</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">First Name *</label>
                <input name="firstName" value={form.firstName} onChange={handleChange} required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Middle Name</label>
                <input name="middleName" value={form.middleName} onChange={handleChange} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Last Name *</label>
                <input name="lastName" value={form.lastName} onChange={handleChange} required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Contact &amp; Profile</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Gender</label>
                <select name="gender" value={form.gender} onChange={handleChange} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                  <option value="">Select</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Phone *</label>
                <input name="phone" value={form.phone} onChange={handleChange} required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                <input name="email" type="email" value={form.email} onChange={handleChange} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Academic Details</p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Education Qualification *</label>
                <select name="educationQualification" value={form.educationQualification} onChange={handleChange} required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                  <option value="">Select qualification</option>
                  {EDUCATION_QUALIFICATIONS.map(q => (
                    <option key={q} value={q}>{q}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Campus *</label>
                  <select name="preferredCampus" value={form.preferredCampus} onChange={handleChange} required disabled={!!defaultCampus} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-100 disabled:text-gray-500">
                    <option value="">Select campus</option>
                    <option value="MAIN">Main Campus</option>
                    <option value="WEST">West Campus</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Course *</label>
                  <select name="selectedCourse" value={selectedCourseId} onChange={handleChange} required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                    <option value="">Select course</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              {selectedCourse && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Qualification track *</label>
                  <select name="course" value={form.course} onChange={handleChange} required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                    <option value="">Select qualification</option>
                    {selectedCourse.qualifications.map(q => (
                      <option key={q.id} value={q.id}>
                        {q.qualificationType} — {q.qualificationLevel} — Min: {q.minGrade}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {selectedCourse?.feePdf && (
                <p className="text-xs text-blue-600">
                  <a href={selectedCourse.feePdf} target="_blank" rel="noopener noreferrer" className="hover:underline">View Fee Structure →</a>
                </p>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Academic Year *</label>
                <select name="academicYear" value={form.academicYear} onChange={handleChange} required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                  <option value="">Select year</option>
                  <option value="2026-2027">2026-2027</option>
                  <option value="2027-2028">2027-2028</option>
                </select>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4 flex flex-col sm:flex-row gap-3">
            <button type="submit" disabled={submitting} className="w-full sm:w-auto rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {submitting ? "Submitting..." : "Submit Application"}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="w-full sm:w-auto rounded-lg border border-gray-300 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
