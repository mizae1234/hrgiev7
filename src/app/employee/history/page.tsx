"use client";

import React, { useState, useEffect } from "react";
import {
  History,
  Calendar,
  Clock,
  MapPin,
  Camera,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PhotoViewerModal, PhotoViewerData } from "@/components/ui/PhotoViewerModal";
import {
  formatBangkokTime,
  formatThaiDateTime,
  getStatusBadgeInfo,
} from "@/lib/attendance";

export default function EmployeeHistoryPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Photo viewer modal state
  const [photoData, setPhotoData] = useState<PhotoViewerData | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/employee/history");
      const data = await res.json();
      if (data.history) {
        setHistory(data.history);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const openPhoto = (data: PhotoViewerData) => {
    setPhotoData(data);
  };

  return (
    <div className="space-y-4 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            ประวัติการลงเวลา (Attendance History)
          </h1>
          <p className="text-xs text-slate-500">
            รายการบันทึกเวลาเข้า-ออกงานและภาพถ่ายยืนยันตัวตนของคุณ
          </p>
        </div>
        <button
          onClick={fetchHistory}
          disabled={loading}
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-teal-600 transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* History List Cards */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">
            กำลังโหลดประวัติการลงเวลา...
          </div>
        ) : history.length === 0 ? (
          <Card className="p-8 text-center border-slate-200/80">
            <History className="h-10 w-10 text-slate-300 mx-auto mb-2" />
            <span className="text-xs font-bold text-slate-700 block">ยังไม่มีประวัติการลงเวลา</span>
            <span className="text-[11px] text-slate-400">
              เมื่อคุณกดลงเวลาเข้างาน รายการจะปรากฏที่นี่ทันที
            </span>
          </Card>
        ) : (
          history.map((item) => {
            const statusInfo = getStatusBadgeInfo(item.attendanceStatus);
            return (
              <Card key={item.id} className="border-slate-200/80 p-4 space-y-3 shadow-xs">
                {/* Date & Status */}
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-teal-600" />
                    {item.formattedDate}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusInfo.className}`}
                  >
                    {statusInfo.label}
                  </span>
                </div>

                {/* Location & Shift */}
                <div className="text-[11px] text-slate-600 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                    <span className="truncate max-w-[170px]">
                      {item.scheduledLocation?.locationName || "สำนักงานหลัก"}
                    </span>
                  </span>
                  <span className="font-mono text-slate-400">
                    {item.effectiveStartTime} - {item.effectiveEndTime}
                  </span>
                </div>

                {/* Times & Photos Grid */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-center">
                  {/* Check-In */}
                  <div className="p-2 rounded-xl bg-slate-50 flex items-center justify-between px-3">
                    <div className="text-left">
                      <span className="text-[10px] text-slate-400 block">เวลาเข้า</span>
                      <span className="font-mono font-bold text-xs text-slate-800">
                        {item.checkInTime ? formatBangkokTime(new Date(item.checkInTime)) : "-"}
                      </span>
                    </div>
                    {item.checkInPhotoUrl && (
                      <button
                        onClick={() =>
                          openPhoto({
                            url: item.checkInPhotoUrl,
                            title: "ภาพถ่ายลงเวลาเข้างาน",
                            employeeName: "คุณ (ตนเอง)",
                            time: formatBangkokTime(new Date(item.checkInTime)),
                            distance: item.checkInDistanceMeters,
                          })
                        }
                        className="p-1 rounded-lg border border-slate-200 bg-white hover:ring-2 hover:ring-teal-500 transition-all cursor-pointer"
                      >
                        <img
                          src={item.checkInPhotoUrl}
                          alt="In"
                          className="h-7 w-7 rounded object-cover"
                        />
                      </button>
                    )}
                  </div>

                  {/* Check-Out */}
                  <div className="p-2 rounded-xl bg-slate-50 flex items-center justify-between px-3">
                    <div className="text-left">
                      <span className="text-[10px] text-slate-400 block">เวลาออก</span>
                      <span className="font-mono font-bold text-xs text-slate-800">
                        {item.checkOutTime ? formatBangkokTime(new Date(item.checkOutTime)) : "-"}
                      </span>
                    </div>
                    {item.checkOutPhotoUrl && (
                      <button
                        onClick={() =>
                          openPhoto({
                            url: item.checkOutPhotoUrl,
                            title: "ภาพถ่ายลงเวลาออกงาน",
                            employeeName: "คุณ (ตนเอง)",
                            time: formatBangkokTime(new Date(item.checkOutTime)),
                            distance: item.checkOutDistanceMeters,
                          })
                        }
                        className="p-1 rounded-lg border border-slate-200 bg-white hover:ring-2 hover:ring-teal-500 transition-all cursor-pointer"
                      >
                        <img
                          src={item.checkOutPhotoUrl}
                          alt="Out"
                          className="h-7 w-7 rounded object-cover"
                        />
                      </button>
                    )}
                  </div>
                </div>

                {/* Late / Early / Notes */}
                {(item.isLate || item.isEarlyLeave || item.isCorrected) && (
                  <div className="text-[10px] text-slate-500 flex flex-wrap gap-2 pt-1">
                    {item.isLate && (
                      <span className="text-amber-700 font-semibold">
                        ⚠️ สาย {item.lateMinutes} นาที
                      </span>
                    )}
                    {item.isEarlyLeave && (
                      <span className="text-orange-700 font-semibold">
                        ⚠️ กลับก่อน {item.earlyLeaveMinutes} นาที
                      </span>
                    )}
                    {item.isCorrected && (
                      <span className="text-purple-700 font-semibold">
                        ✏️ มีการแก้ไขรายการโดย HR
                      </span>
                    )}
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>

      {/* Shared Photo Enlarge Modal */}
      <PhotoViewerModal
        isOpen={Boolean(photoData)}
        onClose={() => setPhotoData(null)}
        data={photoData}
      />
    </div>
  );
}
