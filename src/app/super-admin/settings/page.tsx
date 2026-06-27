"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/AdminSidebar";
import ReportingDatesEditor from "@/components/ReportingDatesEditor";

interface Setting {
  id: string;
  campus: string;
  email: string;
  hasAppPassword: boolean;
  smsBaseUrl: string;
  hasSmsApiKey: boolean;
  hasSmsApiSecret: boolean;
  smsEnabled: boolean;
  admissionFormat: string;
  admissionStart: number;
  hasBursaryForm: boolean;
  reportingDates: any[];
}

interface FormValues {
  email: string;
  appPassword: string;
  smsApiKey: string;
  smsApiSecret: string;
  smsBaseUrl: string;
  smsEnabled: boolean;
  admissionFormat: string;
  admissionStart: number;
  reportingDates: any[];
  bursaryFormPdf: string | null;
}

const defaultForm = (): FormValues => ({
  email: "", appPassword: "", smsApiKey: "", smsApiSecret: "", smsBaseUrl: "", smsEnabled: false,
  admissionFormat: "", admissionStart: 1, reportingDates: [], bursaryFormPdf: null,
});

export default function CampusSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<string, string | null>>({});
  const [form, setForm] = useState<Record<string, FormValues>>({});
  const [conf, setConf] = useState<Record<string, { appPassword: boolean; smsApiKey: boolean; smsApiSecret: boolean; hasBursaryForm: boolean }>>({});

  const [waStatus, setWaStatus] = useState<Record<string, { connected: boolean; qr: string | null; connecting: boolean }>>({});
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => { fetchSettings(); }, []);
  useEffect(() => {
    const interval = setInterval(fetchAllStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  async function fetchSettings() {
    try {
      const [settingsRes, pdfRes] = await Promise.all([
        fetch("/api/admin/settings"),
        fetch("/api/admin/admission-pdf").then(r => ({ ok: r.ok })),
      ]);
      const data = await settingsRes.json();
      if (settingsRes.ok) {
        const f: Record<string, FormValues> = {};
        const c: Record<string, { appPassword: boolean; smsApiKey: boolean; smsApiSecret: boolean; hasBursaryForm: boolean }> = {};
        for (const campus of ["MAIN", "WEST"]) {
          const s = data.data.find((x: Setting) => x.campus === campus);
          f[campus] = { ...defaultForm(), email: s?.email || "", smsBaseUrl: s?.smsBaseUrl || "", smsEnabled: s?.smsEnabled || false, admissionFormat: s?.admissionFormat || "", admissionStart: s?.admissionStart || 1, reportingDates: Array.isArray(s?.reportingDates) ? s.reportingDates : [], bursaryFormPdf: null };
          c[campus] = { appPassword: s?.hasAppPassword || false, smsApiKey: s?.hasSmsApiKey || false, smsApiSecret: s?.hasSmsApiSecret || false, hasBursaryForm: s?.hasBursaryForm || false };
        }
        c["_global_"] = { appPassword: false, smsApiKey: false, smsApiSecret: false, hasBursaryForm: pdfRes.ok };
        setForm(f);
        setConf(c);
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }

  async function fetchAllStatus() {
    for (const campus of ["MAIN", "WEST"]) {
      try {
        const res = await fetch(`/api/admin/whatsapp?campus=${campus}`);
        const data = await res.json();
        if (res.ok) {
          setWaStatus(prev => ({
            ...prev,
            [campus]: {
              connected: data.data.connected,
              qr: data.data.hasQr ? data.data.qr : prev[campus]?.qr || null,
              connecting: prev[campus]?.connecting || false,
            },
          }));
          if (data.data.connected) setWaStatus(prev => ({ ...prev, [campus]: { connected: true, qr: null, connecting: false } }));
        }
      } catch {}
    }
  }

  function setField(campus: string, field: keyof FormValues, value: any) {
    setForm(prev => ({ ...prev, [campus]: { ...prev[campus], [field]: value } }));
  }

  async function handleSave(campus: string, section: string, extra: Record<string, any>) {
    setSaving(prev => ({ ...prev, [campus]: section }));
    setMessage(null);
    try {
      const f = form[campus];
      const body = { campus, email: f.email, ...extra };
      const res = await fetch("/api/admin/settings", {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      if (res.ok) {
        setMessage({ type: "success", text: `${campus} ${section} saved` });
        await fetchSettings();
        if (extra.appPassword !== undefined) setField(campus, "appPassword", "");
        if (extra.smsApiKey !== undefined) setField(campus, "smsApiKey", "");
        if (extra.smsApiSecret !== undefined) setField(campus, "smsApiSecret", "");
      } else {
        const d = await res.json();
        setMessage({ type: "error", text: d.error || "Failed to save" });
      }
    } catch { setMessage({ type: "error", text: "Failed to save" }); } finally { setSaving(prev => ({ ...prev, [campus]: null })); }
  }

  async function handleConnectWA(campus: string) {
    setWaStatus(prev => ({ ...prev, [campus]: { connected: false, qr: null, connecting: true } }));
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/whatsapp?campus=${campus}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "connect" }),
      });
      const data = await res.json();
      if (res.ok && data.data?.qr) setWaStatus(prev => ({ ...prev, [campus]: { connected: false, qr: data.data.qr, connecting: false } }));
      else { setMessage({ type: "error", text: `Failed to get QR for ${campus}` }); setWaStatus(prev => ({ ...prev, [campus]: { connected: false, qr: null, connecting: false } })); }
    } catch { setMessage({ type: "error", text: "Failed to connect WhatsApp" }); setWaStatus(prev => ({ ...prev, [campus]: { connected: false, qr: null, connecting: false } })); }
  }

  async function handleDisconnectWA(campus: string) {
    setMessage(null);
    try {
      await fetch(`/api/admin/whatsapp?campus=${campus}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "disconnect" }),
      });
      setWaStatus(prev => ({ ...prev, [campus]: { connected: false, qr: null, connecting: false } }));
      setMessage({ type: "success", text: `${campus} WhatsApp disconnected` });
    } catch { setMessage({ type: "error", text: "Failed to disconnect" }); }
  }

  async function handleBursaryFormUpload(campus: string, file: File) {
    setMessage(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("type", "bursary_form");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok) {
        await handleSave(campus, "Bursary Form", { email: form[campus].email, bursaryFormPdf: data.data.url });
        setField(campus, "bursaryFormPdf", data.data.url);
      } else {
        setMessage({ type: "error", text: data.error || "Upload failed" });
      }
    } catch { setMessage({ type: "error", text: "Upload failed" }); }
  }

  async function handleDeleteBursaryForm(campus: string) {
    await handleSave(campus, "Bursary Form", { email: form[campus].email, bursaryFormPdf: null });
    setField(campus, "bursaryFormPdf", null);
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar role="SUPER_ADMIN" />
      <div className="flex-1 min-w-0 lg:ml-72">
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center justify-between gap-4 lg:pl-6">
          <div className="lg:pl-0 pl-12">
            <h1 className="text-xl font-bold text-gray-900">Campus Settings</h1>
            <p className="text-sm text-gray-500">Configure email, SMS, admissions, reporting dates, bursary forms, and WhatsApp</p>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {message && (
          <div className={`p-4 rounded-lg mb-6 ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>{message.text}</div>
        )}
        <div className="space-y-8">
          {/* Global Admission PDF Template */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Admission PDF Template</h2>
            <p className="text-sm text-gray-500 mb-3">Upload a PDF template for admission letters. Stored in the database.</p>
            {(() => {
              const name = form["_global_"]?.bursaryFormPdf;
              const hasPdf = conf["_global_"]?.hasBursaryForm;
              return (
                <>
                  {hasPdf ? (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 mb-3">
                      <span className="inline-block w-3 h-3 rounded-full bg-green-500" />
                      <span className="text-sm font-medium text-green-700">PDF template configured</span>
                      <a href="/api/admin/admission-pdf" target="_blank" className="text-sm text-blue-600 hover:underline">View PDF</a>
                      <button onClick={async () => {
                        setMessage(null);
                        try {
                          const res = await fetch("/api/admin/admission-pdf", { method: "DELETE" });
                          if (res.ok) {
                            setMessage({ type: "success", text: "Admission PDF template removed" });
                            setConf(prev => ({ ...prev, _global_: { ...prev["_global_"], hasBursaryForm: false } }));
                          } else {
                            const d = await res.json();
                            setMessage({ type: "error", text: d.error || "Failed to remove" });
                          }
                        } catch { setMessage({ type: "error", text: "Failed to remove" }); }
                      }} className="text-sm text-red-600 hover:underline">Remove</button>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 mb-3">No admission PDF template uploaded.</p>
                  )}
                  <label className="inline-block cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                    {hasPdf ? "Replace PDF" : "Upload PDF"}
                    <input type="file" accept=".pdf" className="hidden" onChange={async e => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setMessage(null);
                      try {
                        const fd = new FormData();
                        fd.append("file", file);
                        const res = await fetch("/api/admin/admission-pdf", { method: "POST", body: fd });
                        const data = await res.json();
                        if (res.ok) {
                          setMessage({ type: "success", text: "Admission PDF template uploaded" });
                          setConf(prev => ({ ...prev, _global_: { ...prev["_global_"], hasBursaryForm: true } }));
                        } else {
                          setMessage({ type: "error", text: data.error || "Upload failed" });
                        }
                      } catch { setMessage({ type: "error", text: "Upload failed" }); }
                      e.target.value = "";
                    }} />
                  </label>
                </>
              );
            })()}
          </div>
          {["MAIN", "WEST"].map(campus => {
            const f = form[campus] || defaultForm();
            const c = conf[campus] || { appPassword: false, smsApiKey: false, smsApiSecret: false };
            const wa = waStatus[campus] || { connected: false, qr: null, connecting: false };
            const isSaving = saving[campus];

            return (
              <div key={campus} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">{campus === "MAIN" ? "Main Campus" : "West Campus"}</h2>

                <div className="border-b border-gray-100 pb-4 mb-4">
                  <h3 className="font-medium text-gray-800 mb-3">Email Configuration</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Gmail Address</label>
                      <input type="email" value={f.email} onChange={e => setField(campus, "email", e.target.value)} placeholder="campus@example.com" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">App Password{c.appPassword && <span className="ml-2 text-xs text-green-600">(configured)</span>}</label>
                      <input type="password" value={f.appPassword} onChange={e => setField(campus, "appPassword", e.target.value)} placeholder={c.appPassword ? "Leave empty to keep current" : "16-char app password"} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                    </div>
                  </div>
                  <button onClick={() => handleSave(campus, "Email", { appPassword: f.appPassword })} disabled={isSaving === "Email"} className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
                    {isSaving === "Email" ? "Saving..." : "Save Email"}
                  </button>
                </div>

                <div className="border-b border-gray-100 pb-4 mb-4">
                  <h3 className="font-medium text-gray-800 mb-3">SMS Configuration</h3>
                  <p className="text-xs text-gray-400 mb-3">Credentials from sms-gate.app Cloud Server tab.</p>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">API Key{c.smsApiKey && <span className="ml-2 text-xs text-green-600">(configured)</span>}</label>
                      <input type="text" value={f.smsApiKey} onChange={e => setField(campus, "smsApiKey", e.target.value)} placeholder={c.smsApiKey ? "Leave empty to keep current" : "API Key"} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">API Secret{c.smsApiSecret && <span className="ml-2 text-xs text-green-600">(configured)</span>}</label>
                      <input type="password" value={f.smsApiSecret} onChange={e => setField(campus, "smsApiSecret", e.target.value)} placeholder={c.smsApiSecret ? "Leave empty to keep current" : "API Secret"} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Base URL</label>
                      <input type="text" value={f.smsBaseUrl} onChange={e => setField(campus, "smsBaseUrl", e.target.value)} placeholder="https://api.sms-gate.app/3rdparty/v1" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                    </div>
                    <div className="flex items-center gap-3">
                      <input type="checkbox" id={`smsEnabled-${campus}`} checked={f.smsEnabled} onChange={e => setField(campus, "smsEnabled", e.target.checked)} className="rounded border-gray-300" />
                      <label htmlFor={`smsEnabled-${campus}`} className="text-sm font-medium text-gray-700">Enable SMS</label>
                    </div>
                  </div>
                  <button onClick={() => handleSave(campus, "SMS", { email: f.email, smsApiKey: f.smsApiKey, smsApiSecret: f.smsApiSecret, smsBaseUrl: f.smsBaseUrl, smsEnabled: f.smsEnabled })} disabled={isSaving === "SMS"} className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
                    {isSaving === "SMS" ? "Saving..." : "Save SMS"}
                  </button>
                </div>

                <div className="border-b border-gray-100 pb-4 mb-4">
                  <h3 className="font-medium text-gray-800 mb-3">Admission Number Configuration</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Admission Number Format</label>
                      <input type="text" value={f.admissionFormat} onChange={e => setField(campus, "admissionFormat", e.target.value)} placeholder={`EAVI/${campus}/2026/`} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                      <p className="text-xs text-gray-400 mt-1">Prefix before auto-increment number. e.g. EAVI/{campus}/2026/</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Starting Number</label>
                      <input type="number" value={f.admissionStart} onChange={e => setField(campus, "admissionStart", Number(e.target.value))} min="1" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                      <p className="text-xs text-gray-400 mt-1">Next admission number based on where manual admissions have reached.</p>
                    </div>
                  </div>
                  <button onClick={() => handleSave(campus, "Admission", { email: f.email, admissionFormat: f.admissionFormat, admissionStart: f.admissionStart })} disabled={isSaving === "Admission"} className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
                    {isSaving === "Admission" ? "Saving..." : "Save Admission"}
                  </button>
                </div>

                <div className="border-b border-gray-100 pb-4 mb-4">
                  <h3 className="font-medium text-gray-800 mb-3">Reporting Dates — {new Date().getFullYear()}</h3>
                  <p className="text-xs text-gray-400 mb-3">Set reporting start and end dates for each month.</p>
                  <ReportingDatesEditor year={new Date().getFullYear()} dates={f.reportingDates} onChange={v => setField(campus, "reportingDates", v)} />
                  <button onClick={() => handleSave(campus, "Reporting", { email: f.email, reportingDates: f.reportingDates })} disabled={isSaving === "Reporting"} className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
                    {isSaving === "Reporting" ? "Saving..." : "Save Reporting Dates"}
                  </button>
                </div>

                <div className="border-b border-gray-100 pb-4 mb-4">
                  <h3 className="font-medium text-gray-800 mb-3">Bursary Form</h3>
                  {f.bursaryFormPdf ? (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                      <span className="inline-block w-3 h-3 rounded-full bg-green-500" />
                      <span className="text-sm font-medium text-green-700">Bursary form configured</span>
                      <a href={f.bursaryFormPdf} target="_blank" className="text-sm text-blue-600 hover:underline">View PDF</a>
                      <button onClick={() => handleDeleteBursaryForm(campus)} className="text-sm text-red-600 hover:underline">Remove</button>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 mb-3">No bursary form PDF uploaded.</p>
                  )}
                  <label className="inline-block mt-2 cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                    {f.bursaryFormPdf ? "Replace PDF" : "Upload PDF"}
                    <input type="file" accept=".pdf" className="hidden" onChange={e => { const file = e.target.files?.[0]; if (file) handleBursaryFormUpload(campus, file); e.target.value = ""; }} />
                  </label>
                </div>

                <div>
                  <h3 className="font-medium text-gray-800 mb-3">WhatsApp Configuration</h3>
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`inline-block w-3 h-3 rounded-full ${wa.connected ? "bg-green-500" : "bg-gray-300"}`} />
                    <span className="text-sm font-medium">{wa.connected ? "Connected" : "Not Connected"}</span>
                  </div>
                  {wa.qr && <div className="flex justify-center py-4"><img src={wa.qr} alt="QR" className="w-48 h-48" /></div>}
                  {wa.connecting && !wa.qr && <p className="text-sm text-gray-500 text-center">Generating QR code...</p>}
                  <div className="flex gap-3">
                    {!wa.connected && <button onClick={() => handleConnectWA(campus)} disabled={wa.connecting} className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50">{wa.connecting ? "Connecting..." : "Connect WhatsApp"}</button>}
                    {wa.connected && <button onClick={() => handleDisconnectWA(campus)} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">Disconnect</button>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        </main>
      </div>
    </div>
  );
}
