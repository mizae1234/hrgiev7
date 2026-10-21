"use client";

import React, { useState, useEffect } from "react";
import { Clock, Plus, Edit2, ShieldAlert } from "lucide-react";
import { useAdminContext } from "@/components/admin/AdminLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ShiftFormModal } from "@/components/admin/ShiftFormModal";

export default function ShiftManagementPage() {
  const { selectedCompanyId } = useAdminContext();

  const [shifts, setShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentShift, setCurrentShift] = useState<any>(null);

  const fetchShifts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/shifts?companyId=${selectedCompanyId}`);
      const data = await res.json();
      if (data.shifts) {
        setShifts(data.shifts);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShifts();
  }, [selectedCompanyId]);

  const handleOpenAdd = () => {
    setIsEditing(false);
    setCurrentShift(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (shift: any) => {
    setIsEditing(true);
    setCurrentShift(shift);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            จัดการกะเวลาทำงาน (Shift Templates)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            กำหนดเวลาเริ่มงาน-เลิกงาน และระยะเวลายืดหยุ่นก่อนคิดสาย (Grace Period)
          </p>
        </div>

        <Button
          size="sm"
          onClick={handleOpenAdd}
          className="font-semibold text-xs h-9 bg-teal-600 hover:bg-teal-700"
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          สร้างกะเวลาใหม่
        </Button>
      </div>

      {/* Priority Logic Banner */}
      <div className="rounded-2xl bg-teal-50/80 border border-teal-200/80 p-4 text-xs text-teal-900 flex items-start gap-3">
        <ShieldAlert className="h-5 w-5 text-teal-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block text-sm mb-1 text-teal-950">
            ลำดับความสำคัญของกะเวลาการคำนวณ (Shift Priority Hierarchy):
          </span>
          <ol className="list-decimal list-inside space-y-0.5 text-teal-800">
            <li>
              <span className="font-bold">ลำดับที่ 1 (สูงสุด):</span> กะที่ระบุในการมอบหมายประจำจุดบูธหรือเปลี่ยนรายวัน (Daily Assignment Override)
            </li>
            <li>
              <span className="font-bold">ลำดับที่ 2:</span> กะเวลาที่ระบุในตารางงานรายบุคคล (Explicit Work Schedule)
            </li>
            <li>
              <span className="font-bold">ลำดับที่ 3:</span> กะทำงานเริ่มต้นประจำตัวพนักงาน (Employee Default Shift)
            </li>
          </ol>
        </div>
      </div>

      {/* Shifts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-12 text-center text-xs text-slate-400">
            กำลังโหลดข้อมูลกะเวลา...
          </div>
        ) : shifts.length === 0 ? (
          <div className="col-span-full py-12 text-center text-xs text-slate-400">
            ยังไม่มีข้อมูลกะเวลาการทำงาน
          </div>
        ) : (
          shifts.map((shift) => (
            <Card
              key={shift.id}
              className="hover:shadow-md transition-all border-slate-200/80 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 rounded-xl bg-teal-50 text-teal-600">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="font-mono text-[11px] font-bold text-slate-400 block">
                        {shift.shiftCode}
                      </span>
                      <h3 className="font-bold text-sm text-slate-900 leading-tight">
                        {shift.shiftName}
                      </h3>
                    </div>
                  </div>

                  <Badge variant={shift.active ? "success" : "default"} size="sm">
                    {shift.active ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                  </Badge>
                </div>

                <div className="my-4 rounded-xl bg-slate-50 p-3.5 border border-slate-100 flex items-center justify-around text-center">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">
                      เวลาเข้างาน
                    </span>
                    <span className="font-mono font-black text-lg text-slate-900">
                      {shift.startTime}
                    </span>
                  </div>
                  <span className="text-slate-300 font-bold">→</span>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">
                      เวลาเลิกงาน
                    </span>
                    <span className="font-mono font-black text-lg text-slate-900">
                      {shift.endTime}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">ระยะเวลายืดหยุ่น (Grace Period):</span>
                    <span className="font-bold text-teal-700">{shift.gracePeriodMinutes} นาที</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">เริ่มคิดสายเมื่อเกิน:</span>
                    <span className="font-mono font-semibold text-amber-700">
                      {shift.startTime} + {shift.gracePeriodMinutes} นาที
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenEdit(shift)}
                  className="h-8 text-xs font-semibold"
                >
                  <Edit2 className="h-3 w-3 mr-1" /> แก้ไขกะ
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Modular Shift Modal */}
      <ShiftFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchShifts}
        isEditing={isEditing}
        currentId={currentShift?.id || null}
        companyId={selectedCompanyId}
        initialData={currentShift}
      />
    </div>
  );
}
