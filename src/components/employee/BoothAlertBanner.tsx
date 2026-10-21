import React from "react";
import { Sparkles } from "lucide-react";

interface BoothAlertBannerProps {
  notes?: string;
}

export function BoothAlertBanner({ notes }: BoothAlertBannerProps) {
  return (
    <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs shadow-2xs">
      <div className="flex items-center gap-1.5 font-bold text-amber-800 mb-1">
        <Sparkles className="h-4 w-4 text-amber-600" />
        <span>วันนี้คุณได้รับมอบหมายงานพิเศษประจำบูธ!</span>
      </div>
      <p className="text-[11px] text-amber-700 leading-relaxed">
        {notes || "กรุณาลงเวลา ณ จุดบูธที่ได้รับมอบหมายตามพิกัด GPS ที่กำหนด"}
      </p>
    </div>
  );
}
