"use client";

import { useSettings } from "../SettingsContext";
import { useState, useEffect } from "react";

interface SystemEmailData {
  user: string;
  host: string;
  port: number;
  fromName: string;
  hasAppPassword: boolean;
}

export default function EmailSettingsPage() {
  const { loading, saving, form, conf, message, setMessage, setField, handleSave } = useSettings();
  const [sysLoading, setSysLoading] = useState(true);
  const [sysSaving, setSysSaving] = useState(false);
  const [sysEmail, setSysEmail] = useState<SystemEmailData>({
    user: "", host: "smtp.gmail.com", port: 587, fromName: "EAVI College", hasAppPassword: false,
  });
  const [sysPassword, setSysPassword] = useState("");

  useEffect(() => {
    fetch("/api/admin/system-email")
      .then(r => r.json())
      .then(d => { if (d.data) setSysEmail(d.data); })
      .finally(() => setSysLoading(false));
  }, []);

  async function handleSystemSave() {
    setSysSaving(true);
    setMessage(null);
    try {
      const body: any = { user: sysEmail.user, host: sysEmail.host, port: sysEmail.port, fromName: sysEmail.fromName };
      if (sysPassword) body.appPassword = sysPassword;
      const res = await fetch("/api/admin/system-email", {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      if (res.ok) {
        setMessage({ type: "success", text: "System email saved" });
        setSysPassword("");
        const refetch = await fetch("/api/admin/system-email");
        const d = await refetch.json();
        if (d.data) setSysEmail(d.data);
      } else {
        const d = await res.json();
        setMessage({ type: "error", text: d.error || "Failed to save" });
      }
    } catch { setMessage({ type: "error", text: "Failed to save" }); }
    finally { setSysSaving(false); }
  }

  if (loading || sysLoading) return <div className="flex items-center justify-center py-12 text-sm text-zinc-400 dark:text-zinc-500">Loading...</div>;

  return (
    <main className="px-6 py-6 max-w-3xl">
      {message && (
        <div className={`p-4 rounded-lg mb-6 ${message.type === "success" ? "bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800" : "bg-red-50 dark:bg-red-950 text-red-700 border border-red-200 dark:border-red-800"}`}>{message.text}</div>
      )}

      <h1 className="text-base font-medium text-zinc-900 dark:text-zinc-100 mb-1">Email Configuration</h1>
      <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-5">Configure Gmail SMTP for system notifications and per-campus sending.</p>

      {/* System Email */}
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-xl p-5 mb-4">
        <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1">System Email</h2>
        <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-4">Used for OTP, password resets, and automated notifications.</p>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Gmail Address</label>
            <input type="email" value={sysEmail.user} onChange={e => setSysEmail(p => ({ ...p, user: e.target.value }))} placeholder="system@eavicollege.ac.ke" className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">App Password{sysEmail.hasAppPassword && <span className="ml-2 text-xs text-green-600">(configured)</span>}</label>
            <input type="password" value={sysPassword} onChange={e => setSysPassword(e.target.value)} placeholder={sysEmail.hasAppPassword ? "Leave empty to keep current" : "16-char app password"} className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">SMTP Host</label>
              <input type="text" value={sysEmail.host} onChange={e => setSysEmail(p => ({ ...p, host: e.target.value }))} className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Port</label>
              <input type="number" value={sysEmail.port} onChange={e => setSysEmail(p => ({ ...p, port: parseInt(e.target.value) || 587 }))} className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">From Name</label>
              <input type="text" value={sysEmail.fromName} onChange={e => setSysEmail(p => ({ ...p, fromName: e.target.value }))} className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700" />
            </div>
          </div>
        </div>
        <button onClick={handleSystemSave} disabled={sysSaving} className="mt-4 rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-50 transition-colors">
          {sysSaving ? "Saving..." : "Save system email"}
        </button>
      </div>

      {/* Per-Campus */}
      {["MAIN", "WEST"].map(campus => {
        const f = form[campus] || { email: "", appPassword: "" };
        const c = conf[campus] || { appPassword: false };
        const isSaving = saving[campus];

        return (
          <div key={campus} className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-xl p-5 mb-4">
            <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-4">{campus === "MAIN" ? "Main Campus" : "West Campus"}</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Gmail Address</label>
                <input type="email" value={f.email} onChange={e => setField(campus, "email", e.target.value)} placeholder="campus@example.com" className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">App Password{c.appPassword && <span className="ml-2 text-xs text-green-600">(configured)</span>}</label>
                <input type="password" value={f.appPassword} onChange={e => setField(campus, "appPassword", e.target.value)} placeholder={c.appPassword ? "Leave empty to keep current" : "16-char app password"} className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700" />
              </div>
            </div>
            <button onClick={() => handleSave(campus, "Email", { appPassword: f.appPassword })} disabled={isSaving === "Email"} className="mt-4 rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-50 transition-colors">
              {isSaving === "Email" ? "Saving..." : "Save email"}
            </button>
          </div>
        );
      })}
    </main>
  );
}
