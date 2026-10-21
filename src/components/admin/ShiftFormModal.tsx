"use client";

import React, { useState, useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface ShiftFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  isEditing: boolean;
  currentId: string | null;
  companyId: string;
  initialData?: any;
}

export function ShiftFormModal({
  isOpen,
  onClose,
  onSuccess,
  isEditing,
  currentId,
  companyId,
  initialData,
}: ShiftFormModalProps) {
  const [formData, setFormData] = useState({
    shiftCode: "",
    shiftName: "",
    startTime: "09:00",
    endTime: "18:00",
    gracePeriodMinutes: 15,
    active: true,
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (isEditing && initialData) {
        setFormData({
          shiftCode: initialData.shiftCode || "",
          shiftName: initialData.shiftName || "",
          startTime: initialData.startTime || "09:00",
          endTime: initialData.endTime || "18:00",
          gracePeriodMinutes: initialData.gracePeriodMinutes ?? 15,
          active: initialData.active ?? true,
        });
      } else {
        setFormData({
          shiftCode: `SHIFT-${Date.now().toString().slice(-4)}`,
          shiftName: "",
          startTime: "09:00",
          endTime: "18:00",
          gracePeriodMinutes: 15,
          active: true,
        });
      }
      setError(null);
    }
  }, [isOpen, isEditing, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const url = isEditing
        ? `/api/admin/shifts/${currentId}`
        : "/api/admin/shifts";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, companyId }),
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
      title={isEditing ? "แก้ไขกะเวลาทำงาน" : "สร้างกะเวลาทำงานใหม่"}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="รหัสกะ (Shift Code) *"
            required
            value={formData.shiftCode}
            onChange={(e) =>
              setFormData({ ...formData, shiftCode: e.target.value })
            }
            placeholder="เช่น SHIFT-NORM"
          />

          <Input
            label="ชื่อกะเวลา *"
            required
            value={formData.shiftName}
            onChange={(e) =>
              setFormData({ ...formData, shiftName: e.target.value })
            }
            placeholder="เช่น กะปกติ (สำนักงาน)"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="เวลาเริ่มงาน (Start Time) *"
            type="time"
            required
            value={formData.startTime}
            onChange={(e) =>
              setFormData({ ...formData, startTime: e.target.value })
            }
          />
          <Input
            label="เวลาสิ้นสุด (End Time) *"
            type="time"
            required
            value={formData.endTime}
            onChange={(e) =>
              setFormData({ ...formData, endTime: e.target.value })
            }
          />
        </div>

        <Input
          label="ระยะเวลายกเว้นการนับสาย (Grace Period - นาที) *"
          type="number"
          min={0}
          max={60}
          required
          value={formData.gracePeriodMinutes}
          onChange={(e) =>
            setFormData({
              ...formData,
              gracePeriodMinutes: parseInt(e.target.value, 10) || 0,
            })
          }
          helperText="หากลงเวลาเกินเวลานี้ จะถูกบันทึกเป็น 'มาสาย' (Late)"
        />

        <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
          <Button variant="outline" type="button" onClick={onClose}>
            ยกเลิก
          </Button>
          <Button
            type="submit"
            isLoading={submitting}
            className="bg-teal-600 text-white font-bold"
          >
            บันทึกกะเวลา
          </Button>
        </div>
      </form>
    </Modal>
  );
}
