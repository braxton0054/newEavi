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
    firstName: "",
    middleName: "",
    lastName: "",
    gender: "",
    phone: "",
    email: "",
    educationQualification: "",
    preferredCampus: "MAIN",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchUser();
  }, []);

  async function fetchUser() {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (res.ok && data.user?.role === "SUPER_ADMIN") {
        setUser(data.user);
        fetchStudents();
      } else {
        router.push("/login");
      }
    } catch {
      router.push("/login");
    }
  }

  async function fetchStudents() {
    try {
      const res = await fetch("/api/admin/students");
      const data = await res.json();
      if (res.ok) setStudents(data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
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
      firstName: student.firstName,
      middleName: student.middleName || "",
      lastName: student.lastName,
      gender: student.gender || "",
      phone: student.phone || "",
      email: student.email || "",
      educationQualification: student.educationQualification || "",
      preferredCampus: student.preferredCampus,
    });
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function handleEditSave() {
    if (!editingId) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/students", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingId, ...editForm }),
      });
      if (res.ok) {
        cancelEdit();
        fetchStudents();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update student");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(studentId: string, studentName: string) {
    if (!confirm(`Delete ${studentName}? This will also delete all their applications. This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/students?id=${studentId}`, { method: "DELETE" });
      if (res.ok) {
        fetchStudents();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete student");
      }
    } catch (e) {
      console.error(e);
    }
  }

  const filtered = filter === "all" ? students : students.filter(s => s.preferredCampus === filter);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  const mainCount = students.filter(s => s.preferredCampus === "MAIN").length;
  const westCount = students.filter(s => s.preferredCampus === "WEST").length;
  const pendingCount = students.filter(s => s.status === "PENDING").length;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar role="SUPER_ADMIN" email={user?.email} />
      <div className="flex-1 min-w-0 lg:ml-72">
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center justify-between gap-4 lg:pl-6">
          <div className="lg:pl-0 pl-12">
            <h1 className="text-xl font-bold text-gray-900">Super Admin Dashboard</h1>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex items-center justify-end mb-4">
            <ManualApplyForm onSuccess={() => fetchStudents()} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4">
              <p className="text-2xl font-bold text-gray-900">{students.length}</p>
              <p className="text-sm text-gray-500">Total Applications</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <p className="text-2xl font-bold text-blue-600">{mainCount}</p>
              <p className="text-sm text-gray-500">Main Campus</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <p className="text-2xl font-bold text-purple-600">{westCount}</p>
              <p className="text-sm text-gray-500">West Campus</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
              <p className="text-sm text-gray-500">Pending Review</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {["all", "MAIN", "WEST"].map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f ? "bg-blue-600 text-white" : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"}`}>
                {f === "all" ? "All" : f === "MAIN" ? "Main Campus" : "West Campus"}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <p className="text-gray-500">No applications found.</p>
          ) : (
            <div className="space-y-4">
              {filtered.map((student) => (
                <div key={student.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                  {editingId === student.id ? (
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-900 mb-2">Edit Student</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">First Name</label>
                          <input value={editForm.firstName} onChange={e => setEditForm({...editForm, firstName: e.target.value})} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Middle Name</label>
                          <input value={editForm.middleName} onChange={e => setEditForm({...editForm, middleName: e.target.value})} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Last Name</label>
                          <input value={editForm.lastName} onChange={e => setEditForm({...editForm, lastName: e.target.value})} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Gender</label>
                          <select value={editForm.gender} onChange={e => setEditForm({...editForm, gender: e.target.value})} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                            <option value="">Select</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
                          <input value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                          <input value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Education Qualification</label>
                          <input value={editForm.educationQualification} onChange={e => setEditForm({...editForm, educationQualification: e.target.value})} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="e.g. B+" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Preferred Campus</label>
                        <select value={editForm.preferredCampus} onChange={e => setEditForm({...editForm, preferredCampus: e.target.value})} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                          <option value="MAIN">Main Campus</option>
                          <option value="WEST">West Campus</option>
                        </select>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <button onClick={handleEditSave} disabled={saving} className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50">
                          {saving ? "Saving..." : "Save Changes"}
                        </button>
                        <button onClick={cancelEdit} className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {student.firstName} {student.middleName ? `${student.middleName} ` : ""}{student.lastName}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {student.gender ? `${student.gender} | ` : ""}{student.phone}
                            {student.email ? ` | ${student.email}` : ""}
                          </p>
                          <p className="text-sm text-gray-500">
                            Education: {student.educationQualification || "N/A"} | {student.preferredCampus === "MAIN" ? "Main Campus" : "West Campus"}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            student.status === "APPROVED" ? "bg-green-100 text-green-700" :
                            student.status === "REJECTED" ? "bg-red-100 text-red-700" :
                            "bg-yellow-100 text-yellow-700"
                          }`}>
                            {student.status}
                          </span>
                          <div className="flex gap-2">
                            <button onClick={() => startEdit(student)} className="text-xs text-blue-600 hover:underline">Edit</button>
                            <button onClick={() => handleDelete(student.id, `${student.firstName} ${student.lastName}`)} className="text-xs text-red-600 hover:underline">Delete</button>
                          </div>
                        </div>
                      </div>
                      {student.applications.map((app) => (
                        <div key={app.id} className="border-t border-gray-100 pt-4 mt-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium">{app.course} - {app.academicYear}</p>
                              {app.notes && <p className="text-xs text-gray-500 mt-1">Notes: {app.notes}</p>}
                            </div>
                            {app.status === "PENDING" && (
                              <div className="flex gap-2">
                                <button onClick={() => handleReview(app.id, "APPROVED")} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-green-600 text-white hover:bg-green-700">
                                  Approve
                                </button>
                                <button onClick={() => handleReview(app.id, "REJECTED")} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-600 text-white hover:bg-red-700">
                                  Reject
                                </button>
                              </div>
                            )}
                            {app.status === "APPROVED" && (
                              <a
                                href={`/api/admin/admission-letter?studentId=${student.id}`}
                                target="_blank"
                                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                              >
                                Admission Letter
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
