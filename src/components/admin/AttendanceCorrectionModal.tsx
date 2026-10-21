"use client";

import React, { useState, useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatBangkokTime } from "@/lib/attendance";

interface AttendanceCorrectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: any;
  onSuccess: () => void;
}

export function AttendanceCorrectionModal({
  isOpen,
  onClose,
  record,
  onSuccess,
}: AttendanceCorrectionModalProps) {
  const [newStatus, setNewStatus] = useState("PRESENT");
  const [newCheckIn, setNewCheckIn] = useState("");
  const [newCheckOut, setNewCheckOut] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && record) {
      setNewStatus(record.attendanceStatus || "PRESENT");
      setNewCheckIn(
        record.checkInTime ? new Date(record.checkInTime).toISOString().slice(0, 16) : ""
      );
      setNewCheckOut(
        record.checkOutTime ? new Date(record.checkOutTime).toISOString().slice(0, 16) : ""
      );
      setReason("");
      setError(null);
    }
  }, [isOpen, record]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!record) return;
    if (!reason.trim()) {
      setError("จำเป็นต้องระบุเหตุผลการแก้ไข (Audit Trail Requirement)");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/attendance/correct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          summaryId: record.id,
          newStatus,
          newCheckIn: newCheckIn ? new Date(newCheckIn).toISOString() : undefined,
          newCheckOut: newCheckOut ? new Date(newCheckOut).toISOString() : undefined,
          reason: reason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "เกิดข้อผิดพลาดในการแก้ไข");

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "เกิดข้อผิดพลาดในการแก้ไข");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`แก้ไขข้อมูลการลงเวลา: ${record?.employee?.firstName} ${record?.employee?.lastName}`}
      description="ระบบจะบันทึกประวัติการเปลี่ยนแปลง เหตุผล และผู้แก้ไขลงใน Audit Trail เพื่อความโปร่งใส"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Original Values Box */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
          <span className="font-bold text-slate-700 block mb-1">ข้อมูลเดิมก่อนแก้ไข:</span>
          <div className="flex justify-between text-slate-600">
            <span>เวลาเข้าเดิม:</span>
            <span className="font-mono font-semibold">
              {record?.checkInTime ? formatBangkokTime(new Date(record.checkInTime)) : "-"}
            </span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>เวลาออกเดิม:</span>
            <span className="font-mono font-semibold">
              {record?.checkOutTime ? formatBangkokTime(new Date(record.checkOutTime)) : "-"}
            </span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>สถานะเดิม:</span>
            <span className="font-bold text-slate-800">{record?.attendanceStatus}</span>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700">สถานะการลงเวลาใหม่ *</label>
          <select
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs font-bold text-slate-800 focus:border-teal-500 focus:outline-none"
          >
            <option value="PRESENT">ตรงเวลา (PRESENT)</option>
            <option value="LATE">มาสาย (LATE)</option>
            <option value="EARLY_LEAVE">กลับก่อนเวลา (EARLY_LEAVE)</option>
            <option value="ABSENT">ขาดงาน (ABSENT)</option>
            <option value="MISSING_CHECKOUT">ลืมลงเวลาออก (MISSING_CHECKOUT)</option>
            <option value="DAY_OFF">วันหยุดประจำสัปดาห์ (DAY_OFF)</option>
            <option value="ON_LEAVE">ลางานมีใบรับรอง (ON_LEAVE)</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="เวลาเข้างานใหม่ (Optional)"
            type="datetime-local"
            value={newCheckIn}
            onChange={(e) => setNewCheckIn(e.target.value)}
          />
          <Input
            label="เวลาออกงานใหม่ (Optional)"
            type="datetime-local"
            value={newCheckOut}
            onChange={(e) => setNewCheckOut(e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700">
            เหตุผลการแก้ไข (Audit Trail Requirement) *
          </label>
          <textarea
            required
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="เช่น พนักงานแจ้งสัญญาณโทรศัพท์มีปัญหา ณ จุดบูธ, ได้รับอนุมัติจากผู้จัดการ..."
            className="w-full rounded-lg border border-slate-300 p-2.5 text-xs focus:border-teal-500 focus:outline-none"
          />
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
          <Button variant="outline" type="button" onClick={onClose}>
            ยกเลิก
          </Button>
          <Button type="submit" isLoading={submitting} className="bg-teal-600 text-white font-bold">
            บันทึกการแก้ไขและ Audit Log
          </Button>
        </div>
      </form>
    </Modal>
  );
}
