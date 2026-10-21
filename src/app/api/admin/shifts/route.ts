import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest, hasCompanyAccess } from "@/lib/auth";
import { DataService } from "@/lib/data-service";
import { createAuditLog } from "@/lib/audit";
import { Role } from "@prisma/client";

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user || user.role === Role.EMPLOYEE) {
    return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const requestedCompanyId = searchParams.get("companyId");

  let targetCompanyId: string | undefined = undefined;
  if (user.role === Role.HR_ADMIN) {
    targetCompanyId = user.companyId || undefined;
  } else if (requestedCompanyId && requestedCompanyId !== "ALL") {
    targetCompanyId = requestedCompanyId;
  }

  const shifts = await DataService.getShifts(targetCompanyId);
  return NextResponse.json({ shifts });
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user || user.role === Role.EMPLOYEE) {
    return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      shiftCode,
      shiftName,
      companyId,
      startTime,
      endTime,
      gracePeriodMinutes = 15,
      active = true,
    } = body;

    if (!shiftCode || !shiftName || !startTime || !endTime) {
      return NextResponse.json({ error: "กรุณาระบุรหัสกะ, ชื่อกะ, เวลาเริ่ม และเวลาเลิกงาน" }, { status: 400 });
    }

    if (companyId && !hasCompanyAccess(user, companyId)) {
      return NextResponse.json({ error: "คุณไม่มีสิทธิ์สร้างกะการทำงานในบริษัทนี้" }, { status: 403 });
    }

    const newShift = await DataService.saveShift({
      shiftCode: shiftCode.trim().toUpperCase(),
      shiftName: shiftName.trim(),
      companyId: companyId || null,
      startTime: startTime.trim(),
      endTime: endTime.trim(),
      gracePeriodMinutes: parseInt(gracePeriodMinutes, 10) || 15,
      active: Boolean(active),
    });

    await createAuditLog({
      userId: user.id,
      action: "CREATE",
      entity: "SHIFT",
      entityId: newShift.id,
      details: { shiftCode, shiftName, startTime, endTime },
    });

    return NextResponse.json({ success: true, shift: newShift }, { status: 201 });
  } catch (error: any) {
    console.error("Create shift error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการบันทึกกะ: " + (error?.message || "Unknown error") },
      { status: 500 }
    );
  }
}
