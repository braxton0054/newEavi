"use client";

import { useState, useEffect } from "react";

interface Course {
  id: string;
  name: string;
  minGrade: string | null;
  feePdf: string | null;
}

export default function ApplyPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [form, setForm] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    gender: "",
    phone: "",
    email: "",
    kcseGrade: "",
    preferredCampus: "",
    course: "",
    academicYear: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/courses")
      .then(r => r.json())
      .then(d => { if (d.data) setCourses(d.data); })
      .catch(() => {});
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value, ...(e.target.name === "preferredCampus" ? { course: "" } : {}) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
        setMessage({ type: "success", text: "Application submitted successfully! You will be contacted soon." });
        setForm({
          firstName: "", middleName: "", lastName: "", gender: "", phone: "",
          email: "", kcseGrade: "", preferredCampus: "", course: "", academicYear: "",
        });
      } else {
        setMessage({ type: "error", text: data.error || "Something went wrong." });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to submit application." });
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCourse = courses.find(c => c.id === form.course);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8 text-center">Student Application Form</h1>
        {message && (
          <div className={`p-4 rounded-lg mb-6 ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
            {message.text}
          </div>
        )}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 md:p-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
              <input name="firstName" value={form.firstName} onChange={handleChange} required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Middle Name</label>
              <input name="middleName" value={form.middleName} onChange={handleChange} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
              <input name="lastName" value={form.lastName} onChange={handleChange} required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              <select name="gender" value={form.gender} onChange={handleChange} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                <option value="">Select gender</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
              <input name="phone" value={form.phone} onChange={handleChange} required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address <span className="text-gray-400 font-normal">(optional but recommended)</span>
            </label>
            <input name="email" type="email" value={form.email} onChange={handleChange} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">KCSE/KCPE Grade</label>
            <input name="kcseGrade" value={form.kcseGrade} onChange={handleChange} placeholder="e.g. B+, A-, 350 marks" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Campus *</label>
              <select name="preferredCampus" value={form.preferredCampus} onChange={handleChange} required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                <option value="">Select campus</option>
                <option value="MAIN">Main Campus</option>
                <option value="WEST">West Campus</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Course *</label>
              <select name="course" value={form.course} onChange={handleChange} required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                <option value="">Select course</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.name}{c.minGrade ? ` (Min: ${c.minGrade})` : ""}</option>
                ))}
              </select>
            </div>
          </div>
          {selectedCourse?.feePdf && (
            <p className="text-xs text-blue-600">
              <a href={selectedCourse.feePdf} target="_blank" rel="noopener noreferrer" className="hover:underline">View Fee Structure for {selectedCourse.name}</a>
            </p>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year *</label>
            <select name="academicYear" value={form.academicYear} onChange={handleChange} required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
              <option value="">Select year</option>
              <option value="2026-2027">2026-2027</option>
              <option value="2027-2028">2027-2028</option>
            </select>
          </div>
          <button type="submit" disabled={submitting} className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {submitting ? "Submitting..." : "Submit Application"}
          </button>
        </form>
      </div>
    </div>
  );
}
