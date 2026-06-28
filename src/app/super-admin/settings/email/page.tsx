"use client";

import { useSettings } from "../SettingsContext";

export default function EmailSettingsPage() {
  const { loading, saving, form, conf, message, setMessage, setField, handleSave } = useSettings();

  if (loading) return <div className="flex items-center justify-center py-12 text-sm text-zinc-400">Loading...</div>;

  return (
    <main className="px-6 py-6 max-w-3xl">
      {message && (
        <div className={`p-4 rounded-lg mb-6 ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>{message.text}</div>
      )}

      <h1 className="text-base font-medium text-zinc-900 mb-1">Email Configuration</h1>
      <p className="text-xs text-zinc-400 mb-5">Configure Gmail SMTP for each campus.</p>

      {["MAIN", "WEST"].map(campus => {
        const f = form[campus] || { email: "", appPassword: "" };
        const c = conf[campus] || { appPassword: false };
        const isSaving = saving[campus];

        return (
          <div key={campus} className="bg-white border border-zinc-200 rounded-xl p-5 mb-4">
            <h2 className="text-sm font-medium text-zinc-900 mb-4">{campus === "MAIN" ? "Main Campus" : "West Campus"}</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Gmail Address</label>
                <input type="email" value={f.email} onChange={e => setField(campus, "email", e.target.value)} placeholder="campus@example.com" className="w-full rounded-lg border border-zinc-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">App Password{c.appPassword && <span className="ml-2 text-xs text-green-600">(configured)</span>}</label>
                <input type="password" value={f.appPassword} onChange={e => setField(campus, "appPassword", e.target.value)} placeholder={c.appPassword ? "Leave empty to keep current" : "16-char app password"} className="w-full rounded-lg border border-zinc-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700" />
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
