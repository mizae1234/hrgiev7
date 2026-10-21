import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { DataService } from "@/lib/data-service";
import { createAuditLog } from "@/lib/audit";
import { Role } from "@prisma/client";

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromRequest(req);
  if (!user || user.role === Role.EMPLOYEE) {
    return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
  }

  const { id } = await context.params;

  try {
    const success = await DataService.deleteAssignment(id);
    if (!success) {
      return NextResponse.json({ error: "ไม่พบรายการมอบหมาย" }, { status: 404 });
    }

    await createAuditLog({
      userId: user.id,
      action: "DELETE_ASSIGNMENT",
      entity: "ASSIGNMENT",
      entityId: id,
    });

    return NextResponse.json({ success: true, message: "ยกเลิกการมอบหมายสถานที่เรียบร้อยแล้ว" });
  } catch (error: any) {
    console.error("Delete assignment error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการยกเลิก: " + (error?.message || "Unknown error") },
      { status: 500 }
    );
  }
}
