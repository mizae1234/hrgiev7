import React from "react";
import { Calendar } from "lucide-react";

interface EmployeeGreetingBannerProps {
  firstName?: string;
  lastName?: string;
  employeeId?: string;
  position?: string;
  todayFormatted: string;
}

export function EmployeeGreetingBanner({
  firstName,
  lastName,
  employeeId,
  position,
  todayFormatted,
}: EmployeeGreetingBannerProps) {
  return (
    <div className="bg-linear-to-r from-teal-700 to-emerald-700 rounded-3xl p-5 text-white shadow-xl shadow-teal-900/10">
      <div className="flex items-center justify-between text-xs text-teal-200 mb-1">
        <span className="flex items-center gap-1.5 font-medium">
          <Calendar className="h-3.5 w-3.5" /> {todayFormatted}
        </span>
        <span className="font-bold bg-white/20 px-2 py-0.5 rounded-full text-[10px]">
          {employeeId}
        </span>
      </div>
      <h2 className="text-xl font-black tracking-tight">
        สวัสดีคุณ {firstName} {lastName}
      </h2>
      <p className="text-xs text-teal-100 mt-0.5">{position}</p>
    </div>
  );
}
