"use client";

import React, { useState, useEffect } from "react";
import {
  CalendarDays,
  Clock,
  MapPin,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Store,
  Building,
  Flag,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatBangkokDate } from "@/lib/attendance";

export default function EmployeeSchedulePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentMonthDate, setCurrentMonthDate] = useState(() => new Date());
  const [todayStr] = useState(() => formatBangkokDate(new Date()));

  useEffect(() => {
    fetch("/api/employee/schedule")
      .then((r) => r.json())
      .then((json) => setData(json))
      .finally(() => setLoading(false));
  }, []);

  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();

  // Days in month calculation
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startDayOfWeek = firstDay.getDay(); // 0 is Sunday

  const monthNames = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
  ];

  const prevMonth = () => {
    setCurrentMonthDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonthDate(new Date(year, month + 1, 1));
  };

  const assignments = data?.assignments || [];
  const holidays = data?.holidays || [];
  const defaultShift = data?.defaultShift;
  const defaultLocation = data?.defaultLocation;

  return (
    <div className="space-y-4 max-w-md mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-black text-slate-900 tracking-tight">
          ตารางงานประจำเดือน (Work Schedule)
        </h1>
        <p className="text-xs text-slate-500">
          ตรวจสอบกะเวลาทำงาน วันหยุด และจุดปฏิบัติงานที่ได้รับมอบหมาย
        </p>
      </div>

      {/* Month Selector Bar */}
      <div className="flex items-center justify-between p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
        <button
          onClick={prevMonth}
          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="font-bold text-sm text-slate-900">
          {monthNames[month]} {year + 543}
        </span>
        <button
          onClick={nextMonth}
          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Calendar Grid */}
      <Card className="border-slate-200/80 p-3 shadow-xs">
        {/* Day of Week Headers */}
        <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-slate-400 pb-2 border-b border-slate-100">
          <span className="text-rose-500">อา.</span>
          <span>จ.</span>
          <span>อ.</span>
          <span>พ.</span>
          <span>พฤ.</span>
          <span>ศ.</span>
          <span className="text-teal-600">ส.</span>
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-1 text-center pt-2">
          {Array.from({ length: startDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="h-14" />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
            const isToday = todayStr === dateStr;

            const assignment = assignments.find((a: any) => a.date === dateStr);
            const holiday = holidays.find((h: any) => h.date === dateStr);
            const isWeekend = (startDayOfWeek + i) % 7 === 0 || (startDayOfWeek + i) % 7 === 6;

            return (
              <div
                key={dayNum}
                className={`h-14 p-1 rounded-xl flex flex-col items-center justify-between transition-colors border ${
                  isToday
                    ? "bg-teal-50/80 border-teal-500 font-bold"
                    : assignment
                    ? "bg-amber-50/60 border-amber-300"
                    : holiday
                    ? "bg-rose-50/60 border-rose-300"
                    : "border-slate-100 bg-white hover:bg-slate-50"
                }`}
              >
                <span
                  className={`text-xs ${
                    isToday
                      ? "text-teal-700 font-black"
                      : isWeekend
                      ? "text-slate-400"
                      : "text-slate-700"
                  }`}
                >
                  {dayNum}
                </span>

                {assignment ? (
                  <span className="w-full text-[9px] font-bold px-1 py-0.2 rounded-md bg-amber-200 text-amber-900 truncate">
                    บูธพิเศษ
                  </span>
                ) : holiday ? (
                  <span className="w-full text-[9px] font-bold px-1 py-0.2 rounded-md bg-rose-200 text-rose-900 truncate">
                    วันหยุด
                  </span>
                ) : isWeekend ? (
                  <span className="text-[9px] text-slate-300">หยุด</span>
                ) : (
                  <span className="text-[9px] text-teal-600 font-semibold font-mono">
                    {defaultShift ? defaultShift.startTime.slice(0, 5) : "09:00"}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Special Assignments & Holidays for this Month */}
      <div className="space-y-3">
        <span className="text-xs font-bold text-slate-800 block">
          รายการมอบหมายพิเศษ & วันหยุดในเดือนนี้
        </span>

        {assignments.length > 0 ? (
          assignments.map((item: any) => (
            <Card key={item.id} className="border-amber-200 bg-amber-50/40 p-3.5 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <Store className="h-4 w-4 text-amber-600" />
                  {item.workLocation?.locationName}
                </span>
                <Badge variant="warning" size="sm">
                  {item.date}
                </Badge>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                {item.notes || "มอบหมายงานบูธพิเศษ"}
              </p>
              <div className="text-[10px] text-amber-700 font-mono">
                กะเวลา: {item.shiftTemplate?.startTime || "11:00"} - {item.shiftTemplate?.endTime || "20:00"} น.
              </div>
            </Card>
          ))
        ) : (
          <p className="text-xs text-slate-400 text-center py-2">
            ไม่มีรายการมอบหมายบูธพิเศษในเดือนนี้
          </p>
        )}

        {/* Holidays */}
        {holidays.map((h: any) => (
          <div
            key={h.id}
            className="p-3 bg-white rounded-xl border border-slate-200 text-xs flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Flag className="h-4 w-4 text-rose-500" />
              <div>
                <span className="font-semibold text-slate-800 block">{h.name}</span>
                <span className="text-[10px] text-slate-400">{h.description}</span>
              </div>
            </div>
            <span className="font-mono text-slate-500 font-semibold">{h.date}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
