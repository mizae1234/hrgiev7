import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest, hasCompanyAccess } from "@/lib/auth";
import { DataService } from "@/lib/data-service";
import { createAuditLog } from "@/lib/audit";
import { Role, EmploymentStatus } from "@prisma/client";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromRequest(req);
  if (!user || user.role === Role.EMPLOYEE) {
    return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
  }

  const { id } = await context.params;
  const employee = await DataService.getEmployeeById(id);

  if (!employee) {
    return NextResponse.json({ error: "ไม่พบข้อมูลพนักงาน" }, { status: 404 });
  }

  if (!hasCompanyAccess(user, employee.companyId)) {
    return NextResponse.json({ error: "คุณไม่มีสิทธิ์เข้าถึงข้อมูลพนักงานของบริษัทนี้" }, { status: 403 });
  }

  return NextResponse.json({ employee });
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromRequest(req);
  if (!user || user.role === Role.EMPLOYEE) {
    return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
  }

  const { id } = await context.params;
  const existing = await DataService.getEmployeeById(id);
  if (!existing) {
    return NextResponse.json({ error: "ไม่พบข้อมูลพนักงาน" }, { status: 404 });
  }

  if (!hasCompanyAccess(user, existing.companyId)) {
    return NextResponse.json({ error: "คุณไม่มีสิทธิ์แก้ไขข้อมูลพนักงานของบริษัทนี้" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      firstName,
      lastName,
      email,
      phone,
      departmentId,
      position,
      employmentStartDate,
      resignationDate,
      employmentStatus,
      defaultShiftId,
      defaultLocationId,
    } = body;

    const updated = await DataService.saveEmployee({
      id,
      employeeId: existing.employeeId,
      firstName: firstName !== undefined ? firstName.trim() : existing.firstName,
      lastName: lastName !== undefined ? lastName.trim() : existing.lastName,
      email: email !== undefined ? (email?.trim() || null) : existing.email,
      phone: phone !== undefined ? (phone?.trim() || null) : existing.phone,
      companyId: existing.companyId,
      departmentId: departmentId || existing.departmentId,
      position: position !== undefined ? position.trim() : existing.position,
      employmentStartDate: employmentStartDate ? new Date(employmentStartDate) : existing.employmentStartDate,
      resignationDate: resignationDate !== undefined ? (resignationDate ? new Date(resignationDate) : null) : existing.resignationDate,
      employmentStatus: employmentStatus || existing.employmentStatus,
      defaultShiftId: defaultShiftId !== undefined ? defaultShiftId : existing.defaultShiftId,
      defaultLocationId: defaultLocationId !== undefined ? defaultLocationId : existing.defaultLocationId,
    });

    await createAuditLog({
      userId: user.id,
      action: "UPDATE",
      entity: "EMPLOYEE",
      entityId: id,
      details: { updatedFields: body },
    });

    return NextResponse.json({ success: true, employee: updated });
  } catch (error: any) {
    console.error("Update employee error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการอัปเดตข้อมูล: " + (error?.message || "Unknown error") },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromRequest(req);
  if (!user || user.role === Role.EMPLOYEE) {
    return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
  }

  const { id } = await context.params;
  const existing = await DataService.getEmployeeById(id);
  if (!existing) {
    return NextResponse.json({ error: "ไม่พบข้อมูลพนักงาน" }, { status: 404 });
  }

  if (!hasCompanyAccess(user, existing.companyId)) {
    return NextResponse.json({ error: "คุณไม่มีสิทธิ์ลบหรือแก้ไขข้อมูลพนักงานของบริษัทนี้" }, { status: 403 });
  }

  // Deactivate instead of hard delete to preserve historical attendance
  const updated = await DataService.saveEmployee({
    id,
    employeeId: existing.employeeId,
    firstName: existing.firstName,
    lastName: existing.lastName,
    email: existing.email,
    phone: existing.phone,
    companyId: existing.companyId,
    departmentId: existing.departmentId,
    position: existing.position,
    employmentStartDate: existing.employmentStartDate,
    resignationDate: new Date(),
    employmentStatus: EmploymentStatus.RESIGNED,
    defaultShiftId: existing.defaultShiftId,
    defaultLocationId: existing.defaultLocationId,
  });

  await createAuditLog({
    userId: user.id,
    action: "DEACTIVATE",
    entity: "EMPLOYEE",
    entityId: id,
    details: { reason: "Resigned/Deactivated via admin portal" },
  });

  return NextResponse.json({ success: true, message: "ปรับสถานะพนักงานเป็นลาออกเรียบร้อยแล้ว", employee: updated });
}
