"use client";

import React, { useState, useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export interface EmployeeFormData {
  id?: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  companyId: string;
  departmentId: string;
  position: string;
  email: string;
  phone: string;
  employmentStartDate: string;
  resignationDate: string;
  employmentStatus: string;
  defaultShiftId: string;
  defaultLocationId: string;
}

interface EmployeeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  isEditing: boolean;
  initialData?: EmployeeFormData | null;
  companies: any[];
  shifts: any[];
  locations: any[];
  onSuccess: () => void;
}

const selectClassName =
  "block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 transition-colors focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-600";

export function EmployeeFormModal({
  isOpen,
  onClose,
  isEditing,
  initialData,
  companies,
  shifts,
  locations,
  onSuccess,
}: EmployeeFormModalProps) {
  const [formData, setFormData] = useState<EmployeeFormData>({
    employeeId: "",
    firstName: "",
    lastName: "",
    companyId: "",
    departmentId: "",
    position: "",
    email: "",
    phone: "",
    employmentStartDate: "",
    resignationDate: "",
    employmentStatus: "ACTIVE",
    defaultShiftId: "",
    defaultLocationId: "",
  });

  const [departments, setDepartments] = useState<any[]>([]);
  const [loadingDepts, setLoadingDepts] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync initial data when modal opens
  useEffect(() => {
    if (isOpen) {
      setError(null);
      if (isEditing && initialData) {
        setFormData(initialData);
      } else {
        const defaultCompId = companies[0]?.id || "";
        setFormData({
          employeeId: `EMP-${Date.now().toString().slice(-4)}`,
          firstName: "",
          lastName: "",
          companyId: defaultCompId,
          departmentId: "",
          position: "",
          email: "",
          phone: "",
          employmentStartDate: new Date().toISOString().split("T")[0],
          resignationDate: "",
          employmentStatus: "ACTIVE",
          defaultShiftId: shifts[0]?.id || "",
          defaultLocationId: locations[0]?.id || "",
        });
      }
    }
  }, [isOpen, isEditing, initialData, companies, shifts, locations]);

  // Fetch departments DYNAMICALLY whenever companyId changes
  useEffect(() => {
    if (!formData.companyId) {
      setDepartments([]);
      return;
    }

    setLoadingDepts(true);
    fetch(`/api/admin/departments?companyId=${formData.companyId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.departments) {
          setDepartments(data.departments);
          // If current departmentId doesn't belong to new company, set to first department
          if (!data.departments.some((d: any) => d.id === formData.departmentId)) {
            setFormData((prev) => ({
              ...prev,
              departmentId: data.departments[0]?.id || "",
            }));
          }
        }
      })
      .catch((err) => console.error("Error loading departments:", err))
      .finally(() => setLoadingDepts(false));
  }, [formData.companyId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const url = isEditing
        ? `/api/admin/employees/${formData.id}`
        : "/api/admin/employees";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "เกิดข้อผิดพลาดในการบันทึก");

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `แก้ไขข้อมูลพนักงาน (${formData.employeeId})` : "เพิ่มพนักงานใหม่ (Add Employee)"}
      description="กรอกข้อมูลประวัติพนักงาน กำหนดบริษัท แผนก และกะทำงานเริ่มต้น"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            label="รหัสพนักงาน"
            required
            disabled={isEditing}
            value={formData.employeeId}
            onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
          />
          <Input
            label="ชื่อจริง"
            required
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
          />
          <Input
            label="นามสกุล"
            required
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">บริษัท *</label>
            <select
              required
              disabled={isEditing}
              value={formData.companyId}
              onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
              className={selectClassName}
            >
              <option value="">เลือกบริษัท</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} - {c.name.split("(")[0]}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">
              แผนก * {loadingDepts && <span className="text-[10px] text-teal-600">(กำลังโหลด...)</span>}
            </label>
            <select
              required
              value={formData.departmentId}
              onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
              className={selectClassName}
            >
              <option value="">เลือกแผนก</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="ตำแหน่งงาน"
            required
            value={formData.position}
            onChange={(e) => setFormData({ ...formData, position: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="อีเมล"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <Input
            label="เบอร์โทรศัพท์"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            label="วันเริ่มงาน"
            type="date"
            required
            value={formData.employmentStartDate}
            onChange={(e) => setFormData({ ...formData, employmentStartDate: e.target.value })}
          />

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">กะทำงานเริ่มต้น</label>
            <select
              value={formData.defaultShiftId}
              onChange={(e) => setFormData({ ...formData, defaultShiftId: e.target.value })}
              className={selectClassName}
            >
              <option value="">ไม่กำหนด (ใช้ค่าเริ่มต้น)</option>
              {shifts.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.shiftName} ({s.startTime}-{s.endTime})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">สถานที่ปฏิบัติงานหลัก</label>
            <select
              value={formData.defaultLocationId}
              onChange={(e) => setFormData({ ...formData, defaultLocationId: e.target.value })}
              className={selectClassName}
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

        {isEditing && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-100">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">สถานะการจ้างงาน</label>
              <select
                value={formData.employmentStatus}
                onChange={(e) => setFormData({ ...formData, employmentStatus: e.target.value })}
                className={`${selectClassName} font-bold`}
              >
                <option value="ACTIVE">ปฏิบัติงาน (ACTIVE)</option>
                <option value="INACTIVE">พักงาน (INACTIVE)</option>
                <option value="RESIGNED">ลาออกแล้ว (RESIGNED)</option>
                <option value="SUSPENDED">ระงับชั่วคราว (SUSPENDED)</option>
              </select>
            </div>

            <Input
              label="วันลาออก (กรณีพ้นสภาพ)"
              type="date"
              value={formData.resignationDate}
              onChange={(e) => setFormData({ ...formData, resignationDate: e.target.value })}
            />
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
          <Button variant="outline" type="button" onClick={onClose}>
            ยกเลิก
          </Button>
          <Button type="submit" isLoading={submitting} className="bg-teal-600 text-white font-bold">
            {isEditing ? "บันทึกการแก้ไข" : "บันทึกข้อมูลพนักงาน"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
