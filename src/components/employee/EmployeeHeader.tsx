"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Building, ShieldCheck } from "lucide-react";

export function EmployeeHeader() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          setUser(data.user);
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

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 shadow-2xs">
      <div className="max-w-md mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600 text-white font-black text-sm shadow-sm shadow-teal-600/30">
            HR
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 leading-tight">
              {user?.companyName ? user.companyName.split("(")[0] : "ระบบลงเวลาพนักงาน"}
            </div>
            <div className="text-[10px] text-teal-600 font-semibold flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" />
              <span>พนักงาน: {user?.name || "กำลังโหลด..."}</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          title="ออกจากระบบ"
          className="flex items-center justify-center h-8 w-8 rounded-lg bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition-colors"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
