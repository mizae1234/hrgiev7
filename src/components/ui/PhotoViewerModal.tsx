"use client";

import React from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

export interface PhotoViewerData {
  url: string;
  title: string;
  employeeName?: string;
  time?: string;
  distance?: number | null;
}

interface PhotoViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: PhotoViewerData | null;
}

export function PhotoViewerModal({
  isOpen,
  onClose,
  data,
}: PhotoViewerModalProps) {
  if (!data) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={data.title || "ภาพถ่ายลงเวลาจากกล้องสด"}
      maxWidth="md"
    >
      <div className="space-y-4">
        <div className="rounded-2xl overflow-hidden bg-black flex items-center justify-center border border-slate-200">
          <img
            src={data.url}
            alt="Enlarged attendance photo"
            className="max-h-[380px] w-full object-contain"
          />
        </div>

        {(data.employeeName || data.time || data.distance !== undefined) && (
          <div className="p-3.5 bg-slate-50 rounded-2xl space-y-1.5 text-xs border border-slate-100">
            {data.employeeName && (
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">พนักงาน:</span>
                <span className="font-bold text-slate-900">{data.employeeName}</span>
              </div>
            )}
            {data.time && (
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">เวลาที่บันทึก:</span>
                <span className="font-mono font-bold text-slate-900">{data.time} น.</span>
              </div>
            )}
            {data.distance !== null && data.distance !== undefined && (
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">ระยะห่างจากพิกัดเป้าหมาย:</span>
                <span className="font-bold text-teal-700">
                  {Math.round(data.distance)} เมตร
                </span>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-slate-100">
          <Button variant="outline" size="sm" onClick={onClose} className="font-semibold text-xs">
            ปิดหน้าต่าง
          </Button>
        </div>
      </div>
    </Modal>
  );
}
