import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { DataService } from "@/lib/data-service";
import { Role } from "@prisma/client";

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user || user.role === Role.EMPLOYEE) {
    return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
  }

  const allCompanies = await DataService.getCompanies();

  // If HR_ADMIN, only return their company
  if (user.role === Role.HR_ADMIN && user.companyId) {
    const userCompany = allCompanies.filter((c) => c.id === user.companyId);
    return NextResponse.json({ companies: userCompany });
  }

  // SUPER_ADMIN gets all companies
  return NextResponse.json({ companies: allCompanies });
}
