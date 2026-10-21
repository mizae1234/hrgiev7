import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { DataService } from "@/lib/data-service";
import { createAuditLog } from "@/lib/audit";
import { Role, AttendanceStatus } from "@prisma/client";

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user || user.role === Role.EMPLOYEE) {
    return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      summaryId,
      newCheckIn,
      newCheckOut,
      newStatus,
      reason,
    } = body;

    if (!summaryId || !newStatus || !reason?.trim()) {
      return NextResponse.json(
        { error: "กรุณาระบุรายการลงเวลา, สถานะใหม่ และเหตุผลการแก้ไข (Audit Trail)" },
        { status: 400 }
      );
    }

    const result = await DataService.correctAttendance({
      summaryId,
      adjustedById: user.id,
      newCheckIn: newCheckIn ? new Date(newCheckIn) : undefined,
      newCheckOut: newCheckOut ? new Date(newCheckOut) : undefined,
      newStatus: newStatus as AttendanceStatus,
      reason: reason.trim(),
    });

    await createAuditLog({
      userId: user.id,
      action: "CORRECT_ATTENDANCE",
      entity: "ATTENDANCE",
      entityId: summaryId,
      details: { newStatus, reason, newCheckIn, newCheckOut },
    });

    return NextResponse.json({
      success: true,
      message: "แก้ไขรายการลงเวลาและบันทึกประวัติการแก้ไขเรียบร้อยแล้ว",
      updated: result.updated,
      adjustment: result.adjustment,
    });
  } catch (error: any) {
    console.error("Attendance correction error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการแก้ไขข้อมูล: " + (error?.message || "Unknown error") },
      { status: 500 }
    );
  }
}
