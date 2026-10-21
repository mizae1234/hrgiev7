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
    const history = await DataService.getEmployeeAttendanceHistory(user.employeeId, 60);

    return NextResponse.json({
      history: history.map((h) => ({
        ...h,
        formattedDate: formatBangkokDate(h.date),
      })),
    });
  } catch (error: any) {
    console.error("Employee history error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการโหลดประวัติ: " + (error?.message || "Unknown error") },
      { status: 500 }
    );
  }
}
