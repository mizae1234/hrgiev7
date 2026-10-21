"use client";

import React, { useState, useEffect } from "react";
import {
  CalendarCheck,
  Plus,
  Trash2,
  MapPin,
  Clock,
  Building,
  User,
  Calendar,
} from "lucide-react";
import { useAdminContext } from "@/components/admin/AdminLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { AssignmentFormModal } from "@/components/admin/AssignmentFormModal";
import { formatBangkokDate, formatThaiFullDate, getTodayDateString } from "@/lib/attendance";

export default function BoothAssignmentPage() {
  const { selectedCompanyId } = useAdminContext();

  const [assignments, setAssignments] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedDate, setSelectedDate] = useState(() => getTodayDateString());
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch reference metadata
  useEffect(() => {
    Promise.all([
      fetch(`/api/admin/employees?companyId=${selectedCompanyId}`).then((r) => r.json()),
      fetch(`/api/admin/locations?companyId=${selectedCompanyId}`).then((r) => r.json()),
      fetch(`/api/admin/shifts?companyId=${selectedCompanyId}`).then((r) => r.json()),
    ]).then(([empData, locData, shiftData]) => {
      if (empData.employees) setEmployees(empData.employees);
      if (locData.locations) setLocations(locData.locations);
      if (shiftData.shifts) setShifts(shiftData.shifts);
    });
  }, [selectedCompanyId]);

  // Fetch assignments
  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/assignments?companyId=${selectedCompanyId}&date=${selectedDate}`
      );
      const data = await res.json();
      if (data.assignments) {
        setAssignments(data.assignments);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [selectedCompanyId, selectedDate]);

  const handleDelete = async (id: string) => {
    if (!confirm("ต้องการยกเลิกการมอบหมายจุดนี้ใช่หรือไม่?")) return;
    try {
      const res = await fetch(`/api/admin/assignments/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchAssignments();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            มอบหมายจุดบูธและสถานที่พิเศษ (Location Assignments)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            เมื่อพนักงานได้รับมอบหมายจุดบูธ ระบบจะเปลี่ยนสถานที่และกะที่ต้องลงเวลาในวันนั้นเป็นจุดบูธโดยอัตโนมัติ
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs focus:border-teal-500 focus:outline-none cursor-pointer"
          />

          <Button
            size="sm"
            onClick={() => setIsModalOpen(true)}
            className="font-semibold text-xs h-9 bg-teal-600 hover:bg-teal-700"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            มอบหมายจุดบูธใหม่
          </Button>
        </div>
      </div>

      {/* Date Banner */}
      <div className="p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between text-xs">
        <span className="font-semibold text-slate-700 flex items-center gap-2">
          <Calendar className="h-4 w-4 text-teal-600" />
          แสดงรายการมอบหมายประจำวันที่:{" "}
          <span className="font-bold text-teal-800">{selectedDate}</span>
        </span>
        <span className="text-slate-400">
          มอบหมายแล้วทั้งหมด <strong className="text-slate-700">{assignments.length}</strong> รายการ
        </span>
      </div>

      {/* Assignment List Table */}
      <Card className="border-slate-200/80">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-semibold uppercase">
              <tr>
                <th className="py-3 px-4">พนักงาน</th>
                <th className="py-3 px-4">สถานที่ / บูธ</th>
                <th className="py-3 px-4">กะเวลาทำงานพิเศษ</th>
                <th className="py-3 px-4">หมายเหตุ</th>
                <th className="py-3 px-4 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    กำลังโหลดข้อมูลการมอบหมายจุด...
                  </td>
                </tr>
              ) : assignments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    ไม่มีการมอบหมายจุดพิเศษในวันที่ {selectedDate} (พนักงานจะลงเวลา ณ สถานที่ทำงานหลัก)
                  </td>
                </tr>
              ) : (
                assignments.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center shrink-0">
                          {item.employee?.firstName?.charAt(0) || "E"}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block">
                            {item.employee?.firstName} {item.employee?.lastName}
                          </span>
                          <span className="font-mono text-[11px] text-slate-400">
                            {item.employee?.employeeId} • {item.employee?.position}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                        <div>
                          <span className="font-semibold text-slate-800 block">
                            {item.workLocation?.locationName}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            รัศมี {item.workLocation?.allowedRadiusMeters} ม.
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      {item.shiftTemplate ? (
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                          <span className="font-medium text-slate-800">
                            {item.shiftTemplate.shiftName} ({item.shiftTemplate.startTime} - {item.shiftTemplate.endTime})
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">ใช้กะเริ่มต้นของพนักงาน</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-slate-600">
                      {item.notes || "-"}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
                        className="text-rose-600 hover:bg-rose-50 h-8 px-2"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modular Booth Assignment Modal */}
      <AssignmentFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchAssignments}
        employees={employees}
        locations={locations}
        shifts={shifts}
        initialDate={selectedDate}
      />
    </div>
  );
}
