import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest, hasCompanyAccess } from "@/lib/auth";
import { DataService } from "@/lib/data-service";
import { parseEmployeeExcel, EmployeeImportRow } from "@/lib/excel";
import { createAuditLog } from "@/lib/audit";
import { Role, EmploymentStatus } from "@prisma/client";

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user || user.role === Role.EMPLOYEE) {
    return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const action = (formData.get("action") as string) || "preview"; // "preview" | "confirm"
    const onDuplicate = (formData.get("onDuplicate") as string) || "skip"; // "skip" | "update"

    if (!file) {
      return NextResponse.json({ error: "กรุณาเลือกไฟล์ Excel (.xlsx)" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 1. Parse Excel rows
    const rows = parseEmployeeExcel(buffer);
    if (rows.length === 0) {
      return NextResponse.json({ error: "ไม่พบข้อมูลพนักงานในไฟล์ Excel หรือไฟล์ว่างเปล่า" }, { status: 400 });
    }

    // 2. Fetch reference data for validation
    const companies = await DataService.getCompanies();
    const departments = await DataService.getDepartments();
    const shifts = await DataService.getShifts();
    const locations = await DataService.getLocations();
    const existingEmployees = await DataService.getEmployees();

    const existingEmpIdMap = new Map<string, any>();
    existingEmployees.forEach((e) => {
      existingEmpIdMap.set(e.employeeId.toUpperCase(), e);
    });

    const fileSeenEmpIds = new Set<string>();

    // 3. Detailed row verification
    const evaluatedRows = rows.map((row) => {
      const errors = [...row.errors];
      const empIdUpper = row.employeeId.toUpperCase();

      // Check within-file duplicate
      if (fileSeenEmpIds.has(empIdUpper)) {
        errors.push("รหัสพนักงานซ้ำกับรายการอื่นในไฟล์เดียวกัน");
      } else {
        fileSeenEmpIds.add(empIdUpper);
      }

      // Check company existence & access
      const company = companies.find(
        (c) => c.code.toUpperCase() === row.companyCode.toUpperCase()
      );
      if (!company) {
        errors.push(`ไม่พบรหัสบริษัท '${row.companyCode}' ในระบบ`);
      } else if (!hasCompanyAccess(user, company.id)) {
        errors.push(`คุณไม่มีสิทธิ์นำเข้าข้อมูลของบริษัท '${row.companyCode}'`);
      }

      // Check department existence
      if (company) {
        const dept = departments.find(
          (d) => d.companyId === company.id && d.code.toUpperCase() === row.departmentCode.toUpperCase()
        );
        if (!dept) {
          errors.push(`ไม่พบรหัสแผนก '${row.departmentCode}' ภายใต้บริษัท '${row.companyCode}'`);
        }
      }

      // Check default shift if specified
      if (row.defaultShiftCode) {
        const shift = shifts.find(
          (s) => s.shiftCode.toUpperCase() === row.defaultShiftCode?.toUpperCase()
        );
        if (!shift) {
          errors.push(`ไม่พบรหัสกะ '${row.defaultShiftCode}' ในระบบ`);
        }
      }

      // Check default location if specified
      if (row.defaultLocationCode) {
        const loc = locations.find(
          (l) => l.locationCode.toUpperCase() === row.defaultLocationCode?.toUpperCase()
        );
        if (!loc) {
          errors.push(`ไม่พบรหัสสถานที่ '${row.defaultLocationCode}' ในระบบ`);
        }
      }

      const isExistingInDb = existingEmpIdMap.has(empIdUpper);

      return {
        ...row,
        isValid: errors.length === 0,
        errors,
        isExistingInDb,
      };
    });

    const totalRows = evaluatedRows.length;
    const validRows = evaluatedRows.filter((r) => r.isValid);
    const invalidRows = evaluatedRows.filter((r) => !r.isValid);
    const duplicateRows = evaluatedRows.filter((r) => r.isExistingInDb);

    // If PREVIEW mode, return evaluation results
    if (action === "preview") {
      return NextResponse.json({
        action: "preview",
        totalRows,
        validCount: validRows.length,
        invalidCount: invalidRows.length,
        duplicateCount: duplicateRows.length,
        rows: evaluatedRows,
      });
    }

    // If CONFIRM mode:
    if (validRows.length === 0) {
      return NextResponse.json(
        { error: "ไม่มีรายการที่ถูกต้องสำหรับนำเข้าสู่ระบบ กรุณาตรวจสอบข้อผิดพลาด" },
        { status: 400 }
      );
    }

    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (const row of validRows) {
      const empIdUpper = row.employeeId.toUpperCase();
      const existing = existingEmpIdMap.get(empIdUpper);

      if (existing) {
        if (onDuplicate === "skip") {
          skippedCount++;
          continue;
        }
      }

      const company = companies.find(
        (c) => c.code.toUpperCase() === row.companyCode.toUpperCase()
      )!;
      const dept = departments.find(
        (d) => d.companyId === company.id && d.code.toUpperCase() === row.departmentCode.toUpperCase()
      )!;
      const shift = row.defaultShiftCode
        ? shifts.find((s) => s.shiftCode.toUpperCase() === row.defaultShiftCode?.toUpperCase())
        : null;
      const loc = row.defaultLocationCode
        ? locations.find((l) => l.locationCode.toUpperCase() === row.defaultLocationCode?.toUpperCase())
        : null;

      if (existing && onDuplicate === "update") {
        await DataService.saveEmployee({
          id: existing.id,
          employeeId: existing.employeeId,
          firstName: row.firstName,
          lastName: row.lastName,
          email: row.email || existing.email,
          phone: row.phone || existing.phone,
          companyId: company.id,
          departmentId: dept.id,
          position: row.position,
          employmentStartDate: new Date(row.startDate),
          employmentStatus: existing.employmentStatus,
          defaultShiftId: shift ? shift.id : existing.defaultShiftId,
          defaultLocationId: loc ? loc.id : existing.defaultLocationId,
        });
        updatedCount++;
      } else {
        await DataService.saveEmployee({
          employeeId: row.employeeId,
          firstName: row.firstName,
          lastName: row.lastName,
          email: row.email || null,
          phone: row.phone || null,
          companyId: company.id,
          departmentId: dept.id,
          position: row.position,
          employmentStartDate: new Date(row.startDate),
          employmentStatus: EmploymentStatus.ACTIVE,
          defaultShiftId: shift ? shift.id : null,
          defaultLocationId: loc ? loc.id : null,
        });
        createdCount++;
      }
    }

    await createAuditLog({
      userId: user.id,
      action: "IMPORT",
      entity: "EMPLOYEE",
      details: {
        totalRows,
        createdCount,
        updatedCount,
        skippedCount,
        filename: file.name,
      },
    });

    return NextResponse.json({
      success: true,
      message: `นำเข้าพนักงานสำเร็จ: สร้างใหม่ ${createdCount} รายการ, อัปเดต ${updatedCount} รายการ, ข้าม ${skippedCount} รายการ`,
      stats: {
        totalRows,
        createdCount,
        updatedCount,
        skippedCount,
      },
    });
  } catch (error: any) {
    console.error("Employee import error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการประมวลผลไฟล์ Excel: " + (error?.message || "Unknown error") },
      { status: 500 }
    );
  }
}
