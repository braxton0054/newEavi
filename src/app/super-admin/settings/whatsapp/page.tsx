"use client";

import { useSettings } from "../SettingsContext";

export default function WhatsAppSettingsPage() {
  const { loading, waStatus, waLoaded, message, handleConnectWA, handleDisconnectWA } = useSettings();

  if (loading) return <div className="flex items-center justify-center py-12 text-sm text-zinc-400">Loading...</div>;

  return (
    <main className="px-6 py-6 max-w-3xl">
      {message && (
        <div className={`p-4 rounded-lg mb-6 ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>{message.text}</div>
      )}

      <h1 className="text-base font-medium text-zinc-900 mb-1">WhatsApp Configuration</h1>
      <p className="text-xs text-zinc-400 mb-5"> Connect WhatsApp for automated messaging per campus.</p>

      {["MAIN", "WEST"].map(campus => {
        const wa = waStatus[campus];

        return (
          <div key={campus} className="bg-white border border-zinc-200 rounded-xl p-5 mb-4">
            <h2 className="text-sm font-medium text-zinc-900 mb-4">{campus === "MAIN" ? "Main Campus" : "West Campus"}</h2>
            {!waLoaded || !wa ? (
              <p className="text-xs text-zinc-400">Checking WhatsApp status...</p>
            ) : (
            <><div className="flex items-center gap-3 mb-1">
              <span className={`inline-block w-3 h-3 rounded-full ${wa.connected ? "bg-green-500" : "bg-zinc-300"}`} />
              <span className="text-sm font-medium">{wa.connected ? "Connected" : "Not Connected"}</span>
            </div>
            {wa.connected && wa.phoneNumber && <p className="text-[11px] text-zinc-400 mb-3">WhatsApp: {wa.phoneNumber}</p>}
            {wa.qr && <div className="flex justify-center py-4"><img src={wa.qr} alt="QR" className="w-48 h-48" /></div>}
            {wa.connecting && !wa.qr && <p className="text-sm text-zinc-500 text-center">Generating QR code...</p>}
            <div className="flex gap-3">
              {!wa.connected && <button onClick={() => handleConnectWA(campus)} disabled={wa.connecting} className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-colors">{wa.connecting ? "Connecting..." : "Connect WhatsApp"}</button>}
              {wa.connected && <button onClick={() => handleDisconnectWA(campus)} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors">Disconnect</button>}
            </div></>
            )}
          </div>
        );
      })}
    </main>
  );
}
