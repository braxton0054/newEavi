"use client";

import { useState, useEffect } from "react";
import ReportingDatesEditor from "@/components/ReportingDatesEditor";

export default function AdminSettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [appPassword, setAppPassword] = useState("");
  const [hasAppPassword, setHasAppPassword] = useState(false);

  const [smsApiKey, setSmsApiKey] = useState("");
  const [smsApiSecret, setSmsApiSecret] = useState("");
  const [smsBaseUrl, setSmsBaseUrl] = useState("");
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [hasSmsApiKey, setHasSmsApiKey] = useState(false);
  const [hasSmsApiSecret, setHasSmsApiSecret] = useState(false);
  const [admissionFormat, setAdmissionFormat] = useState("");
  const [admissionStart, setAdmissionStart] = useState(1);
  const [reportingDates, setReportingDates] = useState<any[]>([]);
  const [bursaryFormPdf, setBursaryFormPdf] = useState<string | null>(null);
  const currentYear = new Date().getFullYear();
  const academicYear = `${currentYear}-${currentYear + 1}`;

  const [waConnected, setWaConnected] = useState(false);
  const [waQr, setWaQr] = useState<string | null>(null);
  const [waConnecting, setWaConnecting] = useState(false);
  const [waPhoneNumber, setWaPhoneNumber] = useState<string | null>(null);
  const [waLoading, setWaLoading] = useState(true);

  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => { fetchUser(); }, []);
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, [user]);

  async function fetchUser() {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (res.ok && data.user) {
        setUser(data.user);
        await fetchSettings(data.user);
        await fetchStatus(data.user.campus);
      } else { window.location.href = "/login"; }
    } catch { window.location.href = "/login"; } finally { setLoading(false); }
  }

  async function fetchSettings(u: any) {
    try {
      const res = await fetch(`/api/admin/settings?campus=${u.campus}`);
      const data = await res.json();
      if (res.ok && data.data?.length > 0) {
        const s = data.data[0];
        setEmail(s.email || "");
        setHasAppPassword(s.hasAppPassword || false);
        setSmsBaseUrl(s.smsBaseUrl || "");
        setSmsEnabled(s.smsEnabled || false);
        setHasSmsApiKey(s.hasSmsApiKey || false);
        setHasSmsApiSecret(s.hasSmsApiSecret || false);
        setAdmissionFormat(s.admissionFormat || "");
        setAdmissionStart(s.admissionStart || 1);
        setReportingDates(Array.isArray(s.reportingDates) ? s.reportingDates : []);
        setBursaryFormPdf(s.bursaryFormPdf || null);
      }
    } catch (e) { console.error(e); }
  }

  async function fetchStatus(campus?: string) {
    const c = campus || user?.campus;
    if (!c) { setWaLoading(false); return; }
    try {
      const res = await fetch(`/api/admin/whatsapp?campus=${c}`);
      const data = await res.json();
      if (res.ok) {
        setWaConnected(data.data.connected);
        if (data.data.connected) { setWaConnecting(false); setWaQr(null); }
        else if (data.data.hasQr && data.data.qr) setWaQr(data.data.qr);
        setWaPhoneNumber(data.data.phoneNumber || null);
      }
    } catch {}
    finally { setWaLoading(false); }
  }

  async function handleSave(section: string, body: any) {
    setSaving(section);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campus: user.campus, ...body }),
      });
      if (res.ok) {
        setMessage({ type: "success", text: `${section} settings saved` });
        await fetchSettings(user);
        if (body.appPassword !== undefined) setAppPassword("");
        if (body.smsApiKey !== undefined) setSmsApiKey("");
        if (body.smsApiSecret !== undefined) setSmsApiSecret("");
      } else {
        const d = await res.json();
        setMessage({ type: "error", text: d.error || "Failed to save" });
      }
    } catch { setMessage({ type: "error", text: "Failed to save" }); } finally { setSaving(null); }
  }

  async function handleConnectWhatsApp() {
    setWaConnecting(true); setWaQr(null); setMessage(null);
    try {
      const res = await fetch(`/api/admin/whatsapp?campus=${user.campus}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "connect" }),
      });
      const data = await res.json();
      if (res.ok && data.data?.qr) setWaQr(data.data.qr);
      else setMessage({ type: "error", text: "Failed to get QR code" });
    } catch { setMessage({ type: "error", text: "Failed to connect WhatsApp" }); setWaConnecting(false); }
  }

  async function handleDisconnectWhatsApp() {
    setMessage(null);
    try {
      await fetch(`/api/admin/whatsapp?campus=${user.campus}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "disconnect" }),
      });
      setWaConnected(false); setWaQr(null); setWaConnecting(false);
      setMessage({ type: "success", text: "WhatsApp disconnected" });
    } catch { setMessage({ type: "error", text: "Failed to disconnect" }); }
  }

  if (loading) return <div className="flex items-center justify-center py-12">Loading...</div>;

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {message && (
        <div className={`p-4 rounded-lg ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>{message.text}</div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Email Configuration</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gmail Address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="campus@example.com" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">App Password{hasAppPassword && <span className="ml-2 text-xs text-green-600">(configured)</span>}</label>
              <input type="password" value={appPassword} onChange={e => setAppPassword(e.target.value)} placeholder={hasAppPassword ? "Leave empty to keep current" : "16-character app password"} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              <p className="text-xs text-gray-400 mt-1">Generate from Google Account &gt; App Passwords</p>
            </div>
          </div>
          <button onClick={() => handleSave("Email", { email, appPassword })} disabled={saving === "Email"} className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
            {saving === "Email" ? "Saving..." : "Save Email Settings"}
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">SMS Configuration</h2>
          <p className="text-xs text-gray-400 mb-4">Configure sms-gate.app credentials. Get these from the SMS Gateway app on your phone.</p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">API Key{hasSmsApiKey && <span className="ml-2 text-xs text-green-600">(configured)</span>}</label>
              <input type="text" value={smsApiKey} onChange={e => setSmsApiKey(e.target.value)} placeholder={hasSmsApiKey ? "Leave empty to keep current" : "API Key"} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">API Secret{hasSmsApiSecret && <span className="ml-2 text-xs text-green-600">(configured)</span>}</label>
              <input type="password" value={smsApiSecret} onChange={e => setSmsApiSecret(e.target.value)} placeholder={hasSmsApiSecret ? "Leave empty to keep current" : "API Secret"} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Base URL</label>
              <input type="text" value={smsBaseUrl} onChange={e => setSmsBaseUrl(e.target.value)} placeholder="https://api.sms-gate.app/3rdparty/v1" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="smsEnabled" checked={smsEnabled} onChange={e => setSmsEnabled(e.target.checked)} className="rounded border-gray-300" />
              <label htmlFor="smsEnabled" className="text-sm font-medium text-gray-700">Enable SMS</label>
            </div>
          </div>
          <button onClick={() => handleSave("SMS", { email, smsApiKey, smsApiSecret, smsBaseUrl, smsEnabled })} disabled={saving === "SMS"} className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
            {saving === "SMS" ? "Saving..." : "Save SMS Settings"}
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Admission Number Configuration</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Admission Number Format</label>
              <input type="text" value={admissionFormat} onChange={e => setAdmissionFormat(e.target.value)} placeholder={`EAVI/${user?.campus || "CAMPUS"}/${new Date().getFullYear()}/`} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              <p className="text-xs text-gray-400 mt-1">The prefix before the auto-increment number. e.g. EAVI/MAIN/{new Date().getFullYear()}/</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Starting Number</label>
              <input type="number" value={admissionStart} onChange={e => setAdmissionStart(Number(e.target.value))} min="1" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              <p className="text-xs text-gray-400 mt-1">The next admission number to use. Set based on where manual admissions have reached.</p>
            </div>
          </div>
          <button onClick={() => handleSave("Admission", { email, admissionFormat, admissionStart })} disabled={saving === "Admission"} className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
            {saving === "Admission" ? "Saving..." : "Save Admission Settings"}
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Reporting Dates — {academicYear}</h2>
          <p className="text-xs text-gray-400 mb-4">Set the start and end reporting dates for each month.</p>
          <ReportingDatesEditor year={currentYear} dates={reportingDates} onChange={setReportingDates} />
          <button onClick={() => handleSave("Reporting", { email, reportingDates })} disabled={saving === "Reporting"} className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
            {saving === "Reporting" ? "Saving..." : "Save Reporting Dates"}
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Bursary Form</h2>
          <div className="space-y-4">
            {bursaryFormPdf ? (
              <div className="flex items-center gap-3">
                <span className="inline-block w-3 h-3 rounded-full bg-green-500" />
                <span className="text-sm font-medium text-green-700">Bursary form has been configured</span>
                <a href={bursaryFormPdf} target="_blank" className="text-sm text-blue-600 hover:underline">View PDF</a>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <span className="inline-block w-3 h-3 rounded-full bg-gray-300" />
                <span className="text-sm font-medium text-gray-500">No bursary form configured yet</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">WhatsApp Configuration</h2>
          {waLoading ? (
            <p className="text-sm text-gray-400">Checking WhatsApp status...</p>
          ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className={`inline-block w-3 h-3 rounded-full ${waConnected ? "bg-green-500" : "bg-gray-300"}`} />
              <span className="text-sm font-medium">{waConnected ? "Connected" : "Not Connected"}</span>
            </div>
            {waConnected && waPhoneNumber && <p className="text-xs text-gray-500 mt-1">WhatsApp: {waPhoneNumber}</p>}
            {waQr && <div className="flex justify-center py-4"><img src={waQr} alt="WhatsApp QR Code" className="w-48 h-48" /></div>}
            {waConnecting && !waQr && <p className="text-sm text-gray-500 text-center">Generating QR code...</p>}
            <div className="flex gap-3">
              {!waConnected && <button onClick={handleConnectWhatsApp} disabled={waConnecting} className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50">{waConnecting ? "Connecting..." : "Connect WhatsApp"}</button>}
              {waConnected && <button onClick={handleDisconnectWhatsApp} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">Disconnect</button>}
            </div>
            <p className="text-xs text-gray-400">Scan the QR code with WhatsApp to connect. Session encrypted and stored in the database.</p>
          </div>
          )}
        </div>
    </main>
  );
}
