"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ManualApplyForm from "@/components/ManualApplyForm";

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
  status: string;
  notes: string | null;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    firstName: "", middleName: "", lastName: "", gender: "",
    phone: "", email: "", educationQualification: "", preferredCampus: "MAIN",
  });
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => { fetchUser(); }, []);

  async function fetchUser() {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (res.ok && data.user) {
        if (data.user.role === "SUPER_ADMIN") { router.push("/super-admin"); return; }
        setUser(data.user);
        fetchStudents(data.user);
      } else { router.push("/login"); }
    } catch { router.push("/login"); }
  }

  async function fetchStudents(u: any) {
    try {
      const campus = u.campus || "";
      const res = await fetch(`/api/admin/students${campus ? `?campus=${campus}` : ""}`);
      const data = await res.json();
      if (res.ok) setStudents(data.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
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
      if (res.ok) { cancelEdit(); fetchStudents(user); }
      else { const data = await res.json(); alert(data.error || "Failed to update"); }
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  }

  async function handleDelete(studentId: string, name: string) {
    if (!confirm(`Delete ${name}? This will remove all their applications. Cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/students?id=${studentId}`, { method: "DELETE" });
      if (res.ok) fetchStudents(user);
      else { const data = await res.json(); alert(data.error || "Failed to delete"); }
    } catch (e) { console.error(e); }
  }

  const filtered = students.filter(s => {
    if (statusFilter !== "all" && s.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const name = `${s.firstName} ${s.middleName || ""} ${s.lastName}`.toLowerCase();
      if (!name.includes(q) && !s.phone?.includes(q) && !s.email?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-[3px] border-blue-700 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const totalCount = students.length;
  const pendingCount = students.filter(s => s.status === "PENDING").length;
  const approvedCount = students.filter(s => s.status === "APPROVED").length;
  const rejectedCount = students.filter(s => s.status === "REJECTED").length;
  const campusLabel = user?.campus === "WEST" ? "West" : "Main";

  const statusColors: Record<string, string> = {
    PENDING: "bg-amber-50 text-amber-700 border-amber-200",
    APPROVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
    REJECTED: "bg-red-50 text-red-700 border-red-200",
  };

  const statusDotColors: Record<string, string> = {
    PENDING: "bg-amber-500",
    APPROVED: "bg-emerald-500",
    REJECTED: "bg-red-500",
  };

  return (
    <>
      <header className="bg-white border-b border-zinc-100 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 sticky top-0 z-30">
        <div className="flex items-center gap-3 min-h-10">
          <div className="w-12 lg:hidden shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5">
              <h1 className="text-base sm:text-lg font-semibold text-zinc-900">{campusLabel} campus</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-medium border border-blue-100 shrink-0">{totalCount} students</span>
            </div>
            <p className="text-[11px] sm:text-xs text-zinc-400 mt-0.5">Review and manage student applications</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="mb-6">
          <ManualApplyForm defaultCampus={user?.campus} onSuccess={() => fetchStudents(user)} />
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 mb-6">
          <div className="bg-white rounded-xl border border-zinc-100 p-3 sm:p-4 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Total</span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-zinc-900">{totalCount}</p>
            <p className="text-[10px] sm:text-[11px] text-zinc-400">all registered</p>
          </div>
          <div className="bg-white rounded-xl border border-zinc-100 p-3 sm:p-4 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Approved</span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-zinc-900">{approvedCount}</p>
            <p className="text-[10px] sm:text-[11px] text-zinc-400">enrolled</p>
          </div>
          <div className="bg-white rounded-xl border border-zinc-100 p-3 sm:p-4 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Pending</span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-zinc-900">{pendingCount}</p>
            <p className="text-[10px] sm:text-[11px] text-zinc-400">awaiting review</p>
          </div>
          <div className="bg-white rounded-xl border border-zinc-100 p-3 sm:p-4 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Rejected</span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-zinc-900">{rejectedCount}</p>
            <p className="text-[10px] sm:text-[11px] text-zinc-400">not admitted</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
          <div className="flex overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0 scrollbar-none">
            <div className="flex items-center gap-1.5 bg-white rounded-xl border border-zinc-100 p-1 shrink-0">
              {[
                { key: "all", label: "All" },
                { key: "PENDING", label: "Pending" },
                { key: "APPROVED", label: "Approved" },
                { key: "REJECTED", label: "Rejected" },
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setStatusFilter(f.key)}
                  className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap min-h-10 ${
                    statusFilter === f.key
                      ? "bg-zinc-900 text-white shadow-sm"
                      : "text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 sm:ml-auto">
            <div className="flex items-center gap-2 bg-white border border-zinc-200 rounded-xl px-3.5 py-2.5 sm:py-2 text-sm text-zinc-400 flex-1 sm:flex-initial sm:w-60 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-500/10 transition-all">
              <svg className="w-3.5 h-3.5 shrink-0 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by name, phone or email..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-transparent text-sm text-zinc-900 placeholder:text-zinc-400 outline-none w-full"
              />
            </div>
            <span className="text-[11px] text-zinc-400 whitespace-nowrap bg-white px-2.5 py-1 rounded-lg border border-zinc-100">
              {filtered.length} / {totalCount}
            </span>
          </div>
        </div>

        {/* Student List */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-zinc-100 p-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-zinc-50 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </div>
            <p className="text-sm font-medium text-zinc-600">No students found</p>
            <p className="text-xs text-zinc-400 mt-1">Try adjusting your search or filter</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((student) => (
              <div key={student.id} className="bg-white rounded-xl border border-zinc-100 overflow-hidden transition-all duration-150 hover:border-zinc-200 hover:shadow-sm">
                {editingId === student.id ? (
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                      <h3 className="text-sm font-semibold text-zinc-900">Edit student</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                      {["firstName", "middleName", "lastName"].map((field) => (
                        <div key={field}>
                          <label className="block text-[11px] font-medium text-zinc-500 mb-1 capitalize">{field.replace(/([A-Z])/g, ' $1').trim()}</label>
                          <input value={(editForm as any)[field]} onChange={e => setEditForm({...editForm, [field]: e.target.value})} className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700" />
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block text-[11px] font-medium text-zinc-500 mb-1">Phone</label>
                        <input value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-zinc-500 mb-1">Email</label>
                        <input value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700" />
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
                      <button onClick={handleEditSave} disabled={saving} className="inline-flex items-center gap-1.5 bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium rounded-lg px-4 py-2 transition-colors disabled:opacity-50">
                        {saving ? "Saving..." : "Save changes"}
                      </button>
                      <button onClick={cancelEdit} className="px-4 py-2 rounded-lg bg-zinc-100 text-zinc-700 text-sm font-medium hover:bg-zinc-200 transition-colors">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 text-blue-700 flex items-center justify-center text-sm font-semibold shrink-0 shadow-sm">
                          {student.firstName[0]}{student.lastName[0]}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-semibold text-zinc-900">
                              {student.firstName} {student.middleName ? `${student.middleName} ` : ""}{student.lastName}
                            </h3>
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${statusColors[student.status] || "bg-zinc-50 text-zinc-600 border-zinc-200"}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${statusDotColors[student.status] || "bg-zinc-400"}`} />
                              {student.status === "APPROVED" ? "Approved" : student.status === "REJECTED" ? "Rejected" : "Pending"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500 flex-wrap">
                            {student.gender && <span>{student.gender}</span>}
                            {student.phone && <span className="text-zinc-300">·</span>}
                            {student.phone && <span>{student.phone}</span>}
                            {student.email && <span className="text-zinc-300">·</span>}
                            {student.email && <span className="truncate max-w-[200px]">{student.email}</span>}
                          </div>
                          <div className="flex items-center gap-3 mt-1.5 text-[11px] text-zinc-400">
                            {student.educationQualification && (
                              <span className="inline-flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /></svg>
                                {student.educationQualification}
                              </span>
                            )}
                            <span className="inline-flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                              {student.preferredCampus === "MAIN" ? "Main campus" : "West campus"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => startEdit(student)} className="w-8 h-8 rounded-lg border border-zinc-200 bg-white flex items-center justify-center text-zinc-400 hover:text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50 transition-all" title="Edit">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button onClick={() => handleDelete(student.id, `${student.firstName} ${student.lastName}`)} className="w-8 h-8 rounded-lg border border-zinc-200 bg-white flex items-center justify-center text-zinc-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-all" title="Delete">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </div>

                    {/* Applications */}
                    {student.applications.length > 0 && (
                      <div className="mt-3 ml-[52px] border-t border-zinc-50 pt-3">
                        {student.applications.map((app) => (
                          <div key={app.id} className="flex items-center justify-between py-1.5">
                            <div className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                              <div>
                                <span className="text-xs font-medium text-zinc-700">{app.course}</span>
                                {app.notes && <span className="text-[11px] text-zinc-400 ml-2">· {app.notes}</span>}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {app.status === "APPROVED" && (
                                <a href={`/api/admin/admission-letter?studentId=${student.id}`} target="_blank" className="inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-medium rounded-lg bg-blue-600 text-white border border-blue-600 hover:bg-blue-700 transition-colors">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                  Letter
                                </a>
                              )}
                            </div>
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
