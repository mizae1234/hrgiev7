import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { DataService } from "@/lib/data-service";
import { parseDateString, getBangkokToday } from "@/lib/attendance";
import { Role } from "@prisma/client";

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user || user.role === Role.EMPLOYEE) {
    return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const requestedCompanyId = searchParams.get("companyId");
  const dateParam = searchParams.get("date");

  // Enforce company isolation
  let targetCompanyId: string | undefined = undefined;
  if (user.role === Role.HR_ADMIN) {
    targetCompanyId = user.companyId || undefined;
  } else if (requestedCompanyId && requestedCompanyId !== "ALL") {
    targetCompanyId = requestedCompanyId;
  }

  const targetDate = dateParam ? parseDateString(dateParam) : getBangkokToday();

  // Basic stats
  const stats = await DataService.getDashboardStats(targetCompanyId, targetDate);

  // Department breakdown
  const departments = await DataService.getDepartments(targetCompanyId);
  const dailyAttendance = await DataService.getDailyAttendance({
    companyId: targetCompanyId,
    date: targetDate,
  });

  const departmentStats = departments.map((dept) => {
    const records = dailyAttendance.filter((a) => a.employee?.departmentId === dept.id);
    return {
      name: dept.name.split(" ")[0], // short name
      fullName: dept.name,
      checkedIn: records.filter((r) => r.checkInTime !== null).length,
      late: records.filter((r) => r.isLate).length,
    };
  });

  // Hourly attendance trend (07:00 to 19:00)
  const hourlyBuckets = Array.from({ length: 12 }, (_, i) => {
    const hour = i + 8; // 08:00 to 19:00
    const label = `${hour.toString().padStart(2, "0")}:00`;
    const count = dailyAttendance.filter((a) => {
      if (!a.checkInTime) return false;
      const bangkokHour = new Date(a.checkInTime).getUTCHours() + 7;
      return bangkokHour === hour;
    }).length;

    return { hour: label, count };
  });

  return NextResponse.json({
    stats,
    departmentStats,
    hourlyBuckets,
  });
}
