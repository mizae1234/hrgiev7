import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest, hasCompanyAccess } from "@/lib/auth";
import { DataService } from "@/lib/data-service";
import { createAuditLog } from "@/lib/audit";
import { Role, EmploymentStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user || user.role === Role.EMPLOYEE) {
    return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const requestedCompanyId = searchParams.get("companyId");
  const departmentId = searchParams.get("departmentId") || undefined;
  const status = searchParams.get("status") || undefined;
  const search = searchParams.get("search") || undefined;

  let targetCompanyId: string | undefined = undefined;
  if (user.role === Role.HR_ADMIN) {
    targetCompanyId = user.companyId || undefined;
  } else if (requestedCompanyId && requestedCompanyId !== "ALL") {
    targetCompanyId = requestedCompanyId;
  }

  const employees = await DataService.getEmployees({
    companyId: targetCompanyId,
    departmentId,
    status,
    search,
  });

  return NextResponse.json({ employees });
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user || user.role === Role.EMPLOYEE) {
    return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      employeeId,
      firstName,
      lastName,
      email,
      phone,
      companyId,
      departmentId,
      position,
      employmentStartDate,
      resignationDate,
      employmentStatus = EmploymentStatus.ACTIVE,
      defaultShiftId,
      defaultLocationId,
    } = body;

    // Validate required fields
    if (!employeeId || !firstName || !lastName || !companyId || !departmentId || !position || !employmentStartDate) {
      return NextResponse.json({ error: "กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน" }, { status: 400 });
    }

    // Company authorization check
    if (!hasCompanyAccess(user, companyId)) {
      return NextResponse.json({ error: "คุณไม่มีสิทธิ์สร้างพนักงานในบริษัทนี้" }, { status: 403 });
    }

    // Check duplicate employee ID
    const existing = await DataService.getEmployees({ search: employeeId.trim() });
    const duplicate = existing.find(
      (e) => e.employeeId.toLowerCase() === employeeId.trim().toLowerCase()
    );
    if (duplicate) {
      return NextResponse.json(
        { error: `รหัสพนักงาน ${employeeId} มีอยู่ในระบบแล้ว` },
        { status: 400 }
      );
    }

    const newEmployee = await DataService.saveEmployee({
      employeeId: employeeId.trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email?.trim() || null,
      phone: phone?.trim() || null,
      companyId,
      departmentId,
      position: position.trim(),
      employmentStartDate: new Date(employmentStartDate),
      resignationDate: resignationDate ? new Date(resignationDate) : null,
      employmentStatus: employmentStatus as EmploymentStatus,
      defaultShiftId: defaultShiftId || null,
      defaultLocationId: defaultLocationId || null,
    });

    await createAuditLog({
      userId: user.id,
      action: "CREATE",
      entity: "EMPLOYEE",
      entityId: newEmployee.id,
      details: { employeeId, name: `${firstName} ${lastName}`, companyId },
    });

    return NextResponse.json({ success: true, employee: newEmployee }, { status: 201 });
  } catch (error: any) {
    console.error("Create employee error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการบันทึกข้อมูล: " + (error?.message || "Unknown error") },
      { status: 500 }
    );
  }
}
