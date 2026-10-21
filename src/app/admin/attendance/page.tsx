"use client";

import React, { useState, useEffect } from "react";
import {
  ClipboardList,
  Search,
  Calendar,
  Camera,
  MapPin,
  Clock,
  Edit3,
  RefreshCw,
} from "lucide-react";
import { useAdminContext } from "@/components/admin/AdminLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { PhotoViewerModal } from "@/components/admin/PhotoViewerModal";
import { AttendanceCorrectionModal } from "@/components/admin/AttendanceCorrectionModal";
import {
  formatBangkokTime,
  getStatusBadgeInfo,
  getTodayDateString,
} from "@/lib/attendance";

export default function AttendanceBoardPage() {
  const { selectedCompanyId } = useAdminContext();

  const [attendances, setAttendances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters (Dynamic today string)
  const [selectedDate, setSelectedDate] = useState(() => getTodayDateString());
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  // Modals
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [photoModalData, setPhotoModalData] = useState<{
    url: string;
    title: string;
    employeeName: string;
    time: string;
    distance?: number | null;
  } | null>(null);

  const [correctModalOpen, setCorrectModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      let url = `/api/admin/attendance?companyId=${selectedCompanyId}&date=${selectedDate}`;
      if (statusFilter !== "ALL") url += `&status=${statusFilter}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.attendances) {
        setAttendances(data.attendances);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [selectedCompanyId, selectedDate, statusFilter]);

  const handleOpenPhoto = (
    url: string,
    title: string,
    employeeName: string,
    time: string,
    distance?: number | null
  ) => {
    setPhotoModalData({ url, title, employeeName, time, distance });
    setPhotoModalOpen(true);
  };

  const handleOpenCorrection = (record: any) => {
    setSelectedRecord(record);
    setCorrectModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            บันทึกการลงเวลาประจำวัน (Daily Attendance Board)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            ตรวจสอบเวลาเข้า-ออกงาน ภาพถ่ายกล้องสด พิกัด GPS ระยะห่าง และการแก้ไขรายการโดย HR
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs focus:border-teal-500 focus:outline-none cursor-pointer"
          />

          <Button
            variant="outline"
            size="sm"
            onClick={fetchAttendance}
            isLoading={loading}
            className="h-9 font-semibold text-xs"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1" /> รีเฟรช
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card className="p-4 border-slate-200/80">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="sm:col-span-2">
            <Input
              placeholder="ค้นหาด้วยรหัส หรือชื่อพนักงาน..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchAttendance()}
              leftIcon={<Search className="h-4 w-4" />}
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-teal-500 focus:outline-none"
            >
              <option value="ALL">สถานะทั้งหมด</option>
              <option value="PRESENT">ตรงเวลา (PRESENT)</option>
              <option value="LATE">มาสาย (LATE)</option>
              <option value="EARLY_LEAVE">กลับก่อน (EARLY_LEAVE)</option>
              <option value="ABSENT">ยังไม่ลงเวลา / ขาด (ABSENT)</option>
              <option value="MISSING_CHECKOUT">ลืมลงเวลาออก (MISSING_CHECKOUT)</option>
            </select>
          </div>

          <div>
            <Button
              variant="secondary"
              onClick={fetchAttendance}
              className="w-full h-10 text-xs font-bold"
            >
              ค้นหา
            </Button>
          </div>
        </div>
      </Card>

      {/* Attendance Board Table */}
      <Card className="border-slate-200/80 overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-bold">
                <th className="py-3 px-4">พนักงาน</th>
                <th className="py-3 px-4">สถานที่กำหนด</th>
                <th className="py-3 px-4">กะเวลา</th>
                <th className="py-3 px-4 text-center">เข้างาน & ภาพสด</th>
                <th className="py-3 px-4 text-center">ออกงาน & ภาพสด</th>
                <th className="py-3 px-4">สาย / เร็ว</th>
                <th className="py-3 px-4 text-center">สถานะ</th>
                <th className="py-3 px-4 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    กำลังโหลดข้อมูลการลงเวลา...
                  </td>
                </tr>
              ) : attendances.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    ไม่มีรายการลงเวลาสำหรับวันที่เลือก
                  </td>
                </tr>
              ) : (
                attendances.map((item) => {
                  const statusInfo = getStatusBadgeInfo(item.attendanceStatus);
                  const isBooth = item.scheduledLocation?.locationType === "BOOTH";

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Employee */}
                      <td className="py-3 px-4">
                        <div className="font-mono text-[11px] font-bold text-teal-700">
                          {item.employee?.employeeId}
                        </div>
                        <div className="font-semibold text-slate-900">
                          {item.employee?.firstName} {item.employee?.lastName}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {item.employee?.company?.code} • {item.employee?.department?.name?.split("(")[0]}
                        </div>
                      </td>

                      {/* Location */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-teal-600 shrink-0" />
                          <span className="truncate max-w-[140px]">
                            {item.scheduledLocation?.locationName}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded font-semibold inline-block mt-0.5 ${
                            isBooth ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {isBooth ? "บูธ (BOOTH)" : "สำนักงาน"}
                        </span>
                      </td>

                      {/* Shift */}
                      <td className="py-3 px-4 font-mono font-medium text-slate-700">
                        {item.effectiveStartTime} - {item.effectiveEndTime}
                      </td>

                      {/* Check-In */}
                      <td className="py-3 px-4 text-center">
                        {item.checkInTime ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="font-mono font-bold text-slate-900">
                              {formatBangkokTime(new Date(item.checkInTime))}
                            </span>
                            {item.checkInPhotoUrl ? (
                              <button
                                onClick={() =>
                                  handleOpenPhoto(
                                    item.checkInPhotoUrl,
                                    "ภาพถ่ายเข้างาน (Check In)",
                                    `${item.employee?.firstName} ${item.employee?.lastName}`,
                                    formatBangkokTime(new Date(item.checkInTime)),
                                    item.checkInDistanceMeters
                                  )
                                }
                                className="mt-1 relative group cursor-pointer"
                              >
                                <img
                                  src={item.checkInPhotoUrl}
                                  alt="Check in photo"
                                  className="h-10 w-10 rounded-lg object-cover border border-slate-200 shadow-2xs group-hover:ring-2 group-hover:ring-teal-500"
                                />
                                <span className="absolute -bottom-1 -right-1 bg-teal-600 text-white rounded-full p-0.5">
                                  <Camera className="h-2.5 w-2.5" />
                                </span>
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-400">ไม่มีภาพ</span>
                            )}
                            {item.checkInDistanceMeters !== null && item.checkInDistanceMeters !== undefined && (
                              <span className="text-[10px] text-slate-500 mt-0.5">
                                {Math.round(item.checkInDistanceMeters)} ม.
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      {/* Check-Out */}
                      <td className="py-3 px-4 text-center">
                        {item.checkOutTime ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="font-mono font-bold text-slate-900">
                              {formatBangkokTime(new Date(item.checkOutTime))}
                            </span>
                            {item.checkOutPhotoUrl ? (
                              <button
                                onClick={() =>
                                  handleOpenPhoto(
                                    item.checkOutPhotoUrl,
                                    "ภาพถ่ายออกงาน (Check Out)",
                                    `${item.employee?.firstName} ${item.employee?.lastName}`,
                                    formatBangkokTime(new Date(item.checkOutTime)),
                                    item.checkOutDistanceMeters
                                  )
                                }
                                className="mt-1 relative group cursor-pointer"
                              >
                                <img
                                  src={item.checkOutPhotoUrl}
                                  alt="Check out photo"
                                  className="h-10 w-10 rounded-lg object-cover border border-slate-200 shadow-2xs group-hover:ring-2 group-hover:ring-orange-500"
                                />
                                <span className="absolute -bottom-1 -right-1 bg-orange-600 text-white rounded-full p-0.5">
                                  <Camera className="h-2.5 w-2.5" />
                                </span>
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-400">ไม่มีภาพ</span>
                            )}
                            {item.checkOutDistanceMeters !== null && item.checkOutDistanceMeters !== undefined && (
                              <span className="text-[10px] text-slate-500 mt-0.5">
                                {Math.round(item.checkOutDistanceMeters)} ม.
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      {/* Late / Early Minutes */}
                      <td className="py-3 px-4 font-mono text-[11px]">
                        {item.isLate && (
                          <span className="text-amber-700 font-bold block">
                            สาย {item.lateMinutes} นาที
                          </span>
                        )}
                        {item.isEarlyLeave && (
                          <span className="text-orange-700 font-bold block">
                            กลับก่อน {item.earlyLeaveMinutes} นาที
                          </span>
                        )}
                        {!item.isLate && !item.isEarlyLeave && item.checkInTime && (
                          <span className="text-emerald-700">ปกติ</span>
                        )}
                        {!item.checkInTime && <span className="text-slate-300">-</span>}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border ${statusInfo.className}`}
                        >
                          {statusInfo.label}
                        </span>
                        {item.isCorrected && (
                          <span
                            title={`แก้ไขโดย HR: ${item.correctionReason}`}
                            className="block text-[9px] text-purple-700 font-semibold mt-0.5"
                          >
                            ✏️ มีการแก้ไข
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenCorrection(item)}
                          className="h-8 text-xs font-semibold text-slate-700 hover:text-teal-700 hover:border-teal-300"
                        >
                          <Edit3 className="h-3 w-3 mr-1" />
                          แก้ไขรายการ
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modular Photo Viewer Modal */}
      <PhotoViewerModal
        isOpen={photoModalOpen}
        onClose={() => setPhotoModalOpen(false)}
        data={photoModalData}
      />

      {/* Modular Manual Attendance Correction Modal */}
      <AttendanceCorrectionModal
        isOpen={correctModalOpen}
        onClose={() => setCorrectModalOpen(false)}
        record={selectedRecord}
        onSuccess={fetchAttendance}
      />
    </div>
  );
}
