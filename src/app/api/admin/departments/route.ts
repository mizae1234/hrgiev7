import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { DataService } from "@/lib/data-service";
import { Role } from "@prisma/client";

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user || user.role === Role.EMPLOYEE) {
    return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const companyId = searchParams.get("companyId") || undefined;

  let targetCompanyId = companyId;
  if (user.role === Role.HR_ADMIN) {
    targetCompanyId = user.companyId || undefined;
  }

  const departments = await DataService.getDepartments(targetCompanyId);
  return NextResponse.json({ departments });
}
