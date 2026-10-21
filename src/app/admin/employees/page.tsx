"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  Plus,
  FileSpreadsheet,
  Edit2,
  UserX,
  History,
  Building,
  Briefcase,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { useAdminContext } from "@/components/admin/AdminLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { EmployeeFormModal, EmployeeFormData } from "@/components/admin/EmployeeFormModal";
import { EmployeeHistoryModal } from "@/components/admin/EmployeeHistoryModal";

export default function EmployeeManagementPage() {
  const { selectedCompanyId } = useAdminContext();

  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [deptFilter, setDeptFilter] = useState("ALL");

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<EmployeeFormData | null>(null);

  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);

  // Fetch reference metadata (companies, shifts, locations)
  useEffect(() => {
    Promise.all([
      fetch("/api/admin/companies").then((r) => r.json()),
      fetch("/api/admin/shifts").then((r) => r.json()),
      fetch("/api/admin/locations").then((r) => r.json()),
    ]).then(([compData, shiftData, locData]) => {
      if (compData.companies) setCompanies(compData.companies);
      if (shiftData.shifts) setShifts(shiftData.shifts);
      if (locData.locations) setLocations(locData.locations);
    });
  }, []);

  // Fetch departments dynamically for filter
  useEffect(() => {
    const url = selectedCompanyId && selectedCompanyId !== "ALL"
      ? `/api/admin/departments?companyId=${selectedCompanyId}`
      : "/api/admin/departments";
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (data.departments) setDepartments(data.departments);
      })
      .catch((err) => console.error(err));
  }, [selectedCompanyId]);

  // Fetch employees list
  const fetchEmployees = async () => {
    setLoading(true);
    try {
      let url = `/api/admin/employees?companyId=${selectedCompanyId}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (statusFilter !== "ALL") url += `&status=${statusFilter}`;
      if (deptFilter !== "ALL") url += `&departmentId=${deptFilter}`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.employees) {
        setEmployees(data.employees);
      }
    } catch (err) {
      console.error("Error fetching employees:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [selectedCompanyId, statusFilter, deptFilter]);

  // Open Add Modal
  const handleOpenAdd = () => {
    setIsEditing(false);
    setEditFormData(null);
    setIsFormModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (emp: any) => {
    setIsEditing(true);
    setSelectedEmployee(emp);
    setEditFormData({
      id: emp.id,
      employeeId: emp.employeeId,
      firstName: emp.firstName,
      lastName: emp.lastName,
      companyId: emp.companyId,
      departmentId: emp.departmentId,
      position: emp.position,
      email: emp.email || "",
      phone: emp.phone || "",
      employmentStartDate: emp.employmentStartDate
        ? new Date(emp.employmentStartDate).toISOString().split("T")[0]
        : "",
      resignationDate: emp.resignationDate
        ? new Date(emp.resignationDate).toISOString().split("T")[0]
        : "",
      employmentStatus: emp.employmentStatus,
      defaultShiftId: emp.defaultShiftId || "",
      defaultLocationId: emp.defaultLocationId || "",
    });
    setIsFormModalOpen(true);
  };

  // Open History Modal
  const handleOpenHistory = (emp: any) => {
    setSelectedEmployee(emp);
    setIsHistoryModalOpen(true);
  };

  // Deactivate
  const handleDeactivate = async (id: string) => {
    if (!confirm("คุณต้องการปรับสถานะพนักงานเป็น 'ลาออก (RESIGNED)' ใช่หรือไม่?")) return;
    try {
      const res = await fetch(`/api/admin/employees/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchEmployees();
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
            จัดการข้อมูลพนักงาน (Employee Directory)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            ทะเบียนประวัติพนักงาน กำหนดกะเริ่มต้น สถานที่ปฏิบัติงานหลัก และตรวจสอบประวัติเข้างาน
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/admin/employees/import">
            <Button variant="outline" size="sm" className="font-semibold text-xs h-9">
              <FileSpreadsheet className="h-3.5 w-3.5 mr-1" />
              นำเข้าไฟล์ Excel
            </Button>
          </Link>
          <Button size="sm" onClick={handleOpenAdd} className="font-semibold text-xs h-9 bg-teal-600 hover:bg-teal-700">
            <Plus className="h-3.5 w-3.5 mr-1" />
            เพิ่มพนักงานใหม่
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card className="p-4 border-slate-200/80">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="sm:col-span-2">
            <Input
              placeholder="ค้นหาด้วยรหัส, ชื่อ-นามสกุล, หรือตำแหน่ง..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchEmployees()}
              leftIcon={<Search className="h-4 w-4" />}
            />
          </div>

          <div>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-teal-500 focus:outline-none"
            >
              <option value="ALL">แผนกทั้งหมด</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name.split("(")[0]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-teal-500 focus:outline-none"
            >
              <option value="ALL">สถานะทั้งหมด</option>
              <option value="ACTIVE">ปฏิบัติงาน (ACTIVE)</option>
              <option value="INACTIVE">พักงาน (INACTIVE)</option>
              <option value="RESIGNED">ลาออกแล้ว (RESIGNED)</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Employees Table */}
      <Card className="border-slate-200/80 overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-bold whitespace-nowrap">
                <th className="py-3 px-4">รหัสพนักงาน</th>
                <th className="py-3 px-4">ชื่อ - นามสกุล</th>
                <th className="py-3 px-4">บริษัท & แผนก</th>
                <th className="py-3 px-4">ตำแหน่งงาน</th>
                <th className="py-3 px-4">กะเริ่มต้น</th>
                <th className="py-3 px-4">สถานที่หลัก</th>
                <th className="py-3 px-4 text-center">สถานะ</th>
                <th className="py-3 px-4 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    กำลังโหลดข้อมูลพนักงาน...
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    ไม่พบข้อมูลพนักงานตามเงื่อนไขที่เลือก
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-teal-700 whitespace-nowrap">
                      {emp.employeeId}
                    </td>
                    <td className="py-3 px-4 min-w-[180px]">
                      <div className="font-semibold text-slate-900 whitespace-nowrap">
                        {emp.firstName} {emp.lastName}
                      </div>
                      <div className="text-[11px] text-slate-400">{emp.email || emp.phone || "-"}</div>
                    </td>
                    <td className="py-3 px-4 min-w-[170px]">
                      <span className="font-semibold text-slate-800 block">
                        {emp.company?.code || "-"}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {emp.department?.name?.split("(")[0] || "-"}
                      </span>
                    </td>
                    <td className="py-3 px-4 min-w-[200px] text-slate-700 font-medium">{emp.position}</td>
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                      {emp.defaultShift ? (
                        <span className="inline-flex items-center gap-1 font-mono text-[11px]">
                          <Clock className="h-3 w-3 text-slate-400" />
                          {emp.defaultShift.startTime} - {emp.defaultShift.endTime}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {emp.defaultLocation ? (
                        <span
                          className="flex items-center gap-1 text-[11px] max-w-[180px] min-w-0"
                          title={emp.defaultLocation.locationName}
                        >
                          <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                          <span className="truncate">{emp.defaultLocation.locationName}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <Badge
                        variant={
                          emp.employmentStatus === "ACTIVE"
                            ? "success"
                            : emp.employmentStatus === "RESIGNED"
                            ? "danger"
                            : "default"
                        }
                        size="sm"
                      >
                        {emp.employmentStatus === "ACTIVE"
                          ? "ปฏิบัติงาน"
                          : emp.employmentStatus === "RESIGNED"
                          ? "ลาออกแล้ว"
                          : emp.employmentStatus}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenHistory(emp)}
                          title="ดูประวัติการลงเวลา"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors cursor-pointer"
                        >
                          <History className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(emp)}
                          title="แก้ไขข้อมูล"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors cursor-pointer"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        {emp.employmentStatus === "ACTIVE" && (
                          <button
                            onClick={() => handleDeactivate(emp.id)}
                            title="ปรับสถานะเป็นลาออก"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          >
                            <UserX className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add / Edit Employee Form Modal */}
      <EmployeeFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        isEditing={isEditing}
        initialData={editFormData}
        companies={companies}
        shifts={shifts}
        locations={locations}
        onSuccess={fetchEmployees}
      />

      {/* History Viewer Modal */}
      <EmployeeHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        employee={selectedEmployee}
      />
    </div>
  );
}
