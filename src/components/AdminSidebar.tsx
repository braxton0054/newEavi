"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";

interface SidebarProps {
  role: "ADMIN" | "SUPER_ADMIN";
  campus?: string;
  email?: string;
}

export default function AdminSidebar({ role, campus, email }: SidebarProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const links =
    role === "SUPER_ADMIN"
      ? [
          { href: "/super-admin", label: "Dashboard", icon: "📊" },
          { href: "/super-admin/courses", label: "Courses", icon: "📚" },
          { href: "/super-admin/settings", label: "Settings", icon: "⚙️" },
        ]
      : [
          { href: "/admin", label: "Dashboard", icon: "📊" },
          { href: "/admin/settings", label: "Settings", icon: "⚙️" },
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

  const navItem = (
    href: string,
    label: string,
    icon: string,
    isActive: boolean
  ) => (
    <button
      key={href}
      onClick={() => {
        router.push(href);
        setOpen(false);
      }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
        isActive
          ? "bg-blue-600 text-white shadow-md"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
      }`}
    >
      <span className="text-lg">{icon}</span>
      <span>{label}</span>
    </button>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed top-4 left-4 z-40 lg:hidden bg-white rounded-xl shadow-md border border-gray-200 p-2.5"
        aria-label="Open menu"
      >
        <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-white border-r border-gray-200 z-50 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
              {role === "SUPER_ADMIN" ? "SA" : "AD"}
            </div>
            <div>
              <h2 className="font-bold text-base text-gray-900">{title}</h2>
              <p className="text-xs text-gray-400 truncate max-w-[180px]">
                {email || ""}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {links.map((link) =>
            navItem(link.href, link.label, link.icon, pathname === link.href)
          )}
        </nav>

        {/* Bottom */}
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <span className="text-lg">🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
