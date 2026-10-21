"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAdminContext } from "@/components/admin/AdminLayout";
import {
  CalendarDays,
  Download,
  Upload,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  X,
  Search,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatThaiDate } from "@/lib/attendance";

interface Holiday {
  id: string;
  holidayDate: string;
  name: string;
  description?: string | null;
  companyId?: string | null;
  company?: {
    id: string;
    code: string;
    name: string;
  } | null;
}

export default function HolidaysPage() {
  const { selectedCompanyId } = useAdminContext();
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState("2026");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Add form state
  const [newDate, setNewDate] = useState("");
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Import state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importValidating, setImportValidating] = useState(false);
  const [importConfirming, setImportConfirming] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const fetchHolidays = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCompanyId) params.append("companyId", selectedCompanyId);
      if (selectedYear) params.append("year", selectedYear);

      const res = await fetch(`/api/admin/holidays?${params.toString()}`);
      const data = await res.json();
      if (data.holidays) {
        setHolidays(data.holidays);
      }
    } catch (err) {
      console.error("Error fetching holidays:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, [selectedCompanyId, selectedYear]);

  // Handle Add Holiday
  const handleAddHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDate || !newName) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/holidays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          holidayDate: newDate,
          name: newName,
          description: newDesc,
          companyId: selectedCompanyId === "ALL" ? null : selectedCompanyId,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "เกิดข้อผิดพลาดในการบันทึก");
      }

      setIsAddModalOpen(false);
      setNewDate("");
      setNewName("");
      setNewDesc("");
      fetchHolidays();
    } catch (err: any) {
      alert(err.message || "เกิดข้อผิดพลาด");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete Holiday
  const handleDeleteHoliday = async (id: string, name: string) => {
    if (!confirm(`คุณต้องการลบวันหยุด "${name}" ใช่หรือไม่?`)) return;

    try {
      const res = await fetch(`/api/admin/holidays?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchHolidays();
      }
    } catch (err) {
      alert("เกิดข้อผิดพลาดในการลบ");
    }
  };

  // Handle File Selection for Import
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    setImportError(null);
    setValidationResult(null);
    setImportValidating(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("action", "validate");

    try {
      const res = await fetch("/api/admin/holidays/import", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "ไม่สามารถตรวจสอบไฟล์ได้");
      }
      setValidationResult(data);
    } catch (err: any) {
      setImportError(err.message);
    } finally {
      setImportValidating(false);
    }
  };

  // Confirm Import
  const handleConfirmImport = async () => {
    if (!importFile) return;

    setImportConfirming(true);
    setImportError(null);

    const formData = new FormData();
    formData.append("file", importFile);
    formData.append("action", "confirm");

    try {
      const res = await fetch("/api/admin/holidays/import", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "เกิดข้อผิดพลาดในการนำเข้า");
      }

      alert(data.message || "นำเข้าวันหยุดสำเร็จ");
      setIsImportModalOpen(false);
      setImportFile(null);
      setValidationResult(null);
      fetchHolidays();
    } catch (err: any) {
      setImportError(err.message);
    } finally {
      setImportConfirming(false);
    }
  };

  // Filtered Holidays
  const filteredHolidays = holidays.filter((h) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      h.name.toLowerCase().includes(q) ||
      (h.description && h.description.toLowerCase().includes(q)) ||
      h.holidayDate.includes(q)
    );
  });

  // Calculate quick stats
  const now = new Date();
  const pastCount = holidays.filter((h) => new Date(h.holidayDate) < now).length;
  const upcomingHolidays = holidays.filter((h) => new Date(h.holidayDate) >= now);
  const nextHoliday = upcomingHolidays[0];

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarDays className="h-6 w-6 text-teal-600" />
            ปฏิทินวันหยุดราชการ & นักขัตฤกษ์
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            กำหนดวันหยุดประจำปีสำหรับคำนวณวันทำงาน ขาดงาน และตารางเวลางานของพนักงาน
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <a href="/api/admin/holidays/export-template" download="Holiday_Template.xlsx">
            <Button variant="outline" size="sm" className="gap-1.5 bg-white text-xs">
              <Download className="h-3.5 w-3.5 text-slate-600" />
              ดาวน์โหลด Template Excel
            </Button>
          </a>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsImportModalOpen(true)}
            className="gap-1.5 bg-white text-xs hover:border-teal-400 hover:text-teal-700"
          >
            <Upload className="h-3.5 w-3.5 text-teal-600" />
            นำเข้าไฟล์ Excel
          </Button>

          <Button
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            className="gap-1.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs"
          >
            <Plus className="h-4 w-4" />
            เพิ่มวันหยุด
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500">วันหยุดทั้งหมดในปี {selectedYear}</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{holidays.length}</span>
            <span className="text-xs text-slate-500">วัน</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500">วันหยุดถัดไป (Upcoming)</div>
          <div className="mt-1">
            {nextHoliday ? (
              <div>
                <div className="text-sm font-bold text-teal-700 truncate">{nextHoliday.name}</div>
                <div className="text-xs text-slate-500">{formatThaiDate(nextHoliday.holidayDate)}</div>
              </div>
            ) : (
              <span className="text-xs text-slate-400">ไม่มีวันหยุดที่กำลังจะถึงในปีนี้</span>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500">ผ่านไปแล้ว / คงเหลือในปีนี้</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-sm font-bold text-slate-700">{pastCount} วัน</span>
            <span className="text-xs text-slate-400">/ เหลือ {holidays.length - pastCount} วัน</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="ค้นหาชื่อวันหยุด หรือวันที่..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-teal-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-xs text-slate-500 font-medium">เลือกปี:</span>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-teal-500 cursor-pointer"
          >
            <option value="2026">2026 (พ.ศ. 2569)</option>
            <option value="2025">2025 (พ.ศ. 2568)</option>
            <option value="2027">2027 (พ.ศ. 2570)</option>
          </select>
        </div>
      </div>

      {/* Holiday Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">วันที่</th>
                <th className="px-5 py-3.5">ชื่อวันหยุดราชการ / ประเพณี</th>
                <th className="px-5 py-3.5">รายละเอียด</th>
                <th className="px-5 py-3.5">ขอบเขต (บริษัท)</th>
                <th className="px-5 py-3.5 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-slate-400">
                    กำลังโหลดข้อมูลวันหยุด...
                  </td>
                </tr>
              ) : filteredHolidays.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-slate-400">
                    ไม่พบข้อมูลวันหยุดตามเงื่อนไขที่เลือก
                  </td>
                </tr>
              ) : (
                filteredHolidays.map((h) => {
                  const dateObj = new Date(h.holidayDate);
                  const isPast = dateObj < now;

                  return (
                    <tr
                      key={h.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isPast ? "opacity-60 bg-slate-50/30" : ""
                      }`}
                    >
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="font-bold text-slate-900">
                          {formatThaiDate(h.holidayDate)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {h.holidayDate.split("T")[0]}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-slate-800">
                        {h.name}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500">
                        {h.description || "—"}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        {h.company ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            🏢 {h.company.code}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            🌟 ทุกบริษัท
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleDeleteHoliday(h.id, h.name)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="ลบวันหยุดนี้"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Holiday Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Plus className="h-4 w-4 text-teal-600" />
                เพิ่มวันหยุดใหม่
              </h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddHoliday} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  วันที่วันหยุด (Date) *
                </label>
                <input
                  type="date"
                  required
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ชื่อวันหยุด (Holiday Name) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น วันขึ้นปีใหม่, วันสงกรานต์..."
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  รายละเอียดเพิ่มเติม (Description)
                </label>
                <input
                  type="text"
                  placeholder="เช่น วันหยุดตามประเพณี..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  ยกเลิก
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={submitting}
                  className="bg-teal-600 hover:bg-teal-700 text-white font-semibold"
                >
                  {submitting ? "กำลังบันทึก..." : "บันทึกวันหยุด"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Holidays Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-teal-600" />
                นำเข้าข้อมูลวันหยุดผ่านไฟล์ Excel (.xlsx)
              </h2>
              <button
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportFile(null);
                  setValidationResult(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {/* File upload box */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:border-teal-500 hover:bg-teal-50/30 transition-all cursor-pointer"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <FileSpreadsheet className="h-8 w-8 text-teal-600 mx-auto mb-2" />
                <div className="text-xs font-bold text-slate-700">
                  {importFile ? importFile.name : "คลิกเพื่อเลือกไฟล์ Excel (.xlsx)"}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  รองรับไฟล์ .xlsx ตาม Template มาตรฐาน
                </div>
              </div>

              {/* Status & Validation Preview */}
              {importValidating && (
                <div className="p-3 rounded-xl bg-slate-50 text-center text-xs text-slate-500">
                  กำลังตรวจสอบความถูกต้องของข้อมูลในไฟล์...
                </div>
              )}

              {importError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{importError}</span>
                </div>
              )}

              {validationResult && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span className="text-xs font-bold text-slate-800">
                        พร้อมนำเข้า: {validationResult.validRowsCount} แถว
                      </span>
                    </div>
                    {validationResult.invalidRowsCount > 0 && (
                      <span className="text-xs font-bold text-rose-600">
                        พบข้อผิดพลาด: {validationResult.invalidRowsCount} แถว
                      </span>
                    )}
                  </div>

                  {/* Preview table */}
                  <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-100 sticky top-0 font-bold text-slate-600">
                        <tr>
                          <th className="p-2">แถว</th>
                          <th className="p-2">วันที่</th>
                          <th className="p-2">ชื่อวันหยุด</th>
                          <th className="p-2">บริษัท</th>
                          <th className="p-2">สถานะ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {validationResult.rows.map((r: any) => (
                          <tr key={r.rowNumber} className={r.isValid ? "bg-white" : "bg-rose-50/50"}>
                            <td className="p-2 font-mono text-slate-400">#{r.rowNumber}</td>
                            <td className="p-2 font-semibold text-slate-800">{r.holidayDate}</td>
                            <td className="p-2">{r.name}</td>
                            <td className="p-2 font-mono">{r.companyCode || "ทุกบริษัท"}</td>
                            <td className="p-2">
                              {r.isValid ? (
                                <span className="text-emerald-600 font-semibold">✓ ถูกต้อง</span>
                              ) : (
                                <span className="text-rose-600 font-semibold">{r.errors.join(", ")}</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Modal footer */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <a
                  href="/api/admin/holidays/export-template"
                  download="Holiday_Template.xlsx"
                  className="text-xs text-teal-600 hover:underline flex items-center gap-1 font-semibold"
                >
                  <Download className="h-3 w-3" />
                  โหลด Template สำหรับกรอก
                </a>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsImportModalOpen(false);
                      setImportFile(null);
                      setValidationResult(null);
                    }}
                  >
                    ปิด
                  </Button>

                  {validationResult && validationResult.validRowsCount > 0 && (
                    <Button
                      type="button"
                      size="sm"
                      disabled={importConfirming || validationResult.invalidRowsCount > 0}
                      onClick={handleConfirmImport}
                      className="bg-teal-600 hover:bg-teal-700 text-white font-semibold"
                    >
                      {importConfirming
                        ? "กำลังนำเข้า..."
                        : `ยืนยันการนำเข้า (${validationResult.validRowsCount} รายการ)`}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
