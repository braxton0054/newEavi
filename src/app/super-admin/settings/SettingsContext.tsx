"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

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

interface WaCampusStatus {
  connected: boolean;
  qr: string | null;
  connecting: boolean;
  phoneNumber: string | null;
}

interface SettingsContextType {
  loading: boolean;
  saving: Record<string, string | null>;
  form: Record<string, FormValues>;
  conf: Record<string, { appPassword: boolean; smsApiKey: boolean; smsApiSecret: boolean; hasBursaryForm: boolean }>;
  waStatus: Record<string, WaCampusStatus>;
  waLoaded: boolean;
  message: { type: "success" | "error"; text: string } | null;
  setMessage: (m: { type: "success" | "error"; text: string } | null) => void;
  setField: (campus: string, field: keyof FormValues, value: any) => void;
  handleSave: (campus: string, section: string, extra: Record<string, any>) => Promise<void>;
  handleConnectWA: (campus: string) => Promise<void>;
  handleDisconnectWA: (campus: string) => Promise<void>;
  handleBursaryFormUpload: (campus: string, file: File) => Promise<void>;
  handleDeleteBursaryForm: (campus: string) => Promise<void>;
  fetchSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}

const defaultForm = (): FormValues => ({
  email: "", appPassword: "", smsApiKey: "", smsApiSecret: "", smsBaseUrl: "", smsEnabled: false,
  admissionFormat: "", admissionStart: 1, reportingDates: [], bursaryFormPdf: null,
});

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<string, string | null>>({});
  const [form, setForm] = useState<Record<string, FormValues>>({});
  const [conf, setConf] = useState<Record<string, { appPassword: boolean; smsApiKey: boolean; smsApiSecret: boolean; hasBursaryForm: boolean }>>({});
  const [waStatus, setWaStatus] = useState<Record<string, WaCampusStatus>>({});
  const [waLoaded, setWaLoaded] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

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
    let loaded = true;
    for (const campus of ["MAIN", "WEST"]) {
      try {
        const res = await fetch(`/api/admin/whatsapp?campus=${campus}`);
        const data = await res.json();
        if (res.ok) {
          setWaStatus(prev => ({
            ...prev,
            [campus]: {
              connected: data.data.connected,
              qr: data.data.hasQr ? data.data.qr : null,
              connecting: data.data.connecting,
              phoneNumber: data.data.phoneNumber || null,
            },
          }));
        } else { loaded = false; }
      } catch { loaded = false; }
    }
    setWaLoaded(loaded);
  }

  useEffect(() => {
    fetchSettings();
    fetchAllStatus();
    const interval = setInterval(fetchAllStatus, 3000);
    return () => clearInterval(interval);
  }, []);

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
    setWaStatus(prev => ({ ...prev, [campus]: { connected: false, qr: null, connecting: true, phoneNumber: null } }));
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/whatsapp?campus=${campus}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "connect" }),
      });
      const data = await res.json();
      if (res.ok && data.data?.qr) setWaStatus(prev => ({ ...prev, [campus]: { connected: false, qr: data.data.qr, connecting: false, phoneNumber: null } }));
      else { setMessage({ type: "error", text: `Failed to get QR for ${campus}` }); setWaStatus(prev => ({ ...prev, [campus]: { connected: false, qr: null, connecting: false, phoneNumber: null } })); }
    } catch { setMessage({ type: "error", text: "Failed to connect WhatsApp" }); setWaStatus(prev => ({ ...prev, [campus]: { connected: false, qr: null, connecting: false, phoneNumber: null } })); }
  }

  async function handleDisconnectWA(campus: string) {
    setMessage(null);
    try {
      await fetch(`/api/admin/whatsapp?campus=${campus}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "disconnect" }),
      });
      setWaStatus(prev => ({ ...prev, [campus]: { connected: false, qr: null, connecting: false, phoneNumber: null } }));
      setMessage({ type: "success", text: `${campus} WhatsApp disconnected` });
    } catch { setMessage({ type: "error", text: "Failed to disconnect" }); }
  }

  async function handleBursaryFormUpload(campus: string, file: File) {
    setMessage(null);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      await handleSave(campus, "Bursary Form", { email: form[campus].email, bursaryFormPdf: base64 });
      setMessage({ type: "success", text: "Bursary form uploaded" });
    } catch { setMessage({ type: "error", text: "Upload failed" }); }
  }

  async function handleDeleteBursaryForm(campus: string) {
    await handleSave(campus, "Bursary Form", { email: form[campus].email, bursaryFormPdf: null });
    setField(campus, "bursaryFormPdf", null);
  }

  return (
    <SettingsContext.Provider value={{
      loading, saving, form, conf, waStatus, waLoaded, message, setMessage, setField,
      handleSave, handleConnectWA, handleDisconnectWA, handleBursaryFormUpload,
      handleDeleteBursaryForm, fetchSettings,
    }}>
      {children}
    </SettingsContext.Provider>
  );
}
