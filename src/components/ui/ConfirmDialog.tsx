"use client";

import React, { useEffect } from "react";
import { AlertTriangle, Trash2, Info } from "lucide-react";
import { Button } from "@/components/ui/Button";

type Tone = "danger" | "warning" | "info";

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message?: React.ReactNode;
  /** Optional summary block (e.g. the record being affected) */
  children?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: Tone;
  isLoading?: boolean;
}

const toneStyles: Record<Tone, { ring: string; icon: string; Icon: React.ElementType; button: string }> = {
  danger: {
    ring: "bg-rose-50 ring-rose-100",
    icon: "text-rose-600",
    Icon: Trash2,
    button: "bg-rose-600 hover:bg-rose-700 text-white",
  },
  warning: {
    ring: "bg-amber-50 ring-amber-100",
    icon: "text-amber-600",
    Icon: AlertTriangle,
    button: "bg-amber-600 hover:bg-amber-700 text-white",
  },
  info: {
    ring: "bg-teal-50 ring-teal-100",
    icon: "text-teal-600",
    Icon: Info,
    button: "bg-teal-600 hover:bg-teal-700 text-white",
  },
};

/**
 * Styled replacement for window.confirm().
 * Centered icon + title + message, optional detail card, and Cancel / Confirm actions.
 */
export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  children,
  confirmLabel = "ยืนยัน",
  cancelLabel = "ยกเลิก",
  tone = "danger",
  isLoading = false,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoading) onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const { ring, icon, Icon, button } = toneStyles[tone];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
        onClick={() => !isLoading && onClose()}
      />

      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="relative z-10 w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
      >
        <div className="flex flex-col items-center text-center">
          <div className={`flex h-14 w-14 items-center justify-center rounded-full ring-8 ${ring}`}>
            <Icon className={`h-6 w-6 ${icon}`} />
          </div>

          <h2 id="confirm-dialog-title" className="mt-5 text-base font-bold text-slate-900">
            {title}
          </h2>
          {message && <p className="mt-1.5 text-sm text-slate-500 leading-relaxed">{message}</p>}
        </div>

        {children && <div className="mt-4">{children}</div>}

        <div className="mt-6 grid grid-cols-2 gap-2">
          <Button variant="outline" type="button" onClick={onClose} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            isLoading={isLoading}
            className={`font-bold ${button}`}
            autoFocus
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
