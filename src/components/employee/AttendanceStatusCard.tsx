import React from "react";
import { Card } from "@/components/ui/Card";
import { formatBangkokTime } from "@/lib/attendance";

interface AttendanceStatusCardProps {
  attendance: any;
  hasCheckedIn: boolean;
  hasCheckedOut: boolean;
}

export function AttendanceStatusCard({
  attendance,
  hasCheckedIn,
  hasCheckedOut,
}: AttendanceStatusCardProps) {
  return (
    <Card className="border-slate-200/80 p-4 shadow-xs space-y-3">
      <span className="text-xs font-bold text-slate-800 block">สถานะการลงเวลาของวันนี้</span>

      <div className="grid grid-cols-2 gap-3">
        {/* Check-In Status */}
        <div className="rounded-2xl border border-slate-200 p-3 bg-slate-50/50 text-center">
          <span className="text-[11px] font-medium text-slate-500 block">เวลาเข้างาน</span>
          {hasCheckedIn ? (
            <div>
              <span className="font-mono text-base font-black text-emerald-700 block mt-1">
                {formatBangkokTime(new Date(attendance.checkInTime))} น.
              </span>
              {attendance.isLate ? (
                <span className="text-[10px] text-amber-700 font-bold">
                  สาย {attendance.lateMinutes} นาที
                </span>
              ) : (
                <span className="text-[10px] text-emerald-600 font-semibold">ตรงเวลา</span>
              )}
            </div>
          ) : (
            <span className="text-xs text-slate-400 font-medium block mt-2">ยังไม่ลงเวลา</span>
          )}
        </div>

        {/* Check-Out Status */}
        <div className="rounded-2xl border border-slate-200 p-3 bg-slate-50/50 text-center">
          <span className="text-[11px] font-medium text-slate-500 block">เวลาออกงาน</span>
          {hasCheckedOut ? (
            <div>
              <span className="font-mono text-base font-black text-teal-700 block mt-1">
                {formatBangkokTime(new Date(attendance.checkOutTime))} น.
              </span>
              {attendance.isEarlyLeave ? (
                <span className="text-[10px] text-orange-700 font-bold">
                  กลับก่อน {attendance.earlyLeaveMinutes} นาที
                </span>
              ) : (
                <span className="text-[10px] text-teal-600 font-semibold">เรียบร้อย</span>
              )}
            </div>
          ) : (
            <span className="text-xs text-slate-400 font-medium block mt-2">ยังไม่ลงเวลา</span>
          )}
        </div>
      </div>

      {/* Live Photo Preview if recorded */}
      {(attendance?.checkInPhotoUrl || attendance?.checkOutPhotoUrl) && (
        <div className="pt-2 border-t border-slate-100 flex items-center justify-around">
          {attendance.checkInPhotoUrl && (
            <div className="text-center">
              <span className="text-[10px] text-slate-400 block mb-1">ภาพเข้างาน</span>
              <img
                src={attendance.checkInPhotoUrl}
                alt="Check In"
                className="h-14 w-14 rounded-xl object-cover mx-auto border border-slate-200"
              />
            </div>
          )}
          {attendance.checkOutPhotoUrl && (
            <div className="text-center">
              <span className="text-[10px] text-slate-400 block mb-1">ภาพออกงาน</span>
              <img
                src={attendance.checkOutPhotoUrl}
                alt="Check Out"
                className="h-14 w-14 rounded-xl object-cover mx-auto border border-slate-200"
              />
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
