"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Sun, Moon } from "lucide-react";

interface SidebarProps {
  role: "ADMIN" | "SUPER_ADMIN";
  campus?: string;
  email?: string;
}

const navIcons = {
  dashboard: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  courses: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
  fee: "M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z",
  settings: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
};

export default function AdminSidebar({ role, campus, email }: SidebarProps) {
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("eavi-theme", next ? "dark" : "light");
  };

  const links =
    role === "SUPER_ADMIN"
      ? [
          { href: "/super-admin", label: "Dashboard", icon: navIcons.dashboard },
          { href: "/super-admin/courses", label: "Courses", icon: navIcons.courses },
          { href: "/super-admin/settings", label: "Settings", icon: navIcons.settings },
        ]
      : [
          { href: "/admin", label: "Dashboard", icon: navIcons.dashboard },
          { href: "/admin/settings", label: "Settings", icon: navIcons.settings },
        ];

  const handleLogout = () => {
    fetch("/api/auth/sign-out", { method: "POST" }).then(() =>
      router.push("/login")
    );
  };

  const title =
    role === "SUPER_ADMIN"
      ? "Super Admin"
      : `${campus === "WEST" ? "West" : "Main"} Campus`;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed top-3 left-3 z-40 lg:hidden bg-white rounded-xl border border-zinc-200 p-3 shadow-sm hover:shadow-md transition-shadow"
        aria-label="Open menu"
      >
        <svg className="w-5 h-5 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden" onClick={() => setOpen(false)} />
      )}

      <aside
        className={`fixed top-0 left-0 h-full w-56 bg-white dark:bg-zinc-950 border-r border-zinc-100 dark:border-zinc-800 z-50 flex flex-col transition-all duration-300 ease-out lg:translate-x-0 lg:static lg:z-auto shadow-sm ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="px-4 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-700 to-blue-600 flex items-center justify-center">
              <span className="text-white font-semibold text-[10px] tracking-tight">EAVI</span>
            </div>
            <div className="min-w-0">
              <h2 className="font-medium text-sm text-zinc-900 leading-tight">{title}</h2>
              <p className="text-[11px] text-zinc-400 truncate mt-0.5">{email || ""}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <button
                key={link.href}
                onClick={() => { router.push(link.href); setOpen(false); }}
                className={`flex items-center gap-3 w-full px-3 py-2.5 sm:py-2 rounded-lg text-sm transition-all min-h-11 ${
                  isActive
                    ? "bg-blue-50 text-blue-700 font-medium"
                    : "text-zinc-500 hover:bg-zinc-100"
                }`}
              >
                <svg className={`w-4 h-4 ${isActive ? "text-blue-600" : "text-zinc-400"}`} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d={link.icon} />
                </svg>
                <span>{link.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="border-t border-zinc-100 px-3 py-2 space-y-1">
          <button
            onClick={toggleTheme}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-zinc-500 hover:bg-zinc-100 transition-colors"
          >
            {dark ? <Moon size={16} /> : <Sun size={16} />}
            <span>{dark ? "Dark" : "Light"}</span>
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Sign out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
