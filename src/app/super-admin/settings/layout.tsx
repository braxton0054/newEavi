"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import AdminSidebar from "@/components/AdminSidebar";
import { SettingsProvider } from "./SettingsContext";

const navItems = [
  { href: "/super-admin/settings", label: "Admission PDF", exact: true },
  { href: "/super-admin/settings/email", label: "Email" },
  { href: "/super-admin/settings/sms", label: "SMS" },
  { href: "/super-admin/settings/admissions", label: "Admissions" },
  { href: "/super-admin/settings/reporting", label: "Reporting Dates" },
  { href: "/super-admin/settings/bursary", label: "Bursary Form" },
  { href: "/super-admin/settings/whatsapp", label: "WhatsApp" },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-zinc-50 flex">
      <AdminSidebar role="SUPER_ADMIN" />
      <div className="flex-1 min-w-0 flex">
        {/* Settings sub-sidebar */}
        <aside className="w-52 border-r border-zinc-200 bg-white flex flex-col">
          <div className="px-4 py-4 border-b border-zinc-100">
            <h2 className="text-sm font-medium text-zinc-900">Settings</h2>
            <p className="text-[11px] text-zinc-400 mt-0.5">Configure your campus</p>
          </div>
          <nav className="flex-1 px-3 py-3 space-y-0.5">
            {navItems.map(item => {
              const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
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
    </div>
  );
}
