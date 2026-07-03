"use client";

import { useState, useEffect } from "react";
import { useSettings } from "../SettingsContext";

export default function CredentialsPage() {
  const { message, setMessage } = useSettings();
  const [email, setEmail] = useState("");
  const [currentEmail, setCurrentEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPassword2, setNewPassword2] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.json())
      .then(d => {
        if (d.user) {
          setEmail(d.user.email || "");
          setCurrentEmail(d.user.email || "");
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    if (newPassword && newPassword !== newPassword2) {
      setMessage({ type: "error", text: "New passwords don't match" }); return;
    }
    if (email === currentEmail && !newPassword) {
      setMessage({ type: "error", text: "No changes to save" }); return;
    }
    if (!currentPassword) {
      setMessage({ type: "error", text: "Current password is required" }); return;
    }

    setSaving(true);
    setMessage(null);

    let ok = true;

    // Change email (no password needed — Better Auth uses session)
    if (email !== currentEmail) {
      try {
        const res = await fetch("/api/admin/credentials", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ newEmail: email }),
        });
        if (res.ok) {
          setCurrentEmail(email);
          setMessage({ type: "success", text: "Email updated!" });
        } else {
          const d = await res.json();
          setMessage({ type: "error", text: d.error || "Failed to update email" });
          ok = false;
        }
      } catch { setMessage({ type: "error", text: "Failed to update email" }); ok = false; }
    }

    // Change password
    if (newPassword && ok) {
      try {
        const res = await fetch("/api/auth/change-password", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ currentPassword, newPassword }),
        });
        if (res.ok) {
          setMessage({ type: "success", text: (ok && email !== currentEmail ? "Email and " : "") + "Password updated!" });
          setNewPassword(""); setNewPassword2("");
        } else { const d = await res.json(); setMessage({ type: "error", text: d.message || d.error || "Failed to update password" }); ok = false; }
      } catch { setMessage({ type: "error", text: "Failed to update password" }); ok = false; }
    }

    setSaving(false);
    if (ok) setCurrentPassword("");
  }

  if (loading) return <main className="px-6 py-6 max-w-3xl"><p className="text-sm text-zinc-400">Loading...</p></main>;

  return (
    <main className="px-6 py-6 max-w-3xl">
      <div className="bg-white border border-zinc-200 rounded-xl p-5">
        <h2 className="text-base font-medium text-zinc-900 mb-1">Login Credentials</h2>
        <p className="text-xs text-zinc-400 mb-4">Change your super admin login email and/or password.</p>
        <div className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Login Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Current Password</label>
            <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)}
              placeholder="Required to make changes"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              New Password <span className="text-zinc-400 font-normal">(leave blank to keep current)</span>
            </label>
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
              placeholder="New password"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Confirm New Password</label>
            <input type="password" value={newPassword2} onChange={e => setNewPassword2(e.target.value)}
              placeholder="Confirm new password"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700 outline-none" />
          </div>
          <button onClick={handleSave} disabled={saving}
            className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-50 transition-colors">
            {saving ? "Saving..." : "Save Credentials"}
          </button>
        </div>
      </div>
    </main>
  );
}
