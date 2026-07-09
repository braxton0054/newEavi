"use client";

import { useState, useEffect } from "react";
import { EDUCATION_QUALIFICATIONS } from "@/lib/education-qualifications";

interface Course {
  id: string;
  name: string;
  minGrade: string;
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
  const [suggestions, setSuggestions] = useState<Course[] | null>(null);
  const [form, setForm] = useState({
    firstName: "", middleName: "", lastName: "", gender: "",
    phone: "", email: "", educationQualification: "",
    preferredCampus: defaultCampus || "",
    course: "",
  });

  useEffect(() => {
    fetch("/api/courses").then(r => r.json()).then(d => { if (d.data) setCourses(d.data); }).catch(() => {});
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    setSuggestions(null);
    try {
      const res = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: "success", text: "Application submitted successfully!" });
        setForm({ firstName: "", middleName: "", lastName: "", gender: "", phone: "", email: "", educationQualification: "", preferredCampus: defaultCampus || "", course: "" });
        onSuccess?.();
      } else if (res.status === 422 && data.suggested?.length > 0) {
        setMessage({ type: "error", text: data.error });
        setSuggestions(data.suggested);
      } else {
        setMessage({ type: "error", text: data.error || "Something went wrong." });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to submit application." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full">
      <button onClick={() => setOpen(!open)} className="w-full sm:w-auto inline-flex items-center justify-center rounded-lg border border-blue-600 bg-white px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors">
        {open ? "− Close Form" : "+ Add Student Manually"}
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="mt-4 bg-white rounded-xl border border-zinc-200 p-5 sm:p-6 space-y-5">
          <div className="border-b border-zinc-100 pb-3">
            <h3 className="text-base font-medium text-zinc-900">New Student Application</h3>
            <p className="text-xs text-zinc-500 mt-0.5">Fill in the details to manually add a student</p>
          </div>
          {message && (
            <div className={`p-3 rounded-lg text-sm ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
              {message.text}
            </div>
          )}

          {suggestions && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs font-medium text-amber-800 mb-1.5">Suggested courses:</p>
              <ul className="space-y-1">
                {suggestions.map(s => (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => { setForm(f => ({ ...f, course: s.id })); setSuggestions(null); setMessage(null); }}
                      className="text-xs text-amber-700 hover:text-amber-900 hover:underline text-left"
                    >
                      {s.name} <span className="text-amber-500">(min: {s.minGrade})</span>
                    </button>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-amber-600 mt-1">Click a course to select it, then re-submit.</p>
            </div>
          )}

          <div>
            <p className="text-xs font-medium text-zinc-500 mb-3">Student Name</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1 dark:text-zinc-300">First Name *</label>
                <input name="firstName" value={form.firstName} onChange={handleChange} required className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none dark:bg-zinc-900 dark:text-zinc-100 dark:border-zinc-700" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1 dark:text-zinc-300">Middle Name</label>
                <input name="middleName" value={form.middleName} onChange={handleChange} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none dark:bg-zinc-900 dark:text-zinc-100 dark:border-zinc-700" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1 dark:text-zinc-300">Last Name *</label>
                <input name="lastName" value={form.lastName} onChange={handleChange} required className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none dark:bg-zinc-900 dark:text-zinc-100 dark:border-zinc-700" />
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-zinc-500 mb-3">Contact &amp; Profile</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1 dark:text-zinc-300">Gender</label>
                <select name="gender" value={form.gender} onChange={handleChange} required className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none dark:bg-zinc-900 dark:text-zinc-100 dark:border-zinc-700">
                  <option value="">Select</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1 dark:text-zinc-300">Phone *</label>
                <input name="phone" value={form.phone} onChange={handleChange} required className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none dark:bg-zinc-900 dark:text-zinc-100 dark:border-zinc-700" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-zinc-700 mb-1 dark:text-zinc-300">Email</label>
                <input name="email" type="email" value={form.email} onChange={handleChange} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none dark:bg-zinc-900 dark:text-zinc-100 dark:border-zinc-700" />
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-zinc-500 mb-3">Academic Details</p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1 dark:text-zinc-300">Education Qualification *</label>
                <select name="educationQualification" value={form.educationQualification} onChange={handleChange} required className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none dark:bg-zinc-900 dark:text-zinc-100 dark:border-zinc-700">
                  <option value="">Select qualification</option>
                  {EDUCATION_QUALIFICATIONS.map(q => (
                    <option key={q} value={q}>{q}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1 dark:text-zinc-300">Campus *</label>
                  <select name="preferredCampus" value={form.preferredCampus} onChange={handleChange} required disabled={!!defaultCampus} className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-zinc-100 disabled:text-zinc-500 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-500">
                    <option value="">Select campus</option>
                    <option value="MAIN">Main Campus</option>
                    <option value="WEST">West Campus</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1 dark:text-zinc-300">Course *</label>
                  <select name="course" value={form.course} onChange={handleChange} required className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none dark:bg-zinc-900 dark:text-zinc-100 dark:border-zinc-700">
                    <option value="">Select course</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-zinc-100 pt-4 flex flex-col sm:flex-row gap-3">
            <button type="submit" disabled={submitting} className="w-full sm:w-auto rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {submitting ? "Submitting..." : "Submit Application"}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="w-full sm:w-auto rounded-lg border border-zinc-300 bg-white px-6 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors">
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
