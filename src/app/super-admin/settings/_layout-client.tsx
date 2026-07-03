"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { SettingsProvider } from "./SettingsContext";

const navItems = [
  { href: "/super-admin/settings", label: "Admission PDF", exact: true },
  { href: "/super-admin/settings/email", label: "Email" },
  { href: "/super-admin/settings/sms", label: "SMS" },
  { href: "/super-admin/settings/admissions", label: "Admissions" },
  { href: "/super-admin/settings/reporting", label: "Reporting Dates" },
  { href: "/super-admin/settings/bursary", label: "Bursary Form" },
  { href: "/super-admin/settings/fee-structures", label: "Fee Structures" },
  { href: "/super-admin/settings/whatsapp", label: "WhatsApp" },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex-1 min-w-0 flex">
      {/* Mobile toggle */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="fixed top-4 left-14 z-30 md:hidden bg-white rounded-xl border border-zinc-200 p-2 shadow-sm"
        aria-label="Open settings menu"
      >
        <svg className="w-4 h-4 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Settings sub-sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-52 bg-white border-r border-zinc-200 z-40 flex flex-col transition-transform duration-300 ease-out md:relative md:translate-x-0 md:z-auto ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="px-4 py-4 border-b border-zinc-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-medium text-zinc-900">Settings</h2>
            <p className="text-[11px] text-zinc-400 mt-0.5">Configure your campus</p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100"
            aria-label="Close menu"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {navItems.map(item => {
            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-700 font-medium"
                    : "text-zinc-500 hover:bg-zinc-100"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Content panel */}
      <div className="flex-1 min-w-0 overflow-y-auto">
        <SettingsProvider>
          {children}
        </SettingsProvider>
      </div>
    </div>
  );
}
