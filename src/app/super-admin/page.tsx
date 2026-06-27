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
  kcseGrade: string | null;
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
                        KCSE: {student.kcseGrade || "N/A"} | {student.preferredCampus === "MAIN" ? "Main Campus" : "West Campus"}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      student.status === "APPROVED" ? "bg-green-100 text-green-700" :
                      student.status === "REJECTED" ? "bg-red-100 text-red-700" :
                      "bg-yellow-100 text-yellow-700"
                    }`}>
                      {student.status}
                    </span>
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
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
