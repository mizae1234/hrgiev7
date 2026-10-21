import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { DataService } from "@/lib/data-service";
import { formatBangkokDate } from "@/lib/attendance";

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user || !user.employeeId) {
    return NextResponse.json({ error: "กรุณาเข้าสู่ระบบด้วยบัญชีพนักงาน" }, { status: 401 });
  }

  try {
    const employee = await DataService.getEmployeeById(user.employeeId);
    if (!employee) {
      return NextResponse.json({ error: "ไม่พบข้อมูลพนักงาน" }, { status: 404 });
    }

    const assignments = await DataService.getAssignments({ employeeId: user.employeeId });
    const holidays = await DataService.getHolidays(user.companyId || undefined);

    return NextResponse.json({
      defaultShift: employee.defaultShift,
      defaultLocation: employee.defaultLocation,
      assignments: assignments.map((a) => ({
        id: a.id,
        date: formatBangkokDate(a.date),
        workLocation: a.workLocation,
        shiftTemplate: a.shiftTemplate,
        assignmentType: a.assignmentType,
        notes: a.notes,
      })),
      holidays: holidays.map((h) => ({
        id: h.id,
        date: formatBangkokDate(h.holidayDate),
        name: h.name,
        description: h.description,
      })),
    });
  } catch (error: any) {
    console.error("Employee schedule error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการโหลดตารางงาน: " + (error?.message || "Unknown error") },
      { status: 500 }
    );
  }
}
