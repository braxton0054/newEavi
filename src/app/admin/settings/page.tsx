"use client";

import { useState, useEffect } from "react";

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
  const [bursaryFormPdf, setBursaryFormPdf] = useState<string | null>(null);

  const [waConnected, setWaConnected] = useState(false);
  const [waQr, setWaQr] = useState<string | null>(null);
  const [waConnecting, setWaConnecting] = useState(false);
  const [waPhoneNumber, setWaPhoneNumber] = useState<string | null>(null);
  const [waLoading, setWaLoading] = useState(true);

  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Login credentials state
  const [credEmail, setCredEmail] = useState("");
  const [credCurrentPw, setCredCurrentPw] = useState("");
  const [credNewPw, setCredNewPw] = useState("");
  const [credNewPw2, setCredNewPw2] = useState("");
  const [credSaving, setCredSaving] = useState(false);
  const [currentEmail, setCurrentEmail] = useState("");

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
        setCredEmail(data.user.email || "");
        setCurrentEmail(data.user.email || "");
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

  async function handleChangeCredentials() {
    if (credNewPw && credNewPw !== credNewPw2) {
      setMessage({ type: "error", text: "New passwords don't match" }); return;
    }
    if (credEmail === currentEmail && !credNewPw) {
      setMessage({ type: "error", text: "No changes to save" }); return;
    }
    if (!credCurrentPw) {
      setMessage({ type: "error", text: "Current password is required" }); return;
    }

    setCredSaving(true);
    setMessage(null);

    let emailOk = true;
    let pwOk = true;

    // Change email — sends currentPassword for verification
    if (credEmail !== currentEmail) {
      try {
        const res = await fetch("/api/admin/credentials", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ newEmail: credEmail, currentPassword: credCurrentPw }),
        });
        if (res.ok) {
          setCurrentEmail(credEmail);
          setMessage({ type: "success", text: "Email updated! Use your new email to login next time." });
        } else {
          const d = await res.json();
          setMessage({ type: "error", text: d.error || "Failed to update email" });
          emailOk = false;
        }
      } catch { setMessage({ type: "error", text: "Failed to update email" }); emailOk = false; }
    }

    // Change password via Better Auth
    if (credNewPw && emailOk) {
      try {
        const res = await fetch("/api/auth/change-password", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ currentPassword: credCurrentPw, newPassword: credNewPw }),
        });
        if (res.ok) {
          setMessage({ type: "success", text: (emailOk && credEmail !== currentEmail ? "Email and " : "") + "Password updated!" });
          setCredNewPw(""); setCredNewPw2("");
        } else { const d = await res.json(); setMessage({ type: "error", text: d.message || d.error || "Failed to update password" }); pwOk = false; }
      } catch { setMessage({ type: "error", text: "Failed to update password" }); pwOk = false; }
    }

    setCredSaving(false);
    if (emailOk && pwOk) { setCredCurrentPw(""); }
  }

  if (loading) return <div className="flex items-center justify-center py-12">Loading...</div>;

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {message && (
        <div className={`p-4 rounded-lg border ${
          message.type === "success"
            ? "bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800"
            : "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800"
        }`}>{message.text}</div>
      )}

      <div className="bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-700 p-6">
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-4">Email Configuration</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Gmail Address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="campus@example.com" className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 px-3 py-2 text-sm bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">App Password{hasAppPassword && <span className="ml-2 text-xs text-green-600 dark:text-green-400">(configured)</span>}</label>
              <input type="password" value={appPassword} onChange={e => setAppPassword(e.target.value)} placeholder={hasAppPassword ? "Leave empty to keep current" : "16-character app password"} className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 px-3 py-2 text-sm bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100" />
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">Generate from Google Account &gt; App Passwords</p>
            </div>
          </div>
          <button onClick={() => handleSave("Email", { email, appPassword })} disabled={saving === "Email"} className="mt-4 rounded-lg bg-blue-600 dark:bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 dark:hover:bg-blue-800 disabled:opacity-50">
            {saving === "Email" ? "Saving..." : "Save Email Settings"}
          </button>
        </div>

        <div className="bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-700 p-6">
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-4">SMS Configuration</h2>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-4">Configure sms-gate.app credentials. Get these from the SMS Gateway app on your phone.</p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">API Key{hasSmsApiKey && <span className="ml-2 text-xs text-green-600 dark:text-green-400">(configured)</span>}</label>
              <input type="text" value={smsApiKey} onChange={e => setSmsApiKey(e.target.value)} placeholder={hasSmsApiKey ? "Leave empty to keep current" : "API Key"} className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 px-3 py-2 text-sm bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">API Secret{hasSmsApiSecret && <span className="ml-2 text-xs text-green-600 dark:text-green-400">(configured)</span>}</label>
              <input type="password" value={smsApiSecret} onChange={e => setSmsApiSecret(e.target.value)} placeholder={hasSmsApiSecret ? "Leave empty to keep current" : "API Secret"} className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 px-3 py-2 text-sm bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Base URL</label>
              <input type="text" value={smsBaseUrl} onChange={e => setSmsBaseUrl(e.target.value)} placeholder="http://localhost:5051" className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 px-3 py-2 text-sm bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100" />
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="smsEnabled" checked={smsEnabled} onChange={e => setSmsEnabled(e.target.checked)} className="rounded border-zinc-300 dark:border-zinc-600" />
              <label htmlFor="smsEnabled" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Enable SMS</label>
            </div>
          </div>
          <button onClick={() => handleSave("SMS", { email, smsApiKey, smsApiSecret, smsBaseUrl, smsEnabled })} disabled={saving === "SMS"} className="mt-4 rounded-lg bg-blue-600 dark:bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 dark:hover:bg-blue-800 disabled:opacity-50">
            {saving === "SMS" ? "Saving..." : "Save SMS Settings"}
          </button>
        </div>

        <div className="bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-700 p-6">
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-4">Admission Number Configuration</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Admission Number Format</label>
              <input type="text" value={admissionFormat} onChange={e => setAdmissionFormat(e.target.value)} placeholder={`EAVI/${user?.campus || "CAMPUS"}/${new Date().getFullYear()}/`} className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 px-3 py-2 text-sm bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100" />
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">The prefix before the auto-increment number. e.g. EAVI/MAIN/{new Date().getFullYear()}/</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Starting Number</label>
              <input type="number" value={admissionStart} onChange={e => setAdmissionStart(Number(e.target.value))} min="1" className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 px-3 py-2 text-sm bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100" />
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">The next admission number to use. Set based on where manual admissions have reached.</p>
            </div>
          </div>
          <button onClick={() => handleSave("Admission", { email, admissionFormat, admissionStart })} disabled={saving === "Admission"} className="mt-4 rounded-lg bg-blue-600 dark:bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 dark:hover:bg-blue-800 disabled:opacity-50">
            {saving === "Admission" ? "Saving..." : "Save Admission Settings"}
          </button>
        </div>

        <div className="bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-700 p-6">
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-4">WhatsApp Configuration</h2>
          {waLoading ? (
            <p className="text-sm text-zinc-400 dark:text-zinc-500">Checking WhatsApp status...</p>
          ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className={`inline-block w-3 h-3 rounded-full ${waConnected ? "bg-green-500" : "bg-zinc-300 dark:bg-zinc-600"}`} />
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{waConnected ? "Connected" : "Not Connected"}</span>
            </div>
            {waConnected && waPhoneNumber && <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">WhatsApp: {waPhoneNumber}</p>}
            {waQr && <div className="flex justify-center py-4"><img src={waQr} alt="WhatsApp QR Code" className="w-48 h-48" /></div>}
            {waConnecting && !waQr && <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center">Generating QR code...</p>}
            <div className="flex gap-3">
              {!waConnected && <button onClick={handleConnectWhatsApp} disabled={waConnecting} className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50">{waConnecting ? "Connecting..." : "Connect WhatsApp"}</button>}
              {waConnected && <button onClick={handleDisconnectWhatsApp} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">Disconnect</button>}
            </div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">Scan the QR code with WhatsApp to connect. Session encrypted and stored in the database.</p>
          </div>
          )}
        </div>

        {/* Login Credentials */}
        <div className="bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-700 p-6">
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-1">Login Credentials</h2>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-4">Change your login email and/or password for this account. Email changes take effect immediately — use new email on next login.</p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Login Email</label>
              <input type="email" value={credEmail} onChange={e => setCredEmail(e.target.value)} className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 px-3 py-2 text-sm bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Current Password</label>
              <input type="password" value={credCurrentPw} onChange={e => setCredCurrentPw(e.target.value)} placeholder="Required to make changes" className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 px-3 py-2 text-sm bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">New Password <span className="text-zinc-400 dark:text-zinc-500 font-normal">(leave blank to keep current)</span></label>
              <input type="password" value={credNewPw} onChange={e => setCredNewPw(e.target.value)} placeholder="New password" className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 px-3 py-2 text-sm bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Confirm New Password</label>
              <input type="password" value={credNewPw2} onChange={e => setCredNewPw2(e.target.value)} placeholder="Confirm new password" className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 px-3 py-2 text-sm bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100" />
            </div>
            <button onClick={handleChangeCredentials} disabled={credSaving} className="rounded-lg bg-blue-600 dark:bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 dark:hover:bg-blue-800 disabled:opacity-50">
              {credSaving ? "Saving..." : "Save Credentials"}
            </button>
          </div>
        </div>
    </main>
  );
}
