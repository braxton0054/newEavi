"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
        body: JSON.stringify({ email, password, rememberMe: true }),
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

  const formContent = (
    <>
      <h2 className="text-lg font-semibold text-gray-900 text-center mb-1">
        Admin Login
      </h2>
      <p className="text-xs text-gray-500 text-center mb-5">
        Sign in to access the admission portal
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Error banner */}
        {error && (
          <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
            <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="you@example.com"
            className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-[#2d8a4e]/25 focus:border-[#2d8a4e] outline-none transition-shadow"
          />
        </div>

        {/* Password with show/hide toggle */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="Enter your password"
              className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-[#2d8a4e]/25 focus:border-[#2d8a4e] outline-none transition-shadow"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-[#2d8a4e] px-4 py-2.5 font-semibold text-white hover:bg-[#23743f] disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px] flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Signing in...
            </>
          ) : (
            "Sign In"
          )}
        </button>
        <p className="text-center mt-2">
          <Link href="/forgot-password" className="text-xs text-[#2d8a4e] hover:text-[#23743f] transition-colors">
            Forgot password?
          </Link>
        </p>
      </form>

      {/* Back to home — subtle */}
      <p className="text-center text-xs text-gray-400 mt-4">
        <Link href="/" className="hover:text-gray-600 transition-colors">
          Back to home
        </Link>
      </p>
    </>
  );

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* ─── Desktop: Left brand panel (lg+) ─── */}
      <div className="hidden lg:flex lg:w-[45%] bg-[#1a3d63] items-center justify-center p-10 relative overflow-hidden">
        {/* Subtle radial pattern */}
        <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(circle_at_50%_30%,white_0%,transparent_60%)]" />
        <div className="relative z-10 max-w-sm text-center text-white">
          <div className="w-20 aspect-square relative mx-auto mb-5">
            <Image
              src="/images/eavi-logo.jpg"
              alt="East Africa Vision Institute Logo"
              fill
              className="shadow-lg object-cover ring-2 ring-white/10"
              priority
            />
          </div>
          <h1 className="text-xl font-bold tracking-wide leading-snug">
            EAST AFRICA VISION INSTITUTE
          </h1>
          <div className="mt-3 bg-[#d81e6f] px-4 py-1 rounded-sm inline-block">
            <span className="text-white text-xs font-semibold tracking-widest uppercase">
              Leading the Leaders
            </span>
          </div>
          <p className="mt-4 text-sm text-gray-300 italic leading-relaxed">
            Nurturing quality and affordable education
          </p>
          <p className="mt-6 text-xs text-gray-400 leading-relaxed">
            Welcome to the EAVI College Admission Portal. Apply for programs,
            check application status, and manage academic records across all
            campuses.
          </p>
          <div className="mt-8 pt-6 border-t border-white/10 text-xs text-gray-500 space-y-1">
            <p>Main Campus — Eldoret</p>
            <p>West Campus — Eldoret</p>
          </div>
        </div>
      </div>

      {/* ─── Right panel: form (all sizes) ─── */}
      <div className="flex-1 flex flex-col bg-gray-50 min-h-screen">
        {/* Mobile branding (visible below lg) */}
        <div className="lg:hidden pt-10 pb-2 px-4 flex flex-col items-center text-center">
          <div className="w-[64px] aspect-square relative mx-auto mb-3.5">
            <Image
              src="/images/eavi-logo.jpg"
              alt="East Africa Vision Institute Logo"
              fill
              className="shadow-md object-cover"
              priority
            />
          </div>
          <h1 className="text-sm font-bold text-[#1a3d63] tracking-wide leading-tight">
            EAST AFRICA VISION INSTITUTE
          </h1>
          <p className="text-xs text-[#d81e6f] italic mt-1 font-medium">
            Leading the Leaders
          </p>
          <p className="text-[11px] text-gray-400 italic mt-0.5">
            Nurturing quality and affordable education
          </p>
        </div>

        {/* Form area — vertically centered */}
        <div className="flex-1 flex items-center justify-center px-4 py-6">
          <div className="w-full max-w-sm">
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              {formContent}
            </div>

            {/* Campus info — mobile only */}
            <p className="lg:hidden text-center text-[11px] text-gray-400 mt-4">
              Main Campus — Eldoret &middot; West Campus — Eldoret
            </p>
          </div>
        </div>

        {/* Footer — visible on all sizes, always at bottom */}
        <div className="px-4 py-5 text-center text-[11px] text-gray-400 leading-relaxed border-t border-gray-200 bg-white lg:border-none lg:bg-transparent">
          <p>East Africa Vision Institute Main Campus — Eldoret | West Campus — Eldoret</p>
          <p className="mt-0.5">Phone: +254 700 000 000 | Email: admissions@eavicollege.ac.ke</p>
          <p className="mt-0.5">&copy; {new Date().getFullYear()} EAVI. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
