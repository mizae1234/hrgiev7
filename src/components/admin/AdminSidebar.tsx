"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FileSpreadsheet,
  MapPin,
  Clock,
  CalendarCheck,
  CalendarDays,
  ClipboardList,
  BarChart3,
  ShieldCheck,
  Building2,
  X,
} from "lucide-react";
import { clsx } from "clsx";

interface AdminSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/employees", label: "จัดการพนักงาน", icon: Users },
  { href: "/admin/employees/import", label: "นำเข้าไฟล์ Excel", icon: FileSpreadsheet },
  { href: "/admin/locations", label: "สถานที่และจุดบูธ", icon: MapPin },
  { href: "/admin/shifts", label: "จัดการกะเวลาทำงาน", icon: Clock },
  { href: "/admin/assignments", label: "มอบหมายจุดบูธ", icon: CalendarCheck },
  { href: "/admin/attendance", label: "บันทึกการลงเวลา", icon: ClipboardList },
  { href: "/admin/holidays", label: "วันหยุดและนักขัตฤกษ์", icon: CalendarDays },
  { href: "/admin/reports", label: "รายงานและการส่งออก", icon: BarChart3 },
];

export function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname();

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-slate-900 text-slate-200">
      <div>
        {/* Brand Logo & Name */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-800">
          <Link href="/admin" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500 text-white font-black text-xl shadow-lg shadow-teal-500/20">
              HR
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-white block">
                HR Management
              </span>
            </div>
          </Link>
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <div className="px-3 py-6 space-y-1">
          <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            เมนูหลัก (Management)
          </div>
          {(() => {
            const activeItemHref = navItems
              .filter((item) =>
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname === item.href || pathname.startsWith(item.href + "/")
              )
              .sort((a, b) => b.href.length - a.href.length)[0]?.href;

            return navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.href === activeItemHref;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={clsx(
                    "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all group",
                    isActive
                      ? "bg-teal-600 text-white font-semibold shadow-md shadow-teal-600/20"
                      : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                  )}
                >
                  <Icon
                    className={clsx(
                      "h-4 w-4 shrink-0 transition-colors",
                      isActive ? "text-white" : "text-slate-400 group-hover:text-teal-400"
                    )}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            });
          })()}
        </div>
      </div>

      {/* Bottom Info Card */}
      <div className="p-4 border-t border-slate-800">
        <div className="rounded-xl bg-slate-800/60 p-3.5 border border-slate-700/50">
          <div className="flex items-center gap-2 text-xs font-semibold text-teal-400">
            <Building2 className="h-3.5 w-3.5" />
            <span>Multi-Company Ready</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400 leading-relaxed">
            รองรับ 13 บริษัทในเครือโกลด์ อินทิเกรท & EV7 และการมอบหมายงานบูธ Real-time GPS
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 z-30 shadow-xl">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={onClose} />
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
