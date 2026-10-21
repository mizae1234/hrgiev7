"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart3,
  Download,
  Calendar,
  FileSpreadsheet,
  Filter,
  Users,
  Store,
  ClockAlert,
  UserX,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useAdminContext } from "@/components/admin/AdminLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import {
  formatBangkokDate,
  formatBangkokTime,
  getStatusBadgeInfo,
  getTodayDateString,
} from "@/lib/attendance";

const reportCategories = [
  { id: "daily", label: "รายงานลงเวลาประจำวัน", icon: Calendar, desc: "สรุปเวลาเข้า-ออกงานทุกพนักงาน" },
  { id: "late", label: "รายงานพนักงานมาสาย", icon: ClockAlert, desc: "รายชื่อพนักงานที่เข้างานเกิน Grace Period" },
  { id: "absent", label: "รายงานขาดงาน / ไม่ลงเวลา", icon: UserX, desc: "พนักงานที่มีตารางงานแต่ไม่พบการลงเวลา" },
  { id: "missing_checkout", label: "รายงานลืมลงเวลาออก", icon: AlertCircle, desc: "พนักงานที่ลงเวลาเข้าแต่ไม่มีเวลาออกงาน" },
  { id: "booth", label: "รายงานการลงเวลาประจำจุดบูธ", icon: Store, desc: "สรุปการปฏิบัติงานนอกสถานที่และจุดบูธ" },
];

export default function ReportsPage() {
  const { selectedCompanyId } = useAdminContext();

  const [activeReport, setActiveReport] = useState("daily");
  const [selectedDate, setSelectedDate] = useState(() => getTodayDateString());
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/attendance?companyId=${selectedCompanyId}&date=${selectedDate}`
      );
      const data = await res.json();
      let list = data.attendances || [];

      if (activeReport === "late") {
        list = list.filter((a: any) => a.isLate);
      } else if (activeReport === "absent") {
        list = list.filter((a: any) => a.attendanceStatus === "ABSENT");
      } else if (activeReport === "missing_checkout") {
        list = list.filter((a: any) => a.attendanceStatus === "MISSING_CHECKOUT" || (a.checkInTime && !a.checkOutTime));
      } else if (activeReport === "booth") {
        list = list.filter((a: any) => a.scheduledLocation?.locationType === "BOOTH");
      }

      setRecords(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [selectedCompanyId, selectedDate, activeReport]);

  const handleExportExcel = () => {
    const url = `/api/admin/reports/export?type=${activeReport}&companyId=${selectedCompanyId}&date=${selectedDate}`;
    window.location.href = url;
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            รายงานและการส่งออกข้อมูล (Reports & Excel Export)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            รายงานสถิติการลงเวลา บันทึกพนักงานมาสาย ขาดงาน การปฏิบัติงานประจำบูธ และส่งออก Excel (.xlsx)
          </p>
        </div>

        <Button
          onClick={handleExportExcel}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-10 px-5 shadow-sm shadow-emerald-700/20"
        >
          <FileSpreadsheet className="h-4 w-4 mr-1.5" />
          ส่งออกรายงานเป็น Excel (.xlsx)
        </Button>
      </div>

      {/* Report Categories Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {reportCategories.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeReport === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => setActiveReport(cat.id)}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                isActive
                  ? "bg-teal-50 border-teal-500 shadow-xs"
                  : "bg-white border-slate-200/80 hover:bg-slate-50"
              }`}
            >
              <div
                className={`p-2 rounded-xl inline-flex mb-2 ${
                  isActive ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-600"
                }`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <h4 className="text-xs font-bold text-slate-900 leading-tight">{cat.label}</h4>
              <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">{cat.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Date & Filter Bar */}
      <div className="p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-700 flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-teal-600" /> เลือกวันที่ของรายงาน:
          </span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:border-teal-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="purple" size="md">
            พบทั้งหมด {records.length} รายการ
          </Badge>
        </div>
      </div>

      {/* Preview Table */}
      <Card className="border-slate-200/80 overflow-hidden p-0">
        <div className="overflow-x-auto max-h-[550px]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 bg-slate-100/95 backdrop-blur-xs z-10">
              <tr className="border-b border-slate-200 text-slate-600 font-bold">
                <th className="py-3 px-4">รหัสพนักงาน</th>
                <th className="py-3 px-4">ชื่อ - นามสกุล</th>
                <th className="py-3 px-4">บริษัท & แผนก</th>
                <th className="py-3 px-4">สถานที่</th>
                <th className="py-3 px-4">กะเวลา</th>
                <th className="py-3 px-4">เวลาเข้างาน</th>
                <th className="py-3 px-4">เวลาออกงาน</th>
                <th className="py-3 px-4">สาย (นาที)</th>
                <th className="py-3 px-4 text-center">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    กำลังโหลดข้อมูลรายงาน...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    ไม่พบรายการข้อมูลสำหรับเงื่อนไขรายงานนี้
                  </td>
                </tr>
              ) : (
                records.map((item, idx) => {
                  const statusInfo = getStatusBadgeInfo(item.attendanceStatus);
                  return (
                    <tr key={idx} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 font-mono font-bold text-teal-700">
                        {item.employee?.employeeId}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {item.employee?.firstName} {item.employee?.lastName}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {item.employee?.company?.code} - {item.employee?.department?.name?.split("(")[0]}
                      </td>
                      <td className="py-3 px-4 text-slate-800">
                        {item.scheduledLocation?.locationName}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {item.effectiveStartTime} - {item.effectiveEndTime}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        {item.checkInTime ? formatBangkokTime(new Date(item.checkInTime)) : "-"}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        {item.checkOutTime ? formatBangkokTime(new Date(item.checkOutTime)) : "-"}
                      </td>
                      <td className="py-3 px-4 font-mono">
                        {item.lateMinutes > 0 ? (
                          <span className="text-amber-700 font-bold">{item.lateMinutes} นาที</span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusInfo.className}`}
                        >
                          {statusInfo.label}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
