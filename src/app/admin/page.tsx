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

export default function AdminDashboard() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetchUser();
  }, []);

  async function fetchUser() {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (res.ok && data.user) {
        if (data.user.role === "SUPER_ADMIN") {
          router.push("/super-admin");
          return;
        }
        setUser(data.user);
        fetchStudents(data.user);
      } else {
        router.push("/login");
      }
    } catch {
      router.push("/login");
    }
  }

  async function fetchStudents(u: any) {
    try {
      const campus = u.campus || "";
      const res = await fetch(`/api/admin/students${campus ? `?campus=${campus}` : ""}`);
      const data = await res.json();
      if (res.ok) setStudents(data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleReview(applicationId: string, status: string) {
    try {
      const res = await fetch("/api/admin/review", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId, status }),
      });
      if (res.ok) {
        fetchStudents(user);
      }
    } catch (e) {
      console.error(e);
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar role="ADMIN" campus={user?.campus} email={user?.email} />
      <div className="flex-1 min-w-0 lg:ml-72">
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center justify-between gap-4 lg:pl-6">
          <div className="lg:pl-0 pl-12">
            <h1 className="text-xl font-bold text-gray-900">
              {user?.campus === "WEST" ? "West Campus" : "Main Campus"} Admin Dashboard
            </h1>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Student Applications ({students.length})</h2>
            <ManualApplyForm defaultCampus={user?.campus} onSuccess={() => fetchStudents(user)} />
          </div>
          {students.length === 0 ? (
            <p className="text-gray-500">No applications found.</p>
          ) : (
            <div className="space-y-4">
              {students.map((student) => (
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
                        KCSE: {student.kcseGrade || "N/A"}
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
                            <button onClick={() => handleReview(app.id, "APPROVED")} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors">
                              Approve
                            </button>
                            <button onClick={() => handleReview(app.id, "REJECTED")} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors">
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
