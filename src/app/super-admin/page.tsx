"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ManualApplyForm from "@/components/ManualApplyForm";
import AdminSidebar from "@/components/AdminSidebar";

interface Student {
  id: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  gender: string | null;
  phone: string | null;
  email: string | null;
  educationQualification: string | null;
  preferredCampus: string;
  status: string;
  createdAt: string;
  applications: Application[];
}

interface Application {
  id: string;
  course: string;
  academicYear: string;
  status: string;
  notes: string | null;
}

export default function SuperAdminDashboard() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [user, setUser] = useState<any>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    firstName: "", middleName: "", lastName: "", gender: "",
    phone: "", email: "", educationQualification: "", preferredCampus: "MAIN",
  });
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => { fetchUser(); }, []);

  async function fetchUser() {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (res.ok && data.user?.role === "SUPER_ADMIN") {
        setUser(data.user);
        fetchStudents();
      } else { router.push("/login"); }
    } catch { router.push("/login"); }
  }

  async function fetchStudents() {
    try {
      const res = await fetch("/api/admin/students");
      const data = await res.json();
      if (res.ok) setStudents(data.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function handleReview(applicationId: string, status: string) {
    await fetch("/api/admin/review", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ applicationId, status }),
    });
    fetchStudents();
  }

  function startEdit(student: Student) {
    setEditingId(student.id);
    setEditForm({
      firstName: student.firstName, middleName: student.middleName || "",
      lastName: student.lastName, gender: student.gender || "",
      phone: student.phone || "", email: student.email || "",
      educationQualification: student.educationQualification || "",
      preferredCampus: student.preferredCampus,
    });
  }

  function cancelEdit() { setEditingId(null); }

  async function handleEditSave() {
    if (!editingId) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/students", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingId, ...editForm }),
      });
      if (res.ok) { cancelEdit(); fetchStudents(); }
      else { const data = await res.json(); alert(data.error || "Failed to update"); }
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  }

  async function handleDelete(studentId: string, name: string) {
    if (!confirm(`Delete ${name}? This will remove all their applications. Cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/students?id=${studentId}`, { method: "DELETE" });
      if (res.ok) fetchStudents();
      else { const data = await res.json(); alert(data.error || "Failed to delete"); }
    } catch (e) { console.error(e); }
  }

  const filtered = students.filter(s => {
    if (filter !== "all" && s.preferredCampus !== filter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const name = `${s.firstName} ${s.middleName || ""} ${s.lastName}`.toLowerCase();
      if (!name.includes(q) && !s.phone?.includes(q) && !s.email?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <div className="w-7 h-7 border-2 border-blue-700 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  const totalStudents = students.length;
  const mainCount = students.filter(s => s.preferredCampus === "MAIN").length;
  const westCount = students.filter(s => s.preferredCampus === "WEST").length;
  const pendingCount = students.filter(s => s.status === "PENDING").length;
  const approvedCount = students.filter(s => s.status === "APPROVED").length;

  return (
    <div className="min-h-screen bg-zinc-50 flex">
      <AdminSidebar role="SUPER_ADMIN" email={user?.email} />
      <div className="flex-1 min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-zinc-200 px-6 lg:px-8 py-3.5 sticky top-0 z-30">
          <div className="flex items-center justify-between">
            <div className="lg:pl-0 pl-10">
              <h1 className="text-base font-medium text-zinc-900">Dashboard</h1>
              <p className="text-xs text-zinc-400 mt-0.5">Manage student applications</p>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-2 bg-white border border-zinc-200 rounded-lg px-3 py-1.5 text-sm text-zinc-400 w-44">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search students..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="bg-transparent text-sm text-zinc-900 placeholder:text-zinc-400 outline-none w-full"
                />
              </div>
              <ManualApplyForm onSuccess={() => fetchStudents()} />
            </div>
          </div>
        </header>

        <main className="px-6 lg:px-8 py-5">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
            <div className="bg-white border border-zinc-200 rounded-xl p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wide">Total</span>
                <div className="w-7 h-7 rounded-md bg-blue-50 text-blue-700 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                </div>
              </div>
              <p className="text-2xl font-medium text-zinc-900">{totalStudents}</p>
              <p className="text-[11px] text-zinc-400">all students</p>
            </div>
            <div className="bg-white border border-zinc-200 rounded-xl p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wide">Approved</span>
                <div className="w-7 h-7 rounded-md bg-green-50 text-green-700 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
              </div>
              <p className="text-2xl font-medium text-zinc-900">{approvedCount}</p>
              <p className="text-[11px] text-zinc-400">enrolled</p>
            </div>
            <div className="bg-white border border-zinc-200 rounded-xl p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wide">Pending</span>
                <div className="w-7 h-7 rounded-md bg-amber-50 text-amber-700 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
              </div>
              <p className="text-2xl font-medium text-zinc-900">{pendingCount}</p>
              <p className="text-[11px] text-zinc-400">awaiting review</p>
            </div>
            <div className="bg-white border border-zinc-200 rounded-xl p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wide">Campuses</span>
                <div className="w-7 h-7 rounded-md bg-violet-50 text-violet-700 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                </div>
              </div>
              <p className="text-2xl font-medium text-zinc-900">{mainCount} <span className="text-sm font-normal text-zinc-400">/ {westCount}</span></p>
              <p className="text-[11px] text-zinc-400">main / west</p>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 mb-4">
            {["all", "MAIN", "WEST"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={
                  filter === f
                    ? "px-3.5 py-1 rounded-full bg-blue-700 text-white text-xs font-medium border border-blue-700"
                    : "px-3.5 py-1 rounded-full bg-white text-zinc-500 text-xs font-medium border border-zinc-200 hover:border-zinc-400 transition-colors"
                }
              >
                {f === "all" ? "All campuses" : f === "MAIN" ? `Main campus (${mainCount})` : `West campus (${westCount})`}
              </button>
            ))}
            <span className="ml-auto text-[11px] text-zinc-400">{filtered.length} student{filtered.length !== 1 ? "s" : ""}</span>
          </div>

          {/* Student List */}
          {filtered.length === 0 ? (
            <div className="bg-white border border-zinc-200 rounded-xl p-12 text-center">
              <svg className="w-10 h-10 text-zinc-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              <p className="text-sm text-zinc-500">No students found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((student) => (
                <div key={student.id} className="bg-white border border-zinc-200 rounded-xl p-4">
                  {editingId === student.id ? (
                    <div>
                      <h3 className="text-sm font-medium text-zinc-900 mb-3">Edit student</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                        <div>
                          <label className="block text-[11px] font-medium text-zinc-500 mb-1">First name</label>
                          <input value={editForm.firstName} onChange={e => setEditForm({...editForm, firstName: e.target.value})} className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700" />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-zinc-500 mb-1">Middle name</label>
                          <input value={editForm.middleName} onChange={e => setEditForm({...editForm, middleName: e.target.value})} className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700" />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-zinc-500 mb-1">Last name</label>
                          <input value={editForm.lastName} onChange={e => setEditForm({...editForm, lastName: e.target.value})} className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700" />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="block text-[11px] font-medium text-zinc-500 mb-1">Gender</label>
                          <select value={editForm.gender} onChange={e => setEditForm({...editForm, gender: e.target.value})} className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700">
                            <option value="">Select</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-zinc-500 mb-1">Phone</label>
                          <input value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700" />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="block text-[11px] font-medium text-zinc-500 mb-1">Email</label>
                          <input value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700" />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-zinc-500 mb-1">Education qualification</label>
                          <input value={editForm.educationQualification} onChange={e => setEditForm({...editForm, educationQualification: e.target.value})} className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700" placeholder="e.g. B+" />
                        </div>
                      </div>
                      <div className="mb-4">
                        <label className="block text-[11px] font-medium text-zinc-500 mb-1">Preferred campus</label>
                        <select value={editForm.preferredCampus} onChange={e => setEditForm({...editForm, preferredCampus: e.target.value})} className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700">
                          <option value="MAIN">Main campus</option>
                          <option value="WEST">West campus</option>
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={handleEditSave} disabled={saving} className="flex items-center gap-1.5 bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium rounded-lg px-3.5 py-1.5 transition-colors disabled:opacity-50">
                          {saving ? "Saving..." : "Save changes"}
                        </button>
                        <button onClick={cancelEdit} className="px-3.5 py-1.5 rounded-lg bg-zinc-100 text-zinc-700 text-sm font-medium hover:bg-zinc-200 transition-colors">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center text-sm font-medium shrink-0">
                            {student.firstName[0]}{student.lastName[0]}
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-zinc-900">
                              {student.firstName} {student.middleName ? `${student.middleName} ` : ""}{student.lastName}
                            </h3>
                            <p className="text-xs text-zinc-500 mt-0.5">
                              {student.gender && <span>{student.gender} · </span>}
                              {student.phone}
                              {student.email && <span> · {student.email}</span>}
                            </p>
                            <p className="text-xs text-zinc-500 mt-0.5">
                              {student.educationQualification && <span>Education: {student.educationQualification} · </span>}
                              <span className="inline-flex items-center gap-1">
                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-600 mr-1 align-middle"></span>
                                {student.preferredCampus === "MAIN" ? "Main" : "West"} campus
                              </span>
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={
                            student.status === "APPROVED" ? "bg-green-50 text-green-700 border border-green-200 rounded-full text-[11px] font-medium px-2.5 py-0.5" :
                            student.status === "REJECTED" ? "bg-red-50 text-red-700 border border-red-200 rounded-full text-[11px] font-medium px-2.5 py-0.5" :
                            "bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[11px] font-medium px-2.5 py-0.5"
                          }>
                            {student.status === "APPROVED" ? "Approved" : student.status === "REJECTED" ? "Rejected" : "Pending"}
                          </span>
                          <button onClick={() => startEdit(student)} className="w-7 h-7 rounded-lg border border-zinc-200 bg-zinc-50 flex items-center justify-center text-zinc-500 hover:bg-zinc-100 transition-colors" title="Edit">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          </button>
                          <button onClick={() => handleDelete(student.id, `${student.firstName} ${student.lastName}`)} className="w-7 h-7 rounded-lg border border-zinc-200 bg-zinc-50 flex items-center justify-center text-zinc-500 hover:bg-zinc-100 transition-colors" title="Delete">
                            <svg className="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </div>
                      {/* Applications */}
                      {student.applications.map((app) => (
                        <div key={app.id} className="mt-3 ml-[52px]">
                          <div className="border-t border-zinc-200 my-3"></div>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-zinc-500">
                                <span className="text-blue-700 font-medium">{app.course}</span> · {app.academicYear}
                              </p>
                              {app.notes && <p className="text-[11px] text-zinc-400 mt-0.5">{app.notes}</p>}
                            </div>
                            {app.status === "PENDING" && (
                              <div className="flex gap-2">
                                <button onClick={() => handleReview(app.id, "APPROVED")} className="px-3 py-1.5 text-[11px] font-medium rounded-lg bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors">
                                  Approve
                                </button>
                                <button onClick={() => handleReview(app.id, "REJECTED")} className="px-3 py-1.5 text-[11px] font-medium rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors">
                                  Reject
                                </button>
                              </div>
                            )}
                            {app.status === "APPROVED" && (
                              <a
                                href={`/api/admin/admission-letter?studentId=${student.id}`}
                                target="_blank"
                                className="flex items-center gap-1.5 border border-blue-700 text-blue-700 text-xs font-medium rounded-lg px-3.5 py-1.5 hover:bg-blue-50 transition-colors"
                              >
                                Admission letter
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </>
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
