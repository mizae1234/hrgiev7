import { AttendanceStatus } from "@prisma/client";

export const TIMEZONE = "Asia/Bangkok";

/**
 * Returns today's date formatted as YYYY-MM-DD in Bangkok timezone
 */
export function getTodayDateString(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: TIMEZONE });
}

/**
 * Returns a Date object representing midnight of today in Bangkok time (UTC Date instance)
 */
export function getBangkokToday(): Date {
  const bangkokDateStr = getTodayDateString();
  const [year, month, day] = bangkokDateStr.split("-").map(Number);
  // UTC date at 00:00:00 for the Bangkok date
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
}

/**
 * Parses a YYYY-MM-DD string into a UTC midnight Date
 */
export function parseDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
}

/**
 * Format a Date object to YYYY-MM-DD in Bangkok timezone
 */
export function formatBangkokDate(date: Date): string {
  return date.toLocaleDateString("en-CA", { timeZone: TIMEZONE });
}

/**
 * Format a Date to HH:mm in Bangkok timezone
 */
export function formatBangkokTime(date: Date | null | undefined): string {
  if (!date) return "-";
  return date.toLocaleTimeString("th-TH", {
    timeZone: TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/**
 * Format a Date to Thai readable string e.g. "14 ต.ค. 2569 08:45 น."
 */
export function formatThaiDateTime(date: Date | null | undefined): string {
  if (!date) return "-";
  return (
    date.toLocaleDateString("th-TH", {
      timeZone: TIMEZONE,
      year: "numeric",
      month: "short",
      day: "numeric",
    }) +
    " " +
    formatBangkokTime(date) +
    " น."
  );
}

/**
 * Format Date to Thai readable Date e.g. "วันพุธที่ 14 ตุลาคม 2569"
 */
export function formatThaiFullDate(date: Date): string {
  return date.toLocaleDateString("th-TH", {
    timeZone: TIMEZONE,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Format Date to short Thai date e.g. "14 ต.ค. 2569"
 */
export function formatThaiDate(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("th-TH", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}


/**
 * Creates a UTC Date representing a specific HH:mm on a Bangkok day.
 * Bangkok is UTC+7.
 */
export function getBangkokDateTime(dateMidnight: Date, timeStr: string): Date {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const dateStr = formatBangkokDate(dateMidnight);
  const [year, month, day] = dateStr.split("-").map(Number);

  // Bangkok is UTC+7, so UTC hour = hours - 7
  return new Date(Date.UTC(year, month - 1, day, hours - 7, minutes, 0, 0));
}

export interface ShiftEvaluationResult {
  isLate: boolean;
  lateMinutes: number;
  isEarlyLeave: boolean;
  earlyLeaveMinutes: number;
  totalWorkMinutes: number;
  calculatedStatus: AttendanceStatus;
}

/**
 * Evaluates attendance status and lateness / early departure
 */
export function evaluateAttendance({
  checkInTime,
  checkOutTime,
  shiftStartTime,
  shiftEndTime,
  gracePeriodMinutes = 15,
  dateMidnight,
  isRestDay = false,
  isOnLeave = false,
}: {
  checkInTime?: Date | null;
  checkOutTime?: Date | null;
  shiftStartTime: string; // "09:00"
  shiftEndTime: string;   // "18:00"
  gracePeriodMinutes?: number;
  dateMidnight: Date;
  isRestDay?: boolean;
  isOnLeave?: boolean;
}): ShiftEvaluationResult {
  if (isRestDay) {
    return {
      isLate: false,
      lateMinutes: 0,
      isEarlyLeave: false,
      earlyLeaveMinutes: 0,
      totalWorkMinutes: 0,
      calculatedStatus: AttendanceStatus.DAY_OFF,
    };
  }

  if (isOnLeave) {
    return {
      isLate: false,
      lateMinutes: 0,
      isEarlyLeave: false,
      earlyLeaveMinutes: 0,
      totalWorkMinutes: 0,
      calculatedStatus: AttendanceStatus.ON_LEAVE,
    };
  }

  if (!checkInTime) {
    return {
      isLate: false,
      lateMinutes: 0,
      isEarlyLeave: false,
      earlyLeaveMinutes: 0,
      totalWorkMinutes: 0,
      calculatedStatus: AttendanceStatus.ABSENT,
    };
  }

  const scheduledStart = getBangkokDateTime(dateMidnight, shiftStartTime);
  const scheduledEnd = getBangkokDateTime(dateMidnight, shiftEndTime);
  const graceCutoff = new Date(scheduledStart.getTime() + gracePeriodMinutes * 60 * 1000);

  let isLate = false;
  let lateMinutes = 0;

  if (checkInTime.getTime() > graceCutoff.getTime()) {
    isLate = true;
    lateMinutes = Math.max(0, Math.floor((checkInTime.getTime() - scheduledStart.getTime()) / (60 * 1000)));
  }

  let isEarlyLeave = false;
  let earlyLeaveMinutes = 0;
  let totalWorkMinutes = 0;

  if (checkOutTime) {
    totalWorkMinutes = Math.max(0, Math.floor((checkOutTime.getTime() - checkInTime.getTime()) / (60 * 1000)));

    if (checkOutTime.getTime() < scheduledEnd.getTime()) {
      isEarlyLeave = true;
      earlyLeaveMinutes = Math.max(0, Math.floor((scheduledEnd.getTime() - checkOutTime.getTime()) / (60 * 1000)));
    }
  }

  let calculatedStatus: AttendanceStatus = AttendanceStatus.PRESENT;

  if (isLate) {
    calculatedStatus = AttendanceStatus.LATE;
  } else if (!checkOutTime) {
    // If checkIn exists, but shift has ended > 3 hours ago and still no checkout
    const now = new Date();
    const missingCutoff = new Date(scheduledEnd.getTime() + 3 * 60 * 60 * 1000);
    if (now.getTime() > missingCutoff.getTime()) {
      calculatedStatus = AttendanceStatus.MISSING_CHECKOUT;
    } else {
      calculatedStatus = AttendanceStatus.PRESENT;
    }
  } else if (isEarlyLeave) {
    calculatedStatus = AttendanceStatus.EARLY_LEAVE;
  }

  return {
    isLate,
    lateMinutes,
    isEarlyLeave,
    earlyLeaveMinutes,
    totalWorkMinutes,
    calculatedStatus,
  };
}

/**
 * Returns Thai human label and badge color classes for attendance status
 */
export function getStatusBadgeInfo(status: AttendanceStatus | string): {
  label: string;
  className: string;
} {
  switch (status) {
    case AttendanceStatus.PRESENT:
      return { label: "ตรงเวลา (ปกติ)", className: "bg-emerald-100 text-emerald-800 border-emerald-200" };
    case AttendanceStatus.LATE:
      return { label: "มาสาย", className: "bg-amber-100 text-amber-800 border-amber-200" };
    case AttendanceStatus.EARLY_LEAVE:
      return { label: "กลับก่อนเวลา", className: "bg-orange-100 text-orange-800 border-orange-200" };
    case AttendanceStatus.ABSENT:
      return { label: "ขาดงาน", className: "bg-rose-100 text-rose-800 border-rose-200" };
    case AttendanceStatus.MISSING_CHECKOUT:
      return { label: "ลืมลงเวลาออก", className: "bg-purple-100 text-purple-800 border-purple-200" };
    case AttendanceStatus.DAY_OFF:
      return { label: "วันหยุดประจำสัปดาห์", className: "bg-slate-100 text-slate-700 border-slate-200" };
    case AttendanceStatus.ON_LEAVE:
      return { label: "ลางาน (อนุมัติ)", className: "bg-blue-100 text-blue-800 border-blue-200" };
    default:
      return { label: status, className: "bg-gray-100 text-gray-700 border-gray-200" };
  }
}
