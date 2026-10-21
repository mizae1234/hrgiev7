import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isDatabaseConnected, memoryStore } from "@/lib/data-service";
import { parseHolidayExcel, HolidayImportRow } from "@/lib/excel";
import { Role } from "@prisma/client";

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user || user.role === Role.EMPLOYEE) {
    return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const action = formData.get("action") as string; // 'validate' or 'confirm'

    if (!file) {
      return NextResponse.json({ error: "กรุณาเลือกไฟล์ Excel (.xlsx)" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const rows = parseHolidayExcel(buffer);

    if (rows.length === 0) {
      return NextResponse.json({ error: "ไม่พบข้อมูลในไฟล์ Excel หรือไฟล์ว่างเปล่า" }, { status: 400 });
    }

    // Fetch existing companies for code mapping
    let companies: Array<{ id: string; code: string; name: string }> = [];
    if (await isDatabaseConnected()) {
      companies = await prisma.company.findMany({ select: { id: true, code: true, name: true } });
    } else {
      companies = memoryStore.companies;
    }

    const companyMap = new Map(companies.map((c) => [c.code.toUpperCase(), c.id]));

    // Validate rows
    const validatedRows: HolidayImportRow[] = rows.map((row) => {
      const rowErrors = [...row.errors];

      if (row.companyCode) {
        const foundId = companyMap.get(row.companyCode);
        if (!foundId) {
          rowErrors.push(`ไม่พบรหัสบริษัท "${row.companyCode}" ในระบบ`);
        } else if (user.role === Role.HR_ADMIN && user.companyId && user.companyId !== foundId) {
          rowErrors.push(`คุณไม่มีสิทธิ์นำเข้าวันหยุดสำหรับบริษัท "${row.companyCode}"`);
        }
      }

      return {
        ...row,
        isValid: rowErrors.length === 0,
        errors: rowErrors,
      };
    });

    const hasErrors = validatedRows.some((r) => !r.isValid);

    // If only validating, return analysis
    if (action === "validate") {
      return NextResponse.json({
        totalRows: validatedRows.length,
        validRowsCount: validatedRows.filter((r) => r.isValid).length,
        invalidRowsCount: validatedRows.filter((r) => !r.isValid).length,
        rows: validatedRows,
      });
    }

    // Confirm & Save
    if (action === "confirm") {
      if (hasErrors) {
        return NextResponse.json(
          { error: "ข้อมูลบางแถวยังไม่ถูกต้อง กรุณาตรวจสอบก่อนยืนยัน", rows: validatedRows },
          { status: 400 }
        );
      }

      let importedCount = 0;

      if (await isDatabaseConnected()) {
        for (const row of validatedRows) {
          const companyId = row.companyCode ? companyMap.get(row.companyCode) || null : null;
          const holidayDate = new Date(row.holidayDate);

          // Check if already exists on same date and company
          const existing = await prisma.holiday.findFirst({
            where: {
              holidayDate,
              companyId,
            },
          });

          if (existing) {
            await prisma.holiday.update({
              where: { id: existing.id },
              data: {
                name: row.name,
                description: row.description || null,
              },
            });
          } else {
            await prisma.holiday.create({
              data: {
                holidayDate,
                name: row.name,
                description: row.description || null,
                companyId,
              },
            });
          }
          importedCount++;
        }
      } else {
        // Fallback memoryStore
        for (const row of validatedRows) {
          const companyId = row.companyCode ? companyMap.get(row.companyCode) || null : null;
          memoryStore.holidays.push({
            id: "h-" + Date.now() + Math.random(),
            holidayDate: new Date(row.holidayDate),
            name: row.name,
            description: row.description || "",
            companyId,
          } as any);
          importedCount++;
        }
      }

      return NextResponse.json({
        success: true,
        importedCount,
        message: `นำเข้าวันหยุดสำเร็จทั้งหมด ${importedCount} รายการ`,
      });
    }

    return NextResponse.json({ error: "ระบุ action ไม่ถูกต้อง" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "เกิดข้อผิดพลาดในการประมวลผลไฟล์" }, { status: 500 });
  }
}
