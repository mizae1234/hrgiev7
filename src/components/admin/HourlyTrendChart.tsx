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

interface HourlyBucket {
  hour: string;
  count: number;
}

interface HourlyTrendChartProps {
  data: HourlyBucket[];
}

export function HourlyTrendChart({ data }: HourlyTrendChartProps) {
  return (
    <Card className="border-slate-200/80">
      <CardHeader>
        <CardTitle className="text-sm font-bold text-slate-900">
          สถิติการลงเวลาเข้างานตามช่วงเวลา (Hourly Check-ins)
        </CardTitle>
        <p className="text-xs text-slate-500">
          จำนวนพนักงานที่บันทึกเวลาเข้างานในแต่ละชั่วโมงของวันนี้
        </p>
      </CardHeader>
      <CardContent className="h-64 pt-2">
        {data && data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="hour" tick={{ fontSize: 11, fill: "#64748b" }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} />
              <Tooltip
                formatter={(val) => [`${val} คน`, "เข้างาน"]}
                contentStyle={{
                  backgroundColor: "#0f172a",
                  color: "#fff",
                  borderRadius: "12px",
                  fontSize: "12px",
                  border: "none",
                }}
              />
              <Bar dataKey="count" fill="#0d9488" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-xs text-slate-400">
            ยังไม่มีข้อมูลการลงเวลาในวันนี้
          </div>
        )}
      </CardContent>
    </Card>
  );
}
