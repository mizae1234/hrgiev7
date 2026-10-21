import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { DataService } from "@/lib/data-service";
import { parseDateString, formatBangkokDate, formatBangkokTime, formatThaiDateTime, getStatusBadgeInfo } from "@/lib/attendance";
import { generateExcelReport } from "@/lib/excel";
import { Role } from "@prisma/client";

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user || user.role === Role.EMPLOYEE) {
    return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const reportType = searchParams.get("type") || "daily";
  const requestedCompanyId = searchParams.get("companyId");
  const dateParam = searchParams.get("date");
  const startDateParam = searchParams.get("startDate");
  const endDateParam = searchParams.get("endDate");
  const departmentId = searchParams.get("departmentId") || undefined;

  let targetCompanyId: string | undefined = undefined;
  if (user.role === Role.HR_ADMIN) {
    targetCompanyId = user.companyId || undefined;
  } else if (requestedCompanyId && requestedCompanyId !== "ALL") {
    targetCompanyId = requestedCompanyId;
  }

  const targetDate = dateParam ? parseDateString(dateParam) : parseDateString(formatBangkokDate(new Date()));

  // Fetch daily attendance
  let attendances: any[] = await DataService.getDailyAttendance({
    companyId: targetCompanyId,
    date: targetDate,
    departmentId,
  });

  // Filter based on reportType
  if (reportType === "late") {
    attendances = attendances.filter((a) => a.isLate);
  } else if (reportType === "absent") {
    attendances = attendances.filter((a) => a.attendanceStatus === "ABSENT");
  } else if (reportType === "missing_checkout") {
    attendances = attendances.filter((a) => a.attendanceStatus === "MISSING_CHECKOUT" || (a.checkInTime && !a.checkOutTime));
  } else if (reportType === "booth") {
    attendances = attendances.filter((a) => a.scheduledLocation?.locationType === "BOOTH");
  }

  // Format into tabular rows
  const excelData = attendances.map((item, index) => {
    const statusInfo = getStatusBadgeInfo(item.attendanceStatus);
    return {
      "ลำดับ": index + 1,
      "วันที่": formatBangkokDate(item.date),
      "รหัสพนักงาน": item.employee.employeeId,
      "ชื่อ - นามสกุล": `${item.employee.firstName} ${item.employee.lastName}`,
      "บริษัท": item.employee.company?.code || "-",
      "แผนก": item.employee.department?.name || "-",
      "ตำแหน่ง": item.employee.position || "-",
      "สถานที่ปฏิบัติงาน": item.scheduledLocation?.locationName || "-",
      "ประเภทสถานที่": item.scheduledLocation?.locationType === "BOOTH" ? "บูธ (BOOTH)" : "สำนักงาน (OFFICE)",
      "กะเวลา": `${item.effectiveStartTime} - ${item.effectiveEndTime}`,
      "เวลาเข้างาน": item.checkInTime ? formatBangkokTime(item.checkInTime) : "-",
      "เวลาออกงาน": item.checkOutTime ? formatBangkokTime(item.checkOutTime) : "-",
      "ระยะห่าง GPS เข้างาน (ม.)": item.checkInDistanceMeters !== null && item.checkInDistanceMeters !== undefined ? Math.round(item.checkInDistanceMeters) : "-",
      "ระยะห่าง GPS ออกงาน (ม.)": item.checkOutDistanceMeters !== null && item.checkOutDistanceMeters !== undefined ? Math.round(item.checkOutDistanceMeters) : "-",
      "สาย (นาที)": item.lateMinutes || 0,
      "กลับก่อน (นาที)": item.earlyLeaveMinutes || 0,
      "ชั่วโมงงานรวม (นาที)": item.totalWorkMinutes || 0,
      "สถานะการลงเวลา": statusInfo.label,
      "มีการแก้ไขโดย HR": item.isCorrected ? "ใช่" : "ไม่ใช่",
      "เหตุผลการแก้ไข": item.correctionReason || "-",
    };
  });

  const columnWidths = [
    { wch: 8 },
    { wch: 14 },
    { wch: 15 },
    { wch: 25 },
    { wch: 10 },
    { wch: 25 },
    { wch: 25 },
    { wch: 30 },
    { wch: 18 },
    { wch: 15 },
    { wch: 14 },
    { wch: 14 },
    { wch: 22 },
    { wch: 22 },
    { wch: 12 },
    { wch: 14 },
    { wch: 18 },
    { wch: 20 },
    { wch: 16 },
    { wch: 30 },
  ];

  const sheetNameMap: Record<string, string> = {
    daily: "รายงานลงเวลาประจำวัน",
    late: "รายงานพนักงานมาสาย",
    absent: "รายงานขาดงาน",
    missing_checkout: "รายงานลืมลงเวลาออก",
    booth: "รายงานลงเวลาประจำบูธ",
    monthly: "รายงานประจำเดือน",
  };

  const sheetName = sheetNameMap[reportType] || "Attendance_Report";
  const buffer = generateExcelReport(sheetName, excelData.length > 0 ? excelData : [{ "ผลการค้นหา": "ไม่พบข้อมูลสำหรับเงื่อนไขที่เลือก" }], columnWidths);

  return new NextResponse(buffer as any, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${sheetName}_${formatBangkokDate(targetDate)}.xlsx"`,
    },
  });
}
