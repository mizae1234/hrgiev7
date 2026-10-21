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
  const departmentId = searchParams.get("departmentId") || undefined;
  const status = searchParams.get("status") || undefined;
  const search = searchParams.get("search") || undefined;

  let targetCompanyId: string | undefined = undefined;
  if (user.role === Role.HR_ADMIN) {
    targetCompanyId = user.companyId || undefined;
  } else if (requestedCompanyId && requestedCompanyId !== "ALL") {
    targetCompanyId = requestedCompanyId;
  }

  const targetDate = dateParam ? parseDateString(dateParam) : getBangkokToday();

  const attendances = await DataService.getDailyAttendance({
    companyId: targetCompanyId,
    date: targetDate,
    departmentId,
    status,
    search,
  });

  return NextResponse.json({ attendances, date: dateParam || targetDate.toISOString() });
}
