"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Menu,
  Building,
  LogOut,
  Calendar,
  Shield,
  User,
  ChevronDown,
} from "lucide-react";
import { formatThaiFullDate, getBangkokToday } from "@/lib/attendance";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface Company {
  id: string;
  code: string;
  name: string;
}

interface AdminHeaderProps {
  onToggleSidebar?: () => void;
  selectedCompanyId: string;
  onCompanyChange: (companyId: string) => void;
}

export function AdminHeader({
  onToggleSidebar,
  selectedCompanyId,
  onCompanyChange,
}: AdminHeaderProps) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  useEffect(() => {
    // Fetch current user
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          setCurrentUser(data.user);
        }
      })
      .catch(() => {});

    // Fetch accessible companies
    fetch("/api/admin/companies")
      .then((r) => r.json())
      .then((data) => {
        if (data.companies) {
          setCompanies(data.companies);
        }
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      router.push("/login");
    }
  };

  const [todayFormatted, setTodayFormatted] = useState("");

  useEffect(() => {
    setTodayFormatted(formatThaiFullDate(getBangkokToday()));
  }, []);

  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 sm:px-6 backdrop-blur-md">
      {/* Left: Mobile hamburger & Company selector */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Company Selector for SUPER_ADMIN or Badge for HR_ADMIN */}
        <div className="flex items-center gap-2">
          <Building className="h-4 w-4 text-teal-600 hidden sm:inline" />
          {isSuperAdmin ? (
            <select
              value={selectedCompanyId}
              onChange={(e) => onCompanyChange(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-3 pr-8 text-xs font-semibold text-slate-800 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 transition-all cursor-pointer"
            >
              <option value="ALL">🏢 แสดงข้อมูลทุกบริษัท ({companies.length} บริษัท - Consolidated View)</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  🏢 {c.code} — {c.name}
                </option>
              ))}
            </select>
          ) : (
            <div className="flex items-center gap-1.5 rounded-lg bg-teal-50 px-3 py-1 border border-teal-100 text-xs font-semibold text-teal-800">
              <span className="font-bold">{currentUser?.companyName || "บริษัทของคุณ"}</span>
            </div>
          )}
        </div>
      </div>

      {/* Right: Date, Role badge, User info & Logout */}
      <div className="flex items-center gap-3">
        {/* Date Display */}
        <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 font-medium">
          <Calendar className="h-3.5 w-3.5 text-slate-400" />
          <span>{todayFormatted}</span>
        </div>

        {/* User Profile Pill & Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2.5 rounded-xl border border-slate-200 p-1.5 pl-2.5 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-600 text-white font-bold text-xs">
              {currentUser?.name ? currentUser.name.charAt(0) : "A"}
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-xs font-bold text-slate-800 truncate max-w-[120px]">
                {currentUser?.name || "Admin"}
              </div>
              <div className="text-[10px] text-teal-600 font-semibold leading-tight">
                {currentUser?.role === "SUPER_ADMIN" ? "Super Admin" : "HR Admin"}
              </div>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>

          {/* User Menu Dropdown */}
          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-xl z-30 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-2 border-b border-slate-100 mb-1">
                <p className="text-xs font-bold text-slate-800">{currentUser?.name}</p>
                <p className="text-[11px] text-slate-500 truncate">{currentUser?.email}</p>
                <div className="mt-1.5">
                  <Badge variant={isSuperAdmin ? "purple" : "success"} size="sm">
                    <Shield className="h-3 w-3 mr-0.5" />
                    {isSuperAdmin ? "Super Admin (ทุกบริษัท)" : "HR Admin"}
                  </Badge>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>ออกจากระบบ</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
