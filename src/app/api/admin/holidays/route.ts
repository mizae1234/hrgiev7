import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isDatabaseConnected, memoryStore } from "@/lib/data-service";
import { Role } from "@prisma/client";

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user || user.role === Role.EMPLOYEE) {
    return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const companyId = searchParams.get("companyId") || undefined;
  const year = searchParams.get("year");

  if (await isDatabaseConnected()) {
    const where: any = {};
    if (user.role === Role.HR_ADMIN && user.companyId) {
      where.OR = [{ companyId: user.companyId }, { companyId: null }];
    } else if (companyId && companyId !== "ALL") {
      where.OR = [{ companyId }, { companyId: null }];
    }

    if (year) {
      const start = new Date(`${year}-01-01T00:00:00.000Z`);
      const end = new Date(`${year}-12-31T23:59:59.999Z`);
      where.holidayDate = { gte: start, lte: end };
    }

    const holidays = await prisma.holiday.findMany({
      where,
      include: {
        company: {
          select: { id: true, code: true, name: true },
        },
      },
      orderBy: { holidayDate: "asc" },
    });

    return NextResponse.json({ holidays });
  }

  // Fallback memoryStore
  let list = memoryStore.holidays;
  if (user.role === Role.HR_ADMIN && user.companyId) {
    list = list.filter((h: any) => !h.companyId || h.companyId === user.companyId);
  }
  return NextResponse.json({ holidays: list });
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user || user.role === Role.EMPLOYEE) {
    return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { holidayDate, name, description, companyId } = body;

    if (!holidayDate || !name) {
      return NextResponse.json({ error: "กรุณาระบุวันที่และชื่อวันหยุด" }, { status: 400 });
    }

    const targetCompanyId =
      user.role === Role.HR_ADMIN ? user.companyId : companyId || null;

    if (await isDatabaseConnected()) {
      const created = await prisma.holiday.create({
        data: {
          holidayDate: new Date(holidayDate),
          name: name.trim(),
          description: description?.trim() || null,
          companyId: targetCompanyId,
        },
        include: {
          company: {
            select: { id: true, code: true, name: true },
          },
        },
      });

      return NextResponse.json({ success: true, holiday: created });
    }

    const newH = {
      id: "h-" + Date.now(),
      holidayDate: new Date(holidayDate),
      name: name.trim(),
      description: description?.trim() || "",
      companyId: targetCompanyId,
    };
    memoryStore.holidays.push(newH as any);
    return NextResponse.json({ success: true, holiday: newH });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user || user.role === Role.EMPLOYEE) {
    return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "กรุณาระบุ ID วันหยุดที่ต้องการลบ" }, { status: 400 });
  }

  if (await isDatabaseConnected()) {
    await prisma.holiday.delete({ where: { id } });
    return NextResponse.json({ success: true });
  }

  memoryStore.holidays = memoryStore.holidays.filter((h: any) => h.id !== id);
  return NextResponse.json({ success: true });
}
