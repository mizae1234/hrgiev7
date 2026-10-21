"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  Building2,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function LoginPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"admin" | "employee">("admin");
  const [email, setEmail] = useState("superadmin@hr.internal");
  const [password, setPassword] = useState("Password123!");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleQuickFill = (targetEmail: string, tab: "admin" | "employee") => {
    setActiveTab(tab);
    setEmail(targetEmail);
    setPassword("Password123!");
    setError(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "เกิดข้อผิดพลาดในการเข้าสู่ระบบ");
      }

      router.push(data.redirectUrl || (activeTab === "employee" ? "/employee" : "/admin"));
      router.refresh();
    } catch (err: any) {
      setError(err.message || "เกิดข้อผิดพลาดในการเข้าสู่ระบบ");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-teal-950 flex flex-col justify-center items-center p-4 sm:p-6 text-slate-100">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-500 text-white font-black text-2xl shadow-xl shadow-teal-500/25 mb-4 ring-4 ring-teal-500/20">
            HR
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            HR Management
          </h1>
          <p className="text-xs sm:text-sm text-teal-200/80 mt-1.5 font-medium">
            ระบบบริหารจัดการเวลาทำงาน มอบหมายจุดบูธ และบันทึกเวลา GPS สด
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-900 border border-slate-100">
          {/* Portal Switcher Tabs */}
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl mb-6 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setActiveTab("admin");
                setEmail("superadmin@hr.internal");
                setError(null);
              }}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeTab === "admin"
                  ? "bg-white text-teal-700 shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <Building2 className="h-4 w-4" />
              <span>พอร์ทัล HR / แอดมิน</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("employee");
                setEmail("emp1@hr.internal");
                setError(null);
              }}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                activeTab === "employee"
                  ? "bg-white text-teal-700 shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <Smartphone className="h-4 w-4" />
              <span>พอร์ทัลพนักงาน</span>
            </button>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 flex items-start gap-2 animate-in fade-in duration-200">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Input
                label="อีเมลผู้ใช้งาน (Email)"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.co.th"
                leftIcon={<Mail className="h-4 w-4" />}
              />
            </div>

            <div>
              <Input
                label="รหัสผ่าน (Password)"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                leftIcon={<Lock className="h-4 w-4" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="cursor-pointer text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
              />
            </div>

            <Button
              type="submit"
              isLoading={loading}
              className="w-full h-11 text-sm font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-md shadow-teal-600/20"
            >
              {loading ? "กำลังตรวจสอบข้อมูล..." : "เข้าสู่ระบบ (Sign In)"}
            </Button>
          </form>

          {/* Quick Demo Login Fill Buttons */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2.5">
              <Sparkles className="h-3.5 w-3.5 text-teal-600" />
              <span>ทดสอบระบบรวดเร็ว (1-Click Demo Accounts)</span>
            </div>

            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => handleQuickFill("superadmin@hr.internal", "admin")}
                className="w-full text-left p-2 rounded-xl border border-slate-200/80 hover:border-purple-300 hover:bg-purple-50/50 transition-all flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <div className="text-xs font-bold text-slate-800 group-hover:text-purple-700 flex items-center gap-1.5">
                    <span className="text-sm">👑</span> Super Admin (ทุกบริษัท)
                  </div>
                  <div className="text-[10px] text-slate-500">superadmin@hr.internal</div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-semibold">
                  เลือก
                </span>
              </button>

              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickFill("hr.gi@hr.internal", "admin")}
                  className="text-left p-2 rounded-xl border border-slate-200/80 hover:border-teal-300 hover:bg-teal-50/50 transition-all group cursor-pointer"
                >
                  <div className="text-[11px] font-bold text-slate-800 group-hover:text-teal-700">
                    🏢 HR GI
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">hr.gi@hr.internal</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickFill("hr.ev7@hr.internal", "admin")}
                  className="text-left p-2 rounded-xl border border-slate-200/80 hover:border-teal-300 hover:bg-teal-50/50 transition-all group cursor-pointer"
                >
                  <div className="text-[11px] font-bold text-slate-800 group-hover:text-teal-700">
                    🏢 HR EV7
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">hr.ev7@hr.internal</div>
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleQuickFill("emp1@hr.internal", "employee")}
                className="w-full text-left p-2 rounded-xl border border-slate-200/80 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <div className="text-xs font-bold text-slate-800 group-hover:text-emerald-700 flex items-center gap-1.5">
                    <span className="text-sm">📱</span> พนักงาน 1: นภัสสร (ประจำบูธเซ็นทรัลเวิลด์)
                  </div>
                  <div className="text-[10px] text-slate-500">emp1@hr.internal • บูธกะ 11:00-20:00</div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold">
                  เลือก
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Security Footer Notice */}
        <div className="text-center mt-6 text-xs text-slate-400 flex items-center justify-center gap-1.5">
          <ShieldCheck className="h-4 w-4 text-teal-400" />
          <span>ระบบรักษาความปลอดภัยเซสชันแบบ HTTP-Only Cookie</span>
        </div>
      </div>
    </div>
  );
}
