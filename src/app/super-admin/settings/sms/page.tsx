"use client";

import { useSettings } from "../SettingsContext";

export default function SmsSettingsPage() {
  const { loading, saving, form, conf, message, setField, handleSave } = useSettings();

  if (loading) return <div className="flex items-center justify-center py-12 text-sm text-zinc-400">Loading...</div>;

  return (
    <main className="px-6 py-6 max-w-3xl">
      {message && (
        <div className={`p-4 rounded-lg mb-6 ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>{message.text}</div>
      )}

      <h1 className="text-base font-medium text-zinc-900 mb-1">SMS Configuration</h1>
      <p className="text-xs text-zinc-400 mb-5">Credentials from sms-gate.app Cloud Server tab.</p>

      {["MAIN", "WEST"].map(campus => {
        const f = form[campus] || { smsApiKey: "", smsApiSecret: "", smsBaseUrl: "", smsEnabled: false };
        const c = conf[campus] || { smsApiKey: false, smsApiSecret: false };
        const isSaving = saving[campus];

        return (
          <div key={campus} className="bg-white border border-zinc-200 rounded-xl p-5 mb-4">
            <h2 className="text-sm font-medium text-zinc-900 mb-4">{campus === "MAIN" ? "Main Campus" : "West Campus"}</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">API Key{c.smsApiKey && <span className="ml-2 text-xs text-green-600">(configured)</span>}</label>
                <input type="text" value={f.smsApiKey} onChange={e => setField(campus, "smsApiKey", e.target.value)} placeholder={c.smsApiKey ? "Leave empty to keep current" : "API Key"} className="w-full rounded-lg border border-zinc-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">API Secret{c.smsApiSecret && <span className="ml-2 text-xs text-green-600">(configured)</span>}</label>
                <input type="password" value={f.smsApiSecret} onChange={e => setField(campus, "smsApiSecret", e.target.value)} placeholder={c.smsApiSecret ? "Leave empty to keep current" : "API Secret"} className="w-full rounded-lg border border-zinc-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Base URL</label>
                <input type="text" value={f.smsBaseUrl} onChange={e => setField(campus, "smsBaseUrl", e.target.value)} placeholder="https://api.sms-gate.app/3rdparty/v1" className="w-full rounded-lg border border-zinc-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-700" />
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id={`smsEnabled-${campus}`} checked={f.smsEnabled} onChange={e => setField(campus, "smsEnabled", e.target.checked)} className="rounded border-zinc-300" />
                <label htmlFor={`smsEnabled-${campus}`} className="text-sm font-medium text-zinc-700">Enable SMS</label>
              </div>
            </div>
            <button onClick={() => handleSave(campus, "SMS", { email: form[campus]?.email || "", smsApiKey: f.smsApiKey, smsApiSecret: f.smsApiSecret, smsBaseUrl: f.smsBaseUrl, smsEnabled: f.smsEnabled })} disabled={isSaving === "SMS"} className="mt-4 rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-50 transition-colors">
              {isSaving === "SMS" ? "Saving..." : "Save SMS"}
            </button>
          </div>
        );
      })}
    </main>
  );
}
