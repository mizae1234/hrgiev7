"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { formatBangkokDate, formatThaiDateTime, getStatusBadgeInfo } from "@/lib/attendance";

interface EmployeeHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: any;
}

export function EmployeeHistoryModal({
  isOpen,
  onClose,
  employee,
}: EmployeeHistoryModalProps) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && employee?.id) {
      setLoading(true);
      fetch(`/api/admin/employees/${employee.id}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.employee?.attendanceSummaries) {
            setHistory(data.employee.attendanceSummaries);
          } else {
            setHistory([]);
          }
        })
        .catch(() => setHistory([]))
        .finally(() => setLoading(false));
    }
  }, [isOpen, employee?.id]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`ประวัติการลงเวลา: ${employee?.firstName} ${employee?.lastName} (${employee?.employeeId})`}
      maxWidth="3xl"
    >
      <div className="space-y-4">
        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400">กำลังโหลดประวัติ...</div>
        ) : history.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            ยังไม่มีประวัติการลงเวลาสำหรับพนักงานท่านนี้
          </div>
        ) : (
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold bg-slate-50">
                  <th className="py-2.5 px-3">วันที่</th>
                  <th className="py-2.5 px-3">กะเวลา</th>
                  <th className="py-2.5 px-3">เวลาเข้า</th>
                  <th className="py-2.5 px-3">เวลาออก</th>
                  <th className="py-2.5 px-3">สาย (นาที)</th>
                  <th className="py-2.5 px-3 text-center">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.map((item, idx) => {
                  const statusInfo = getStatusBadgeInfo(item.attendanceStatus);
                  return (
                    <tr key={idx} className="hover:bg-slate-50/60">
                      <td className="py-2.5 px-3 font-medium text-slate-900">
                        {formatBangkokDate(new Date(item.date))}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">
                        {item.effectiveStartTime} - {item.effectiveEndTime}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">
                        {item.checkInTime ? formatThaiDateTime(new Date(item.checkInTime)) : "-"}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">
                        {item.checkOutTime ? formatThaiDateTime(new Date(item.checkOutTime)) : "-"}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 font-mono">
                        {item.lateMinutes ? `${item.lateMinutes} นาที` : "-"}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusInfo.className}`}
                        >
                          {statusInfo.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Modal>
  );
}
