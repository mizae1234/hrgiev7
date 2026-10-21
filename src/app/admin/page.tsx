"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  CalendarCheck,
  UserCheck,
  ClockAlert,
  UserX,
  AlertCircle,
  Store,
  TrendingUp,
  RefreshCw,
  Plus,
  FileSpreadsheet,
  CalendarPlus,
  ArrowRight,
} from "lucide-react";
import { useAdminContext } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/Button";
import { StatCard } from "@/components/admin/StatCard";
import { HourlyTrendChart } from "@/components/admin/HourlyTrendChart";
import { DepartmentBreakdownChart } from "@/components/admin/DepartmentBreakdownChart";
import { getTodayDateString } from "@/lib/attendance";

export default function AdminDashboardPage() {
  const { selectedCompanyId } = useAdminContext();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState(() => getTodayDateString());

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const url = `/api/admin/dashboard?companyId=${selectedCompanyId}&date=${selectedDate}`;
      const res = await fetch(url);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedCompanyId, selectedDate]);

  const stats = data?.stats || {
    totalActiveEmployees: 0,
    scheduledToday: 0,
    checkedInCount: 0,
    lateCount: 0,
    earlyLeaveCount: 0,
    absentCount: 0,
    missingCheckoutCount: 0,
    boothAssignedCount: 0,
    attendanceRate: 0,
  };

  const statCards = [
    {
      label: "พนักงานประจำการทั้งหมด",
      value: stats.totalActiveEmployees,
      unit: "คน",
      icon: Users,
      color: "text-slate-700",
      bgColor: "bg-slate-100",
    },
    {
      label: "มีตารางงานวันนี้",
      value: stats.scheduledToday,
      unit: "คน",
      icon: CalendarCheck,
      color: "text-teal-600",
      bgColor: "bg-teal-50",
    },
    {
      label: "ลงเวลาเข้างานแล้ว",
      value: stats.checkedInCount,
      unit: "คน",
      subText: `คิดเป็น ${stats.attendanceRate}%`,
      icon: UserCheck,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      label: "มาสาย (Late)",
      value: stats.lateCount,
      unit: "คน",
      icon: ClockAlert,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
    },
    {
      label: "ยังไม่ลงเวลา / ขาดงาน",
      value: stats.absentCount,
      unit: "คน",
      icon: UserX,
      color: "text-rose-600",
      bgColor: "bg-rose-50",
    },
    {
      label: "ลืมลงเวลาออกงาน",
      value: stats.missingCheckoutCount,
      unit: "คน",
      icon: AlertCircle,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      label: "มอบหมายประจำบูธ",
      value: stats.boothAssignedCount,
      unit: "จุด/คน",
      icon: Store,
      color: "text-sky-600",
      bgColor: "bg-sky-50",
    },
    {
      label: "อัตราการเข้างานรวม",
      value: `${stats.attendanceRate}%`,
      unit: "",
      icon: TrendingUp,
      color: "text-teal-600",
      bgColor: "bg-teal-50",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Dashboard (ภาพรวมระบบ)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            สรุปข้อมูลสถิติการลงเวลาเข้า-ออกงาน และการปฏิบัติงานประจำจุดบูธรายวัน
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
          />

          <Button
            variant="outline"
            size="sm"
            onClick={fetchDashboardData}
            isLoading={loading}
            className="h-9 font-semibold text-xs"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1" /> รีเฟรช
          </Button>
        </div>
      </div>

      {/* Quick Action Shortcuts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link href="/admin/employees">
          <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 hover:border-teal-500 hover:shadow-md transition-all flex items-center gap-3 group cursor-pointer">
            <div className="h-9 w-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Plus className="h-4 w-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-800 block">เพิ่มพนักงานใหม่</span>
              <span className="text-[10px] text-slate-400">สร้างโปรไฟล์พนักงาน</span>
            </div>
          </div>
        </Link>

        <Link href="/admin/employees/import">
          <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 hover:border-teal-500 hover:shadow-md transition-all flex items-center gap-3 group cursor-pointer">
            <div className="h-9 w-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <FileSpreadsheet className="h-4 w-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-800 block">นำเข้าไฟล์ Excel</span>
              <span className="text-[10px] text-slate-400">อัปโหลดรายชื่อจำนวนมาก</span>
            </div>
          </div>
        </Link>

        <Link href="/admin/assignments">
          <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 hover:border-teal-500 hover:shadow-md transition-all flex items-center gap-3 group cursor-pointer">
            <div className="h-9 w-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <CalendarPlus className="h-4 w-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-800 block">มอบหมายจุดบูธ</span>
              <span className="text-[10px] text-slate-400">กำหนดพนักงาน & กะเวลา</span>
            </div>
          </div>
        </Link>

        <Link href="/admin/reports">
          <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 hover:border-teal-500 hover:shadow-md transition-all flex items-center gap-3 group cursor-pointer">
            <div className="h-9 w-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <ArrowRight className="h-4 w-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-800 block">รายงาน & ส่งออก</span>
              <span className="text-[10px] text-slate-400">ดาวน์โหลด Excel</span>
            </div>
          </div>
        </Link>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat, idx) => (
          <StatCard
            key={idx}
            label={stat.label}
            value={stat.value}
            unit={stat.unit}
            subText={stat.subText}
            icon={stat.icon}
            color={stat.color}
            bgColor={stat.bgColor}
          />
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <HourlyTrendChart data={data?.hourlyBuckets || []} />
        <DepartmentBreakdownChart data={data?.departmentStats || []} />
      </div>
    </div>
  );
}
