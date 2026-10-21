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

    return NextResponse.json({
      employee: {
        id: employee.id,
        employeeId: employee.employeeId,
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        phone: employee.phone,
        position: employee.position,
        employmentStatus: employee.employmentStatus,
        startDate: formatBangkokDate(employee.employmentStartDate),
        company: employee.company,
        department: employee.department,
        defaultShift: employee.defaultShift,
        defaultLocation: employee.defaultLocation,
      },
    });
  } catch (error: any) {
    console.error("Employee profile error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการโหลดโปรไฟล์: " + (error?.message || "Unknown error") },
      { status: 500 }
    );
  }
}
