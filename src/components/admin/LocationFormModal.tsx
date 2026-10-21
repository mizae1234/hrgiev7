"use client";

import React, { useState, useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface LocationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  isEditing: boolean;
  currentId: string | null;
  companies: any[];
  initialData?: any;
}

export function LocationFormModal({
  isOpen,
  onClose,
  onSuccess,
  isEditing,
  currentId,
  companies,
  initialData,
}: LocationFormModalProps) {
  const [formData, setFormData] = useState({
    locationCode: "",
    locationName: "",
    companyId: "",
    locationType: "OFFICE",
    address: "",
    latitude: 13.736717,
    longitude: 100.523186,
    allowedRadiusMeters: 100,
    active: true,
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (isEditing && initialData) {
        setFormData({
          locationCode: initialData.locationCode || "",
          locationName: initialData.locationName || "",
          companyId: initialData.companyId || companies[0]?.id || "",
          locationType: initialData.locationType || "OFFICE",
          address: initialData.address || "",
          latitude: initialData.latitude || 13.736717,
          longitude: initialData.longitude || 100.523186,
          allowedRadiusMeters: initialData.allowedRadiusMeters || 100,
          active: initialData.active ?? true,
        });
      } else {
        setFormData({
          locationCode: `LOC-${Date.now().toString().slice(-4)}`,
          locationName: "",
          companyId: companies[0]?.id || "",
          locationType: "BOOTH",
          address: "",
          latitude: 13.7466,
          longitude: 100.5393,
          allowedRadiusMeters: 100,
          active: true,
        });
      }
      setError(null);
    }
  }, [isOpen, isEditing, initialData, companies]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const url = isEditing
        ? `/api/admin/locations/${currentId}`
        : "/api/admin/locations";
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
      setError(err.message || "เกิดข้อผิดพลาด");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        isEditing
          ? "แก้ไขสถานที่ / บูธปฏิบัติงาน"
          : "เพิ่มสถานที่ปฏิบัติงาน / บูธใหม่"
      }
      maxWidth="lg"
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
            label="รหัสสถานที่ (Location Code) *"
            required
            value={formData.locationCode}
            onChange={(e) =>
              setFormData({ ...formData, locationCode: e.target.value })
            }
            placeholder="เช่น BOOTH-CTW"
          />

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">
              สังกัดบริษัท *
            </label>
            <select
              value={formData.companyId}
              onChange={(e) =>
                setFormData({ ...formData, companyId: e.target.value })
              }
              className="w-full rounded-lg border border-slate-300 p-2 text-xs"
            >
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="ชื่อสถานที่ / จุดบูธ *"
            required
            value={formData.locationName}
            onChange={(e) =>
              setFormData({ ...formData, locationName: e.target.value })
            }
            placeholder="เช่น บูธเซ็นทรัลเวิลด์ ชั้น 1"
          />

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">
              ประเภทสถานที่ *
            </label>
            <select
              value={formData.locationType}
              onChange={(e) =>
                setFormData({ ...formData, locationType: e.target.value })
              }
              className="w-full rounded-lg border border-slate-300 p-2 text-xs font-semibold"
            >
              <option value="OFFICE">🏢 สำนักงานใหญ่ (Office)</option>
              <option value="BRANCH">🏬 สาขา (Branch)</option>
              <option value="BOOTH">🎪 จุดบูธ / อีเวนต์ (Booth)</option>
              <option value="WAREHOUSE">📦 คลังสินค้า (Warehouse)</option>
            </select>
          </div>
        </div>

        <Input
          label="รายละเอียดที่อยู่ / จุดสังเกต"
          value={formData.address}
          onChange={(e) =>
            setFormData({ ...formData, address: e.target.value })
          }
          placeholder="เช่น ชั้น 1 โซนทางเข้า ห้างเมกา บางนา..."
        />

        <div className="grid grid-cols-3 gap-3">
          <Input
            label="ละติจูด (Latitude) *"
            type="number"
            step="any"
            required
            value={formData.latitude}
            onChange={(e) =>
              setFormData({
                ...formData,
                latitude: parseFloat(e.target.value) || 0,
              })
            }
          />
          <Input
            label="ลองจิจูด (Longitude) *"
            type="number"
            step="any"
            required
            value={formData.longitude}
            onChange={(e) =>
              setFormData({
                ...formData,
                longitude: parseFloat(e.target.value) || 0,
              })
            }
          />
          <Input
            label="รัศมีอนุญาต (เมตร) *"
            type="number"
            required
            value={formData.allowedRadiusMeters}
            onChange={(e) =>
              setFormData({
                ...formData,
                allowedRadiusMeters: parseInt(e.target.value, 10) || 100,
              })
            }
          />
        </div>

        {/* Quick GPS Presets */}
        <div className="pt-2">
          <span className="text-[11px] font-semibold text-slate-500 block mb-1">
            พิกัดตัวอย่างสำหรับทดสอบ (Presets):
          </span>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() =>
                setFormData({
                  ...formData,
                  latitude: 13.7466,
                  longitude: 100.5393,
                  locationName:
                    formData.locationName ||
                    "บูธเซ็นทรัลเวิลด์ (Central World)",
                  allowedRadiusMeters: 120,
                })
              }
              className="px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-[10px] text-slate-700 font-medium"
            >
              📍 เซ็นทรัลเวิลด์
            </button>
            <button
              type="button"
              onClick={() =>
                setFormData({
                  ...formData,
                  latitude: 13.6473,
                  longitude: 100.6806,
                  locationName:
                    formData.locationName || "บูธเมกา บางนา (Mega Bangna)",
                  allowedRadiusMeters: 100,
                })
              }
              className="px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-[10px] text-slate-700 font-medium"
            >
              📍 เมกา บางนา
            </button>
            <button
              type="button"
              onClick={() =>
                setFormData({
                  ...formData,
                  latitude: 13.9892,
                  longitude: 100.6178,
                  locationName:
                    formData.locationName || "บูธฟิวเจอร์พาร์ค รังสิต",
                  allowedRadiusMeters: 100,
                })
              }
              className="px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-[10px] text-slate-700 font-medium"
            >
              📍 ฟิวเจอร์พาร์ค รังสิต
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
          <Button variant="outline" type="button" onClick={onClose}>
            ยกเลิก
          </Button>
          <Button
            type="submit"
            isLoading={submitting}
            className="bg-teal-600 text-white font-bold"
          >
            บันทึกสถานที่
          </Button>
        </div>
      </form>
    </Modal>
  );
}
