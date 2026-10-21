"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  Smartphone,
  ArrowRight,
  MapPin,
  Clock,
  Camera,
  FileSpreadsheet,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function HomePage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          if (data.user.role === "EMPLOYEE") {
            router.push("/employee");
          } else {
            router.push("/admin");
          }
        } else {
          setCheckingAuth(false);
        }
      })
      .catch(() => {
        setCheckingAuth(false);
      });
  }, [router]);

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-teal-600">
        <div className="text-center space-y-3">
          <div className="h-10 w-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">กำลังตรวจสอบสิทธิ์การเข้าสู่ระบบ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-50 via-white to-slate-50 text-slate-900 flex flex-col justify-between">
      {/* Top Bar */}
      <header className="max-w-6xl w-full mx-auto p-4 sm:p-6 flex items-center justify-between border-b border-slate-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 text-white font-black text-xl shadow-md shadow-teal-600/25">
            HR
          </div>
          <div>
            <span className="font-extrabold text-base tracking-tight text-slate-900 block">
              HR Management
            </span>
          </div>
        </div>

        <Link href="/login">
          <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-sm shadow-teal-600/20">
            เข้าสู่ระบบ (Login)
          </Button>
        </Link>
      </header>

      {/* Main Showcase Hero */}
      <main className="max-w-4xl mx-auto px-4 py-12 sm:py-16 text-center space-y-8 my-auto">
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
          ระบบบันทึกเวลาทำงาน & บริหารบุคลากร
          <span className="text-transparent bg-clip-text bg-linear-to-r from-teal-600 to-emerald-600 block mt-2">
            Admin Web Portal & Mobile Employee
          </span>
        </h1>

        {/* Dual Portal Entry Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 pt-4 text-left">
          {/* Admin Portal Card */}
          <Link
            href="/login"
            className="group rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-7 hover:border-teal-500 hover:shadow-xl hover:shadow-teal-500/10 transition-all shadow-sm"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 mb-5 group-hover:scale-110 group-hover:bg-teal-600 group-hover:text-white transition-all">
              <Building2 className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 group-hover:text-teal-700 transition-colors flex items-center justify-between">
              <span>Admin Web Portal (ฝ่ายบุคคล)</span>
              <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-1 transition-all" />
            </h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              สำหรับ Super Admin & HR Admin จัดการพนักงาน, นำเข้า Excel, จัดกะ, มอบหมายบูธ, ตรวจสอบภาพถ่ายลงเวลา และออกรายงาน
            </p>
          </Link>

          {/* Employee Mobile Portal Card */}
          <Link
            href="/login"
            className="group rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-7 hover:border-emerald-500 hover:shadow-xl hover:shadow-emerald-500/10 transition-all shadow-sm"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 mb-5 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all">
              <Smartphone className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors flex items-center justify-between">
              <span>Employee Portal (พนักงาน)</span>
              <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
            </h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Mobile-First รองรับสมาร์ตโฟน ตรวจสอบตารางงานและกะประจำวัน, บันทึกเวลาเข้า-ออกงานด้วย GPS และกล้องสด Live Camera
            </p>
          </Link>
        </div>

        {/* Feature Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 text-xs text-slate-600">
          <div className="flex items-center gap-2 justify-center p-3 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
            <MapPin className="h-4 w-4 text-teal-600" />
            <span className="font-medium">GPS Radius Check</span>
          </div>
          <div className="flex items-center gap-2 justify-center p-3 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
            <Camera className="h-4 w-4 text-teal-600" />
            <span className="font-medium">Live Camera Only</span>
          </div>
          <div className="flex items-center gap-2 justify-center p-3 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
            <Clock className="h-4 w-4 text-teal-600" />
            <span className="font-medium">Shift Overrides</span>
          </div>
          <div className="flex items-center gap-2 justify-center p-3 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
            <FileSpreadsheet className="h-4 w-4 text-teal-600" />
            <span className="font-medium">Excel Import / Export</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center text-xs text-slate-500 border-t border-slate-200/80 bg-white">
        HR Management System
      </footer>
    </div>
  );
}
