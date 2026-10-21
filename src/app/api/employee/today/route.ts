import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { DataService } from "@/lib/data-service";
import { getBangkokToday, formatBangkokDate } from "@/lib/attendance";

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user || !user.employeeId) {
    return NextResponse.json({ error: "กรุณาเข้าสู่ระบบด้วยบัญชีพนักงาน" }, { status: 401 });
  }

  try {
    const today = getBangkokToday();
    const effectiveSchedule = await DataService.getEffectiveSchedule(user.employeeId, today);

    // Get today's attendance summary if exists
    const dailyAttendances = await DataService.getDailyAttendance({
      companyId: user.companyId || undefined,
      date: today,
    });

    const todayAttendance = dailyAttendances.find(
      (a) => a.employeeId === user.employeeId
    );

    return NextResponse.json({
      todayDate: formatBangkokDate(today),
      employee: {
        id: effectiveSchedule.employee.id,
        employeeId: effectiveSchedule.employee.employeeId,
        firstName: effectiveSchedule.employee.firstName,
        lastName: effectiveSchedule.employee.lastName,
        position: effectiveSchedule.employee.position,
        company: user.companyName,
      },
      effectiveLocation: {
        id: effectiveSchedule.effectiveLocation.id,
        locationCode: effectiveSchedule.effectiveLocation.locationCode,
        locationName: effectiveSchedule.effectiveLocation.locationName,
        locationType: effectiveSchedule.effectiveLocation.locationType,
        address: effectiveSchedule.effectiveLocation.address,
        latitude: effectiveSchedule.effectiveLocation.latitude,
        longitude: effectiveSchedule.effectiveLocation.longitude,
        allowedRadiusMeters: effectiveSchedule.effectiveLocation.allowedRadiusMeters,
      },
      effectiveShift: {
        id: effectiveSchedule.effectiveShift.id,
        shiftCode: effectiveSchedule.effectiveShift.shiftCode,
        shiftName: effectiveSchedule.effectiveShift.shiftName,
        startTime: effectiveSchedule.effectiveShift.startTime,
        endTime: effectiveSchedule.effectiveShift.endTime,
        gracePeriodMinutes: effectiveSchedule.effectiveShift.gracePeriodMinutes,
      },
      isBooth: effectiveSchedule.isBooth,
      assignmentNotes: effectiveSchedule.assignment?.notes || null,
      attendance: todayAttendance || null,
      hasCheckedIn: Boolean(todayAttendance?.checkInTime),
      hasCheckedOut: Boolean(todayAttendance?.checkOutTime),
    });
  } catch (error: any) {
    console.error("Employee today API error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการโหลดข้อมูลตารางงาน: " + (error?.message || "Unknown error") },
      { status: 500 }
    );
  }
}
