"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

type Step = "email" | "otp" | "reset" | "done";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const requestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(""); setMessage("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message);
        setStep("otp");
      } else {
        setError(data.error || "Failed to send OTP");
      }
    } catch { setError("Something went wrong"); }
    finally { setLoading(false); }
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError("Passwords don't match"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true); setError(""); setMessage("");
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("Password reset successful! Redirecting to login...");
        setStep("done");
        setTimeout(() => router.push("/login"), 2000);
      } else {
        setError(data.error || "Failed to reset password");
      }
    } catch { setError("Something went wrong"); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-xl border border-zinc-200 p-6">
          <div className="text-center mb-5">
            <div className="w-12 aspect-square relative mx-auto mb-3">
              <Image src="/images/eavi-logo.jpg" alt="EAVI" fill className="object-cover" />
            </div>
            <h2 className="text-lg font-medium text-zinc-900">Reset Password</h2>
            <p className="text-xs text-zinc-500 mt-1">
              {step === "email" && "Enter your email to receive a reset code"}
              {step === "otp" && "Check your SMS or email for the reset code"}
              {step === "reset" && "Enter the code and your new password"}
              {step === "done" && "Password reset complete"}
            </p>
          </div>

          {error && (
            <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">{error}</div>
          )}
          {message && (
            <div className="mb-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-3">{message}</div>
          )}

          {step === "email" && (
            <form onSubmit={requestOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  required placeholder="you@example.com"
                  className="w-full rounded-lg border border-zinc-300 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700 outline-none" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full rounded-lg bg-blue-700 px-4 py-2.5 font-medium text-white hover:bg-blue-800 disabled:opacity-50 transition-colors min-h-[44px]">
                {loading ? "Sending..." : "Send Reset Code"}
              </button>
            </form>
          )}

          {step === "otp" && (
            <form onSubmit={e => { e.preventDefault(); setStep("reset"); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Reset Code (OTP)</label>
                <input type="text" value={otp} onChange={e => setOtp(e.target.value)}
                  required placeholder="Enter 6-digit code" maxLength={6}
                  className="w-full rounded-lg border border-zinc-300 px-3.5 py-2.5 text-sm text-center text-lg tracking-[0.5em] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700 outline-none" />
              </div>
              <button type="submit" disabled={otp.length < 6}
                className="w-full rounded-lg bg-blue-700 px-4 py-2.5 font-medium text-white hover:bg-blue-800 disabled:opacity-50 transition-colors min-h-[44px]">
                Continue
              </button>
              <button type="button" onClick={() => { setStep("email"); setOtp(""); setError(""); setMessage(""); }}
                className="w-full text-center text-xs text-zinc-400 hover:text-zinc-600 transition-colors mt-2">
                Resend code
              </button>
            </form>
          )}

          {step === "reset" && (
            <form onSubmit={verifyOtp} className="space-y-4">
              <div className="text-center text-sm text-zinc-500 mb-2">
                Code: <strong className="text-zinc-800">{otp}</strong>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">New Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  required minLength={6} placeholder="At least 6 characters"
                  className="w-full rounded-lg border border-zinc-300 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Confirm Password</label>
                <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                  required minLength={6} placeholder="Repeat new password"
                  className="w-full rounded-lg border border-zinc-300 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700 outline-none" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full rounded-lg bg-blue-700 px-4 py-2.5 font-medium text-white hover:bg-blue-800 disabled:opacity-50 transition-colors min-h-[44px]">
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          )}

          {step === "done" && (
            <div className="text-center">
              <Link href="/login"
                className="inline-block rounded-lg bg-blue-700 px-4 py-2.5 font-medium text-white hover:bg-blue-800 transition-colors min-h-[44px] leading-[44px]">
                Back to Login
              </Link>
            </div>
          )}

          <p className="text-center text-xs text-zinc-400 mt-4">
            <Link href="/login" className="hover:text-zinc-600 transition-colors">Back to login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
