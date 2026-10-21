"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, CalendarDays, History, User } from "lucide-react";
import { clsx } from "clsx";

const navItems = [
  { href: "/employee", label: "หน้าแรก", icon: Home },
  { href: "/employee/schedule", label: "ตารางงาน", icon: CalendarDays },
  { href: "/employee/history", label: "ประวัติ", icon: History },
  { href: "/employee/profile", label: "บัญชีของฉัน", icon: User },
];

export function EmployeeBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-lg pb-safe">
      <div className="max-w-md mx-auto flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/employee"
              ? pathname === "/employee"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex flex-col items-center justify-center w-full h-full py-1 transition-all rounded-xl",
                isActive
                  ? "text-teal-600 font-bold"
                  : "text-slate-400 hover:text-slate-600 font-medium"
              )}
            >
              <div
                className={clsx(
                  "p-1 rounded-xl transition-all",
                  isActive ? "bg-teal-50" : "bg-transparent"
                )}
              >
                <Icon className={clsx("h-5 w-5", isActive ? "stroke-[2.5]" : "stroke-[1.8]")} />
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
