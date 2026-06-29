"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { EDUCATION_QUALIFICATIONS } from "@/lib/education-qualifications";

interface Course {
  id: string;
  name: string;
}

function generateAcademicYears(): string[] {
  const currentYear = new Date().getFullYear();
  const years: string[] = [];
  for (let y = currentYear - 1; y <= currentYear + 2; y++) {
    years.push(`${y}-${y + 1}`);
  }
  return years;
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
    educationQualification: "",
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
    setForm({ ...form, [e.target.name]: e.target.value });
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
          email: "", educationQualification: "", preferredCampus: "", course: "", academicYear: "",
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* EAVI Brand Header */}
      <header className="bg-white border-b-4 border-[#d81e6f] shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-5 flex flex-col items-center text-center">
          <Image
            src="/images/eavi-logo.jpg"
            alt="East Africa Vision Institute Logo"
            width={120}
            height={120}
            className="rounded-full shadow-md mb-3"
            priority
          />
          <h1 className="text-xl sm:text-2xl font-bold text-[#1a3d63] tracking-wide">
            EAST AFRICA VISION INSTITUTE
          </h1>
          <div className="mt-2 bg-[#2d8a4e] px-4 py-1 rounded-sm">
            <span className="text-white text-xs sm:text-sm font-semibold tracking-wider uppercase">
              Leading the Leaders
            </span>
          </div>
          <p className="mt-2 text-sm text-[#d81e6f] italic font-medium">
            Nurturing quality and affordable education
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Intro */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6 text-center">
          <h2 className="text-lg sm:text-xl font-bold text-[#1a3d63] mb-2">Apply for Admission</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            Apply for admission to East Africa Vision Institute. Fill in your details below and we will process your application shortly. Our admissions team will contact you via phone or email with the next steps.
          </p>
        </div>

        {message && (
          <div className={`p-4 rounded-lg mb-6 text-sm font-medium ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 md:p-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
              <input name="firstName" value={form.firstName} onChange={handleChange} required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#2d8a4e] focus:border-[#2d8a4e] outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Middle Name</label>
              <input name="middleName" value={form.middleName} onChange={handleChange} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#2d8a4e] focus:border-[#2d8a4e] outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
              <input name="lastName" value={form.lastName} onChange={handleChange} required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#2d8a4e] focus:border-[#2d8a4e] outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              <select name="gender" value={form.gender} onChange={handleChange} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#2d8a4e] focus:border-[#2d8a4e] outline-none">
                <option value="">Select gender</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
              <input name="phone" value={form.phone} onChange={handleChange} required placeholder="e.g. 0712345678" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#2d8a4e] focus:border-[#2d8a4e] outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address <span className="text-gray-400 font-normal">(optional but recommended)</span>
            </label>
            <input name="email" type="email" value={form.email} onChange={handleChange} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#2d8a4e] focus:border-[#2d8a4e] outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Education Qualification *</label>
            <select name="educationQualification" value={form.educationQualification} onChange={handleChange} required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#2d8a4e] focus:border-[#2d8a4e] outline-none">
              <option value="">Select qualification</option>
              {EDUCATION_QUALIFICATIONS.map(q => (
                <option key={q} value={q}>{q}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Campus *</label>
              <select name="preferredCampus" value={form.preferredCampus} onChange={handleChange} required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#2d8a4e] focus:border-[#2d8a4e] outline-none">
                <option value="">Select campus</option>
                <option value="MAIN">Main Campus</option>
                <option value="WEST">West Campus</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Course *</label>
              <select name="course" value={form.course} onChange={handleChange} required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#2d8a4e] focus:border-[#2d8a4e] outline-none">
                <option value="">Select course</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year *</label>
            <select name="academicYear" value={form.academicYear} onChange={handleChange} required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#2d8a4e] focus:border-[#2d8a4e] outline-none">
              <option value="">Select year</option>
              {generateAcademicYears().map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <button type="submit" disabled={submitting} className="w-full rounded-lg bg-[#2d8a4e] px-4 py-3 font-semibold text-white hover:bg-[#236d3c] disabled:opacity-50 transition-colors shadow-sm">
            {submitting ? "Submitting..." : "Submit Application"}
          </button>
        </form>
      </main>

      {/* Footer */}
      <footer className="bg-[#1a3d63] text-white mt-12">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center text-sm space-y-1">
          <p className="font-semibold">East Africa Vision Institute</p>
          <p className="text-gray-300">Main Campus — Nairobi, Kenya | West Campus — Nakuru, Kenya</p>
          <p className="text-gray-300">Phone: +254 700 000 000 | Email: admissions@eavicollege.ac.ke</p>
          <p className="text-gray-400 text-xs mt-2">© {new Date().getFullYear()} EAVI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
