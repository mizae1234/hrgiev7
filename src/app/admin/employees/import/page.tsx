"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowLeft,
  RefreshCw,
  FileCheck,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export default function EmployeeImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [onDuplicate, setOnDuplicate] = useState<"skip" | "update">("skip");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [importResult, setImportResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setPreviewData(null);
      setImportResult(null);
      setError(null);
    }
  };

  // 1. Download Template
  const handleDownloadTemplate = () => {
    window.location.href = "/api/admin/employees/export-template";
  };

  // 2. Upload & Preview
  const handlePreview = async () => {
    if (!file) {
      setError("กรุณาเลือกไฟล์ Excel (.xlsx)");
      return;
    }

    setPreviewLoading(true);
    setError(null);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("action", "preview");
      formData.append("onDuplicate", onDuplicate);

      const res = await fetch("/api/admin/employees/import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "เกิดข้อผิดพลาดในการตรวจสอบไฟล์");

      setPreviewData(data);
    } catch (err: any) {
      setError(err.message || "เกิดข้อผิดพลาดในการตรวจสอบไฟล์");
    } finally {
      setPreviewLoading(false);
    }
  };

  // 3. Confirm Import
  const handleConfirmImport = async () => {
    if (!file) return;

    setConfirmLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("action", "confirm");
      formData.append("onDuplicate", onDuplicate);

      const res = await fetch("/api/admin/employees/import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "เกิดข้อผิดพลาดในการนำเข้า");

      setImportResult(data);
      setPreviewData(null);
    } catch (err: any) {
      setError(err.message || "เกิดข้อผิดพลาดในการนำเข้าข้อมูล");
    } finally {
      setConfirmLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/admin/employees"
              className="text-xs text-teal-600 hover:underline flex items-center gap-1 font-semibold"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> กลับหน้ารายชื่อพนักงาน
            </Link>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            นำเข้าข้อมูลพนักงานจากไฟล์ Excel (Batch Import)
          </h1>
          <p className="text-xs text-slate-500">
            ดาวน์โหลดไฟล์ต้นแบบ กรอกข้อมูล ตรวจสอบความถูกต้อง และนำเข้าระบบพร้อมกันหลายรายการ
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleDownloadTemplate}
          className="font-semibold text-xs h-9 text-teal-700 border-teal-200 bg-teal-50/50 hover:bg-teal-50"
        >
          <Download className="h-3.5 w-3.5 mr-1" />
          ดาวน์โหลดไฟล์ต้นแบบ (Template.xlsx)
        </Button>
      </div>

      {/* Upload & Setting Card */}
      <Card className="border-slate-200/80">
        <CardHeader>
          <CardTitle className="text-sm font-bold text-slate-900">
            ขั้นตอนที่ 1: เลือกไฟล์และกำหนดเงื่อนไขการนำเข้า
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* File Input Box */}
            <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:border-teal-500 transition-colors bg-slate-50/50">
              <input
                type="file"
                id="excelFile"
                accept=".xlsx, .xls"
                onChange={handleFileChange}
                className="hidden"
              />
              <label
                htmlFor="excelFile"
                className="cursor-pointer flex flex-col items-center justify-center space-y-2"
              >
                <div className="h-12 w-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
                  <FileSpreadsheet className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-xs font-bold text-teal-600 hover:underline block">
                    {file ? file.name : "คลิกเพื่อเลือกไฟล์ Excel (.xlsx)"}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {file
                      ? `ขนาดไฟล์ ${(file.size / 1024).toFixed(1)} KB`
                      : "รองรับไฟล์ Microsoft Excel (.xlsx)"}
                  </span>
                </div>
              </label>
            </div>

            {/* Options */}
            <div className="space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">
                  เมื่อพบรหัสพนักงานที่มีอยู่แล้วในระบบ (Duplicate Action):
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50">
                    <input
                      type="radio"
                      name="onDuplicate"
                      value="skip"
                      checked={onDuplicate === "skip"}
                      onChange={() => setOnDuplicate("skip")}
                      className="text-teal-600 focus:ring-teal-500"
                    />
                    <div>
                      <span className="font-semibold block">ข้ามรายการที่มีอยู่แล้ว (Skip Existing)</span>
                      <span className="text-[10px] text-slate-500">
                        จะไม่แก้ไขข้อมูลเดิมของพนักงานที่มีรหัสตรงกัน
                      </span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50">
                    <input
                      type="radio"
                      name="onDuplicate"
                      value="update"
                      checked={onDuplicate === "update"}
                      onChange={() => setOnDuplicate("update")}
                      className="text-teal-600 focus:ring-teal-500"
                    />
                    <div>
                      <span className="font-semibold block">อัปเดตข้อมูลเดิม (Update Existing)</span>
                      <span className="text-[10px] text-slate-500">
                        อัปเดตชื่อ แผนก ตำแหน่ง และกะเวลาตามข้อมูลในไฟล์
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              <Button
                onClick={handlePreview}
                disabled={!file}
                isLoading={previewLoading}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold h-11"
              >
                <Upload className="h-4 w-4 mr-1.5" />
                ตรวจสอบความถูกต้องของไฟล์ (Validate & Preview)
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Import Result Banner */}
      {importResult && (
        <Card className="border-emerald-200 bg-emerald-50/50 p-6 text-center space-y-3">
          <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-emerald-900">{importResult.message}</h3>
          <div className="flex items-center justify-center gap-4 text-xs font-semibold text-emerald-800">
            <span>สร้างใหม่: {importResult.stats.createdCount} คน</span>
            <span>•</span>
            <span>อัปเดต: {importResult.stats.updatedCount} คน</span>
            <span>•</span>
            <span>ข้าม: {importResult.stats.skippedCount} คน</span>
          </div>
          <div className="pt-2">
            <Link href="/admin/employees">
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                ไปที่หน้ารายชื่อพนักงาน
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Preview Section */}
      {previewData && (
        <div className="space-y-4">
          {/* Summary Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="p-3 text-center border-slate-200/80">
              <span className="text-[11px] text-slate-500 block">รายการทั้งหมดในไฟล์</span>
              <span className="text-xl font-bold text-slate-900">{previewData.totalRows} รายการ</span>
            </Card>

            <Card className="p-3 text-center border-emerald-200 bg-emerald-50/40">
              <span className="text-[11px] text-emerald-700 block">ข้อมูลถูกต้องพร้อมนำเข้า</span>
              <span className="text-xl font-bold text-emerald-800">{previewData.validCount} รายการ</span>
            </Card>

            <Card className="p-3 text-center border-rose-200 bg-rose-50/40">
              <span className="text-[11px] text-rose-700 block">มีข้อผิดพลาด (ไม่นำเข้า)</span>
              <span className="text-xl font-bold text-rose-800">{previewData.invalidCount} รายการ</span>
            </Card>

            <Card className="p-3 text-center border-amber-200 bg-amber-50/40">
              <span className="text-[11px] text-amber-700 block">รหัสซ้ำกับในระบบ</span>
              <span className="text-xl font-bold text-amber-800">{previewData.duplicateCount} รายการ</span>
            </Card>
          </div>

          {/* Confirm Button Bar */}
          <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
            <div>
              <span className="text-xs font-bold text-slate-800 block">
                ขั้นตอนที่ 2: ยืนยันการนำเข้าข้อมูล
              </span>
              <span className="text-[11px] text-slate-500">
                ระบบจะนำเข้าเฉพาะรายการที่ผ่านการตรวจสอบ ({previewData.validCount} รายการ)
              </span>
            </div>
            <Button
              onClick={handleConfirmImport}
              disabled={previewData.validCount === 0}
              isLoading={confirmLoading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10 px-6"
            >
              <FileCheck className="h-4 w-4 mr-1.5" />
              ยืนยันนำเข้าข้อมูลเข้าสู่ระบบ
            </Button>
          </div>

          {/* Preview Table */}
          <Card className="border-slate-200/80 overflow-hidden p-0">
            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-slate-100/95 backdrop-blur-xs z-10">
                  <tr className="border-b border-slate-200 text-slate-600 font-bold">
                    <th className="py-2.5 px-3">แถวที่</th>
                    <th className="py-2.5 px-3">รหัสพนักงาน</th>
                    <th className="py-2.5 px-3">ชื่อ - นามสกุล</th>
                    <th className="py-2.5 px-3">บริษัท</th>
                    <th className="py-2.5 px-3">แผนก</th>
                    <th className="py-2.5 px-3">ตำแหน่ง</th>
                    <th className="py-2.5 px-3">วันเริ่มงาน</th>
                    <th className="py-2.5 px-3 text-center">ผลการตรวจสอบ</th>
                    <th className="py-2.5 px-3">หมายเหตุ / ข้อผิดพลาด</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {previewData.rows.map((row: any, idx: number) => (
                    <tr
                      key={idx}
                      className={
                        !row.isValid
                          ? "bg-rose-50/40"
                          : row.isExistingInDb
                          ? "bg-amber-50/30"
                          : "hover:bg-slate-50/60"
                      }
                    >
                      <td className="py-2 px-3 text-slate-400 font-mono">{row.rowNumber}</td>
                      <td className="py-2 px-3 font-mono font-bold text-slate-900">
                        {row.employeeId}
                      </td>
                      <td className="py-2 px-3 font-medium text-slate-800">
                        {row.firstName} {row.lastName}
                      </td>
                      <td className="py-2 px-3 text-slate-600 font-semibold">{row.companyCode}</td>
                      <td className="py-2 px-3 text-slate-600">{row.departmentCode}</td>
                      <td className="py-2 px-3 text-slate-600">{row.position}</td>
                      <td className="py-2 px-3 text-slate-500 font-mono">{row.startDate}</td>
                      <td className="py-2 px-3 text-center">
                        {row.isValid ? (
                          <Badge variant="success" size="sm">
                            <CheckCircle2 className="h-3 w-3 mr-0.5" /> ผ่าน
                          </Badge>
                        ) : (
                          <Badge variant="danger" size="sm">
                            <XCircle className="h-3 w-3 mr-0.5" /> ไม่ผ่าน
                          </Badge>
                        )}
                      </td>
                      <td className="py-2 px-3 text-[11px]">
                        {row.errors.length > 0 ? (
                          <ul className="text-rose-600 space-y-0.5 list-disc list-inside">
                            {row.errors.map((e: string, i: number) => (
                              <li key={i}>{e}</li>
                            ))}
                          </ul>
                        ) : row.isExistingInDb ? (
                          <span className="text-amber-700 font-medium">
                            {onDuplicate === "skip" ? "⚠️ รหัสซ้ำ (จะถูกข้าม)" : "⚠️ รหัสซ้ำ (จะอัปเดต)"}
                          </span>
                        ) : (
                          <span className="text-emerald-700">พร้อมบันทึกใหม่</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
