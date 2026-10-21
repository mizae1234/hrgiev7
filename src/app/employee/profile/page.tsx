"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Building,
  Briefcase,
  Mail,
  Phone,
  Calendar,
  LogOut,
  ShieldCheck,
  MapPin,
  Clock,
  Sparkles,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export default function EmployeeProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/employee/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data.employee) {
          setProfile(data.employee);
        }
      })
      .finally(() => setLoading(false));
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

  if (loading) {
    return <div className="py-12 text-center text-xs text-slate-400">กำลังโหลดโปรไฟล์...</div>;
  }

  return (
    <div className="space-y-4 max-w-md mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-black text-slate-900 tracking-tight">
          ข้อมูลส่วนตัว (Employee Profile)
        </h1>
        <p className="text-xs text-slate-500">ข้อมูลสังกัดและสถานะการจ้างงานของคุณ</p>
      </div>

      {/* Avatar & Name Card */}
      <Card className="border-slate-200/80 p-5 text-center space-y-3 shadow-xs">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-linear-to-tr from-teal-600 to-emerald-500 text-white font-black text-2xl shadow-lg shadow-teal-600/30 mx-auto">
          {profile?.firstName ? profile.firstName.charAt(0) : "E"}
        </div>
        <div>
          <h2 className="text-lg font-black text-slate-900">
            {profile?.firstName} {profile?.lastName}
          </h2>
          <span className="font-mono text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full inline-block mt-1">
            {profile?.employeeId}
          </span>
          <p className="text-xs font-semibold text-slate-600 mt-1">{profile?.position}</p>
        </div>
      </Card>

      {/* Detailed Info Card */}
      <Card className="border-slate-200/80 p-4 space-y-3 text-xs shadow-xs divide-y divide-slate-100">
        <div className="flex items-center justify-between pb-2">
          <span className="text-slate-400 flex items-center gap-2">
            <Building className="h-4 w-4 text-slate-400" /> บริษัท:
          </span>
          <span className="font-bold text-slate-800">{profile?.company?.name?.split("(")[0]}</span>
        </div>

        <div className="flex items-center justify-between py-2">
          <span className="text-slate-400 flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-slate-400" /> แผนก:
          </span>
          <span className="font-semibold text-slate-800">{profile?.department?.name}</span>
        </div>

        <div className="flex items-center justify-between py-2">
          <span className="text-slate-400 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-400" /> วันเริ่มงาน:
          </span>
          <span className="font-mono font-medium text-slate-800">{profile?.startDate}</span>
        </div>

        <div className="flex items-center justify-between py-2">
          <span className="text-slate-400 flex items-center gap-2">
            <Mail className="h-4 w-4 text-slate-400" /> อีเมล:
          </span>
          <span className="font-medium text-slate-800">{profile?.email || "-"}</span>
        </div>

        <div className="flex items-center justify-between py-2">
          <span className="text-slate-400 flex items-center gap-2">
            <Phone className="h-4 w-4 text-slate-400" /> เบอร์โทรศัพท์:
          </span>
          <span className="font-medium text-slate-800">{profile?.phone || "-"}</span>
        </div>

        <div className="flex items-center justify-between py-2">
          <span className="text-slate-400 flex items-center gap-2">
            <Clock className="h-4 w-4 text-slate-400" /> กะเริ่มต้น:
          </span>
          <span className="font-semibold text-teal-700">
            {profile?.defaultShift?.shiftName || "กะมาตรฐาน (09:00 - 18:00)"}
          </span>
        </div>

        <div className="flex items-center justify-between pt-2">
          <span className="text-slate-400 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-slate-400" /> สถานที่หลัก:
          </span>
          <span className="font-semibold text-slate-800">
            {profile?.defaultLocation?.locationName || "สำนักงานใหญ่"}
          </span>
        </div>
      </Card>

      {/* Security & Logout Button */}
      <div className="pt-2">
        <Button
          variant="outline"
          onClick={handleLogout}
          className="w-full h-12 rounded-2xl text-xs font-bold text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 flex items-center justify-center gap-2 cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          <span>ออกจากระบบอย่างปลอดภัย (Sign Out)</span>
        </Button>

        <p className="text-[10px] text-center text-slate-400 mt-3 flex items-center justify-center gap-1">
          <ShieldCheck className="h-3.5 w-3.5 text-teal-600" />
          HR Workforce & Attendance Platform v1.0
        </p>
      </div>
    </div>
  );
}
