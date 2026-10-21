"use client";

import React, { useState, useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface AssignmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  employees: any[];
  locations: any[];
  shifts: any[];
  initialDate: string;
}

export function AssignmentFormModal({
  isOpen,
  onClose,
  onSuccess,
  employees,
  locations,
  shifts,
  initialDate,
}: AssignmentFormModalProps) {
  const [formData, setFormData] = useState({
    employeeIds: [] as string[],
    date: initialDate,
    workLocationId: "",
    shiftTemplateId: "",
    notes: "มอบหมายปฏิบัติงานประจำจุดบูธพิเศษ",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const boothLocations = locations.filter((l) => l.locationType === "BOOTH");
      setFormData({
        employeeIds: employees.length > 0 ? [employees[0].id] : [],
        date: initialDate,
        workLocationId: boothLocations[0]?.id || locations[0]?.id || "",
        shiftTemplateId: shifts[1]?.id || shifts[0]?.id || "",
        notes: "มอบหมายปฏิบัติงานประจำจุดบูธพิเศษ",
      });
      setError(null);
    }
  }, [isOpen, initialDate, locations, shifts, employees]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.employeeIds.length === 0) {
      setError("กรุณาเลือกพนักงานอย่างน้อย 1 คน");
      return;
    }
    if (!formData.workLocationId) {
      setError("กรุณาเลือกสถานที่ปฏิบัติงาน");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "เกิดข้อผิดพลาดในการบันทึก");

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "เกิดข้อผิดพลาด");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="มอบหมายพนักงานประจำจุดบูธ (Booth Assignment)"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="วันที่ปฏิบัติงาน *"
            type="date"
            required
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          />

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">สถานที่ปฏิบัติงาน / บูธ *</label>
            <select
              required
              value={formData.workLocationId}
              onChange={(e) => setFormData({ ...formData, workLocationId: e.target.value })}
              className="w-full rounded-lg border border-slate-300 p-2 text-xs"
            >
              <option value="">เลือกสถานที่</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  [{l.locationType}] {l.locationName}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700">กะเวลาทำงานพิเศษสำหรับวันนี้</label>
          <select
            value={formData.shiftTemplateId}
            onChange={(e) => setFormData({ ...formData, shiftTemplateId: e.target.value })}
            className="w-full rounded-lg border border-slate-300 p-2 text-xs"
          >
            <option value="">ใช้กะเริ่มต้นของพนักงาน</option>
            {shifts.map((s) => (
              <option key={s.id} value={s.id}>
                {s.shiftName} ({s.startTime} - {s.endTime})
              </option>
            ))}
          </select>
        </div>

        {/* Multiple employee selector */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700">
            เลือกพนักงานที่ต้องการมอบหมาย (เลือกได้หลายคนพร้อมกัน) *
          </label>
          <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl p-2 space-y-1 bg-slate-50/50">
            {employees.map((emp) => {
              const isSelected = formData.employeeIds.includes(emp.id);
              return (
                <label
                  key={emp.id}
                  className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                    isSelected ? "bg-teal-50 border border-teal-200" : "hover:bg-slate-100"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({
                          ...formData,
                          employeeIds: [...formData.employeeIds, emp.id],
                        });
                      } else {
                        setFormData({
                          ...formData,
                          employeeIds: formData.employeeIds.filter((id) => id !== emp.id),
                        });
                      }
                    }}
                    className="rounded text-teal-600 focus:ring-teal-500"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-slate-800">
                      {emp.employeeId} - {emp.firstName} {emp.lastName}
                    </span>
                    <span className="text-[11px] text-slate-500 ml-2">({emp.position})</span>
                  </div>
                </label>
              );
            })}
          </div>
          <p className="text-[11px] text-slate-400">เลือกแล้ว {formData.employeeIds.length} คน</p>
        </div>

        <Input
          label="หมายเหตุ / งานที่มอบหมาย"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="เช่น ปฏิบัติงานส่งเสริมการขาย กะบ่าย..."
        />

        <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
          <Button variant="outline" type="button" onClick={onClose}>
            ยกเลิก
          </Button>
          <Button type="submit" isLoading={submitting} className="bg-teal-600 text-white font-bold">
            ยืนยันการมอบหมาย
          </Button>
        </div>
      </form>
    </Modal>
  );
}
