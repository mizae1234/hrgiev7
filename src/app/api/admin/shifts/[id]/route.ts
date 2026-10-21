import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest, hasCompanyAccess } from "@/lib/auth";
import { DataService } from "@/lib/data-service";
import { createAuditLog } from "@/lib/audit";
import { Role } from "@prisma/client";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromRequest(req);
  if (!user || user.role === Role.EMPLOYEE) {
    return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
  }

  const { id } = await context.params;
  const shift = await DataService.getShiftById(id);
  if (!shift) {
    return NextResponse.json({ error: "ไม่พบกะการทำงาน" }, { status: 404 });
  }

  return NextResponse.json({ shift });
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
  const existing = await DataService.getShiftById(id);
  if (!existing) {
    return NextResponse.json({ error: "ไม่พบกะการทำงาน" }, { status: 404 });
  }

  if (existing.companyId && !hasCompanyAccess(user, existing.companyId)) {
    return NextResponse.json({ error: "คุณไม่มีสิทธิ์แก้ไขกะการทำงานของบริษัทนี้" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { shiftCode, shiftName, startTime, endTime, gracePeriodMinutes, active } = body;

    const updated = await DataService.saveShift({
      id,
      shiftCode: shiftCode !== undefined ? shiftCode.trim().toUpperCase() : existing.shiftCode,
      shiftName: shiftName !== undefined ? shiftName.trim() : existing.shiftName,
      companyId: existing.companyId,
      startTime: startTime !== undefined ? startTime.trim() : existing.startTime,
      endTime: endTime !== undefined ? endTime.trim() : existing.endTime,
      gracePeriodMinutes: gracePeriodMinutes !== undefined ? parseInt(gracePeriodMinutes, 10) : existing.gracePeriodMinutes,
      active: active !== undefined ? Boolean(active) : existing.active,
    });

    await createAuditLog({
      userId: user.id,
      action: "UPDATE",
      entity: "SHIFT",
      entityId: id,
      details: { updatedFields: body },
    });

    return NextResponse.json({ success: true, shift: updated });
  } catch (error: any) {
    console.error("Update shift error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการอัปเดตข้อมูลกะ: " + (error?.message || "Unknown error") },
      { status: 500 }
    );
  }
}
