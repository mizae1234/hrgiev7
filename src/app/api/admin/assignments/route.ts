import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest, hasCompanyAccess } from "@/lib/auth";
import { DataService } from "@/lib/data-service";
import { parseDateString } from "@/lib/attendance";
import { createAuditLog } from "@/lib/audit";
import { Role, AssignmentType } from "@prisma/client";

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user || user.role === Role.EMPLOYEE) {
    return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const requestedCompanyId = searchParams.get("companyId");
  const dateParam = searchParams.get("date");
  const employeeId = searchParams.get("employeeId") || undefined;

  let targetCompanyId: string | undefined = undefined;
  if (user.role === Role.HR_ADMIN) {
    targetCompanyId = user.companyId || undefined;
  } else if (requestedCompanyId && requestedCompanyId !== "ALL") {
    targetCompanyId = requestedCompanyId;
  }

  const targetDate = dateParam ? parseDateString(dateParam) : undefined;

  const assignments = await DataService.getAssignments({
    companyId: targetCompanyId,
    date: targetDate,
    employeeId,
  });

  return NextResponse.json({ assignments });
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user || user.role === Role.EMPLOYEE) {
    return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      employeeIds, // Array of employee IDs or single employeeId string
      date,
      workLocationId,
      shiftTemplateId,
      assignmentType = AssignmentType.BOOTH,
      notes,
    } = body;

    const ids: string[] = Array.isArray(employeeIds)
      ? employeeIds
      : body.employeeId
      ? [body.employeeId]
      : [];

    if (ids.length === 0 || !date || !workLocationId) {
      return NextResponse.json(
        { error: "กรุณาระบุพนักงาน, วันที่ และสถานที่มอบหมาย" },
        { status: 400 }
      );
    }

    const targetDate = parseDateString(date);
    const createdAssignments = [];
    let replacedCount = 0;

    // Employees who already checked in on this date: the new assignment will
    // NOT change their existing attendance record (location/shift are fixed at check-in).
    const dayAttendances = await DataService.getDailyAttendance({ date: targetDate });
    const checkedInEmployeeIds = new Set(
      dayAttendances.filter((a: any) => a.checkInTime).map((a: any) => a.employeeId)
    );
    const alreadyCheckedIn: string[] = [];

    for (const empId of ids) {
      const emp = await DataService.getEmployeeById(empId);
      if (!emp) continue;

      if (!hasCompanyAccess(user, emp.companyId)) {
        continue;
      }

      const result = await DataService.createAssignment({
        employeeId: empId,
        date: targetDate,
        workLocationId,
        shiftTemplateId: shiftTemplateId || null,
        assignmentType: assignmentType as AssignmentType,
        notes: notes?.trim() || null,
        createdById: user.id,
      });

      createdAssignments.push(result.assignment);
      replacedCount += result.replacedCount;
      if (checkedInEmployeeIds.has(empId)) {
        alreadyCheckedIn.push(`${emp.employeeId} ${emp.firstName} ${emp.lastName}`);
      }
    }

    await createAuditLog({
      userId: user.id,
      action: "ASSIGN_BOOTH",
      entity: "ASSIGNMENT",
      details: {
        assignedCount: createdAssignments.length,
        replacedCount,
        date,
        workLocationId,
        shiftTemplateId,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: `มอบหมายสถานที่เรียบร้อยแล้ว (${createdAssignments.length} รายการ${
          replacedCount > 0 ? `, แทนที่รายการเดิม ${replacedCount} รายการ` : ""
        })`,
        assignments: createdAssignments,
        replacedCount,
        alreadyCheckedIn,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Create assignment error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการมอบหมายสถานที่: " + (error?.message || "Unknown error") },
      { status: 500 }
    );
  }
}
