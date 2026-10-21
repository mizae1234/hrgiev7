"use client";

import React, { useState, useEffect } from "react";
import {
  Camera,
  CheckCircle2,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmployeeGreetingBanner } from "@/components/employee/EmployeeGreetingBanner";
import { BoothAlertBanner } from "@/components/employee/BoothAlertBanner";
import { ShiftInfoCard } from "@/components/employee/ShiftInfoCard";
import { AttendanceStatusCard } from "@/components/employee/AttendanceStatusCard";
import { CameraCaptureModal } from "@/components/employee/CameraCaptureModal";
import { formatThaiFullDate, getBangkokToday } from "@/lib/attendance";
import { stopAllActiveMediaStreams } from "@/lib/camera";

export default function EmployeeHomePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [modalMode, setModalMode] = useState<"CHECK_IN" | "CHECK_OUT" | null>(null);
  const [successAlert, setSuccessAlert] = useState<string | null>(null);
  const [todayFormatted, setTodayFormatted] = useState("");

  const fetchTodayData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/employee/today");
      const json = await res.json();
      if (res.ok) {
        setData(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setTodayFormatted(formatThaiFullDate(getBangkokToday()));
    fetchTodayData();

    return () => {
      stopAllActiveMediaStreams();
    };
  }, []);

  const handleActionSuccess = (result: any) => {
    setSuccessAlert(result.message || "บันทึกเวลาเรียบร้อยแล้ว");
    fetchTodayData();
    setTimeout(() => {
      setSuccessAlert(null);
    }, 6000);
  };

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <RefreshCw className="h-8 w-8 animate-spin text-teal-600" />
        <p className="text-xs text-slate-500 font-medium">กำลังโหลดข้อมูลตารางงานวันนี้...</p>
      </div>
    );
  }

  const employee = data?.employee;
  const location = data?.effectiveLocation;
  const shift = data?.effectiveShift;
  const attendance = data?.attendance;
  const isBooth = data?.isBooth;
  const hasCheckedIn = Boolean(attendance?.checkInTime);
  const hasCheckedOut = Boolean(attendance?.checkOutTime);

  return (
    <div className="space-y-4 max-w-md mx-auto">
      {/* Date & Greeting Card */}
      <EmployeeGreetingBanner
        firstName={employee?.firstName}
        lastName={employee?.lastName}
        employeeId={employee?.employeeId}
        position={employee?.position}
        todayFormatted={todayFormatted}
      />

      {/* Success Banner */}
      {successAlert && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-start gap-2.5 shadow-xs animate-in zoom-in-95 duration-200">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">{successAlert}</div>
        </div>
      )}

      {/* Booth Assignment Special Notice (If assigned to a booth today) */}
      {isBooth && <BoothAlertBanner notes={data?.assignmentNotes} />}

      {/* Today's Shift & Location Details Card */}
      <ShiftInfoCard shift={shift} location={location} isBooth={isBooth} />

      {/* Attendance Status Card */}
      <AttendanceStatusCard
        attendance={attendance}
        hasCheckedIn={hasCheckedIn}
        hasCheckedOut={hasCheckedOut}
      />

      {/* Prominent Primary Attendance Button */}
      <div className="pt-2 space-y-2">
        {!hasCheckedIn ? (
          <Button
            size="lg"
            onClick={() => setModalMode("CHECK_IN")}
            className="w-full h-14 rounded-2xl bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-black text-base shadow-xl shadow-teal-600/30 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Camera className="h-6 w-6" />
            <span>ลงเวลาเข้างาน (Check In)</span>
          </Button>
        ) : !hasCheckedOut ? (
          <Button
            size="lg"
            onClick={() => setModalMode("CHECK_OUT")}
            className="w-full h-14 rounded-2xl bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white font-black text-base shadow-xl shadow-orange-600/30 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Camera className="h-6 w-6" />
            <span>ลงเวลาออกงาน (Check Out)</span>
          </Button>
        ) : (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-1">
            <div className="flex items-center justify-center gap-1.5 text-sm font-bold text-emerald-800">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <span>เสร็จสิ้นการลงเวลาสำหรับวันนี้แล้ว</span>
            </div>
            <p className="text-xs text-emerald-700 font-medium">
              รวมเวลาปฏิบัติงานทั้งหมด {((attendance?.totalWorkMinutes || 0) / 60).toFixed(1)} ชั่วโมง
            </p>
          </div>
        )}

        <p className="text-[11px] text-center text-slate-400 flex items-center justify-center gap-1">
          <ShieldCheck className="h-3.5 w-3.5 text-teal-600" />
          ระบบจะเปิดกล้องสดและตรวจจับพิกัด GPS อัตโนมัติ (ห้ามอัปโหลดรูป)
        </p>
      </div>

      {/* Mandatory Live Camera Capture Modal */}
      {modalMode && location && (
        <CameraCaptureModal
          isOpen={Boolean(modalMode)}
          onClose={() => {
            stopAllActiveMediaStreams();
            setModalMode(null);
          }}
          mode={modalMode}
          targetLocation={location}
          onSuccess={handleActionSuccess}
        />
      )}
    </div>
  );
}
