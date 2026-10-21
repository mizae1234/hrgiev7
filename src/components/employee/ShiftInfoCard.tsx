import React from "react";
import { Clock, MapPin } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface ShiftInfoCardProps {
  shift: {
    shiftName?: string;
    startTime?: string;
    endTime?: string;
  };
  location: {
    locationName?: string;
    address?: string;
    allowedRadiusMeters?: number;
  };
  isBooth?: boolean;
}

export function ShiftInfoCard({ shift, location, isBooth }: ShiftInfoCardProps) {
  return (
    <Card className="border-slate-200/80 space-y-3.5 p-4 shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
          <Clock className="h-4 w-4 text-teal-600" />
          กะเวลาการทำงานวันนี้
        </span>
        <Badge variant={isBooth ? "warning" : "success"} size="sm">
          {shift?.shiftName ? shift.shiftName.split("(")[0] : "กะปกติ"}
        </Badge>
      </div>

      {/* Time Display */}
      <div className="grid grid-cols-2 gap-3 text-center py-1 bg-slate-50 rounded-2xl p-3 border border-slate-100">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 block">เวลาเริ่มกะ</span>
          <span className="font-mono text-xl font-black text-slate-900">{shift?.startTime} น.</span>
        </div>
        <div className="border-l border-slate-200">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">เวลาสิ้นสุด</span>
          <span className="font-mono text-xl font-black text-slate-900">{shift?.endTime} น.</span>
        </div>
      </div>

      {/* Work Location Detail */}
      <div className="pt-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-bold text-slate-900 block leading-tight">
                {location?.locationName}
              </span>
              <span className="text-[11px] text-slate-500 block mt-0.5 line-clamp-1">
                {location?.address || "สำนักงานใหญ่"}
              </span>
            </div>
          </div>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
              isBooth ? "bg-amber-100 text-amber-800" : "bg-teal-100 text-teal-800"
            }`}
          >
            {isBooth ? "จุดบูธ" : "สำนักงาน"}
          </span>
        </div>

        <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between">
          <span>รัศมี GPS ที่อนุญาต: {location?.allowedRadiusMeters || 100} เมตร</span>
          <span className="text-teal-600 font-semibold">ตรวจสอบพิกัดสด</span>
        </div>
      </div>
    </Card>
  );
}
