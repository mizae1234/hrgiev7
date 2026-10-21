import React from "react";
import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  subText?: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
}

export function StatCard({
  label,
  value,
  unit,
  subText,
  icon: Icon,
  color,
  bgColor,
}: StatCardProps) {
  return (
    <Card className="hover:shadow-md transition-all border-slate-200/80">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500">{label}</p>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              {value}
            </span>
            {unit && <span className="text-xs font-semibold text-slate-500">{unit}</span>}
          </div>
          {subText && (
            <p className="text-[11px] text-emerald-600 font-semibold mt-1">
              {subText}
            </p>
          )}
        </div>
        <div className={`p-2.5 rounded-xl ${bgColor} ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}
