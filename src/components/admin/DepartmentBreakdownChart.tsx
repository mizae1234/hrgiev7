"use client";

import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

interface DepartmentStat {
  name: string;
  fullName: string;
  checkedIn: number;
  late: number;
}

interface DepartmentBreakdownChartProps {
  data: DepartmentStat[];
}

export function DepartmentBreakdownChart({ data }: DepartmentBreakdownChartProps) {
  return (
    <Card className="border-slate-200/80">
      <CardHeader>
        <CardTitle className="text-sm font-bold text-slate-900">
          การลงเวลาแยกตามฝ่าย / แผนก (Department Breakdown)
        </CardTitle>
        <p className="text-xs text-slate-500">
          เปรียบเทียบจำนวนพนักงานที่เข้างานและมาสายในแต่ละแผนก
        </p>
      </CardHeader>
      <CardContent className="h-64 pt-2">
        {data && data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  color: "#fff",
                  borderRadius: "12px",
                  fontSize: "12px",
                  border: "none",
                }}
              />
              <Bar dataKey="checkedIn" name="เข้างานแล้ว" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="late" name="มาสาย" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-xs text-slate-400">
            ไม่มีข้อมูลแผนก
          </div>
        )}
      </CardContent>
    </Card>
  );
}
