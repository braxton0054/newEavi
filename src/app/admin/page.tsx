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

  async function handleReview(applicationId: string, status: string) {
    try {
      const res = await fetch("/api/admin/review", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId, status }),
      });
      if (res.ok) fetchStudents(user);
    } catch (e) { console.error(e); }
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

  const pendingCount = students.filter(s => s.status === "PENDING").length;
  const approvedCount = students.filter(s => s.status === "APPROVED").length;

  return (
    <div className="min-h-screen bg-zinc-50 flex">
      <AdminSidebar role="ADMIN" campus={user?.campus} email={user?.email} />
      <div className="flex-1 min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-zinc-200 px-6 lg:px-8 py-3.5 sticky top-0 z-30">
          <div className="flex items-center justify-between">
            <div className="lg:pl-0 pl-10">
              <h1 className="text-base font-medium text-zinc-900">
                {user?.campus === "WEST" ? "West Campus" : "Main Campus"} Dashboard
              </h1>
              <p className="text-xs text-zinc-400 mt-0.5">Student applications for your campus</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-white border border-zinc-200 rounded-lg px-3 py-1.5 text-sm text-zinc-400 w-44">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="bg-transparent text-sm text-zinc-900 placeholder:text-zinc-400 outline-none w-full"
                />
              </div>
              <ManualApplyForm defaultCampus={user?.campus} onSuccess={() => fetchStudents(user)} />
            </div>
          </div>
        </header>

        <main className="px-6 lg:px-8 py-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-gray-200/80 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Total</span>
                <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-[#0066ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{students.length}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200/80 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Approved</span>
                <div className="w-7 h-7 rounded-lg bg-green-50 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
              </div>
              <p className="text-2xl font-bold text-emerald-600">{approvedCount}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200/80 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Pending</span>
                <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
              </div>
              <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
            </div>
          </div>

          {/* Student List */}
          {filtered.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200/80 p-12 text-center">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              <p className="text-sm text-gray-500">No applications found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((student) => (
                <div key={student.id} className="bg-white rounded-xl border border-gray-200/80 overflow-hidden">
                  {editingId === student.id ? (
                    <div className="p-5">
                      <h3 className="text-sm font-semibold text-gray-900 mb-4">Edit Student</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                        <div>
                          <label className="block text-[11px] font-medium text-gray-500 mb-1">First Name</label>
                          <input value={editForm.firstName} onChange={e => setEditForm({...editForm, firstName: e.target.value})} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0066ff]/20 focus:border-[#0066ff]" />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-gray-500 mb-1">Middle Name</label>
                          <input value={editForm.middleName} onChange={e => setEditForm({...editForm, middleName: e.target.value})} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0066ff]/20 focus:border-[#0066ff]" />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-gray-500 mb-1">Last Name</label>
                          <input value={editForm.lastName} onChange={e => setEditForm({...editForm, lastName: e.target.value})} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0066ff]/20 focus:border-[#0066ff]" />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="block text-[11px] font-medium text-gray-500 mb-1">Phone</label>
                          <input value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0066ff]/20 focus:border-[#0066ff]" />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-gray-500 mb-1">Email</label>
                          <input value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0066ff]/20 focus:border-[#0066ff]" />
                        </div>
                      </div>
                      <div className="mb-4">
                        <label className="block text-[11px] font-medium text-gray-500 mb-1">Education Qualification</label>
                        <input value={editForm.educationQualification} onChange={e => setEditForm({...editForm, educationQualification: e.target.value})} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0066ff]/20 focus:border-[#0066ff]" placeholder="e.g. B+" />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={handleEditSave} disabled={saving} className="px-4 py-2 rounded-lg bg-[#0066ff] text-white text-xs font-semibold hover:bg-[#0052cc] disabled:opacity-50 transition-colors">
                          {saving ? "Saving..." : "Save Changes"}
                        </button>
                        <button onClick={cancelEdit} className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-xs font-semibold hover:bg-gray-200 transition-colors">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 sm:p-5">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0066ff]/10 to-[#00c9a7]/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-bold text-[#0066ff]">
                              {student.firstName[0]}{student.lastName[0]}
                            </span>
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900">
                              {student.firstName} {student.middleName ? `${student.middleName} ` : ""}{student.lastName}
                            </h3>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {student.gender && <span>{student.gender} · </span>}
                              {student.phone}
                              {student.email && <span> · {student.email}</span>}
                            </p>
                            {student.educationQualification && (
                              <p className="text-xs text-gray-400 mt-0.5">Education: {student.educationQualification}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide ${
                            student.status === "APPROVED" ? "bg-emerald-50 text-emerald-700" :
                            student.status === "REJECTED" ? "bg-red-50 text-red-700" :
                            "bg-amber-50 text-amber-700"
                          }`}>
                            {student.status}
                          </span>
                          <button onClick={() => startEdit(student)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" title="Edit">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          </button>
                          <button onClick={() => handleDelete(student.id, `${student.firstName} ${student.lastName}`)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors" title="Delete">
                            <svg className="w-4 h-4 text-gray-400 hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </div>
                      {student.applications.map((app) => (
                        <div key={app.id} className="mt-3 ml-13 pt-3 border-t border-gray-100">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs font-medium text-gray-800">{app.course} <span className="text-gray-400">·</span> {app.academicYear}</p>
                              {app.notes && <p className="text-[11px] text-gray-400 mt-0.5">{app.notes}</p>}
                            </div>
                            {app.status === "PENDING" && (
                              <div className="flex gap-2">
                                <button onClick={() => handleReview(app.id, "APPROVED")} className="px-3 py-1.5 text-[11px] font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors">Approve</button>
                                <button onClick={() => handleReview(app.id, "REJECTED")} className="px-3 py-1.5 text-[11px] font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors">Reject</button>
                              </div>
                            )}
                            {app.status === "APPROVED" && (
                              <a href={`/api/admin/admission-letter?studentId=${student.id}`} target="_blank" className="px-3 py-1.5 text-[11px] font-semibold rounded-lg bg-[#0066ff] text-white hover:bg-[#0052cc] transition-colors">Admission Letter</a>
                            )}
                          </div>
                        </div>
                      ))}
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
