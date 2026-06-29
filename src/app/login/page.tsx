"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/sign-in/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        const me = await fetch("/api/auth/me");
        const { user } = await me.json();
        if (user?.role === "SUPER_ADMIN") {
          router.push("/super-admin");
        } else {
          router.push("/admin");
        }
      } else {
        setError(data.error || data.message || "Invalid credentials");
      }
    } catch {
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-sm w-full">
        {/* EAVI Branding */}
        <div className="flex flex-col items-center mb-8">
          <Image
            src="/images/eavi-logo.jpg"
            alt="East Africa Vision Institute Logo"
            width={80}
            height={80}
            className="rounded-full shadow-md mb-3"
            priority
          />
          <h1 className="text-lg sm:text-xl font-bold text-[#1a3d63] tracking-wide text-center">
            EAST AFRICA VISION INSTITUTE
          </h1>
          <p className="text-xs text-[#d81e6f] italic mt-1">
            Nurturing quality and affordable education
          </p>
        </div>

        <h2 className="text-xl font-semibold text-center text-gray-800 mb-5">Admin Login</h2>
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 md:p-8 space-y-4">
          {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#2d8a4e] focus:border-[#2d8a4e] outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#2d8a4e] focus:border-[#2d8a4e] outline-none" />
          </div>
          <button type="submit" disabled={loading} className="w-full rounded-lg bg-[#2d8a4e] px-4 py-2.5 font-semibold text-white hover:bg-[#236d3c] disabled:opacity-50 transition-colors">
            {loading ? "Signing in..." : "Sign In"}
          </button>
          <p className="text-center text-sm text-gray-500">
            <Link href="/" className="text-[#2d8a4e] hover:underline">Back to home</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
