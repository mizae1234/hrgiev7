import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest, hasCompanyAccess } from "@/lib/auth";
import { DataService } from "@/lib/data-service";
import { createAuditLog } from "@/lib/audit";
import { Role, LocationType } from "@prisma/client";

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

  const locations = await DataService.getLocations(targetCompanyId);
  return NextResponse.json({ locations });
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user || user.role === Role.EMPLOYEE) {
    return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      locationCode,
      locationName,
      companyId,
      locationType = LocationType.OFFICE,
      address,
      latitude,
      longitude,
      allowedRadiusMeters = 100,
      active = true,
    } = body;

    if (!locationCode || !locationName || latitude === undefined || longitude === undefined) {
      return NextResponse.json({ error: "กรุณาระบุรหัสสถานที่, ชื่อสถานที่ และพิกัดละติจูด/ลองจิจูด" }, { status: 400 });
    }

    if (companyId && !hasCompanyAccess(user, companyId)) {
      return NextResponse.json({ error: "คุณไม่มีสิทธิ์สร้างสถานที่ในบริษัทนี้" }, { status: 403 });
    }

    const newLoc = await DataService.saveLocation({
      locationCode: locationCode.trim().toUpperCase(),
      locationName: locationName.trim(),
      companyId: companyId || null,
      locationType: locationType as LocationType,
      address: address?.trim() || null,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      allowedRadiusMeters: parseInt(allowedRadiusMeters, 10) || 100,
      active: Boolean(active),
    });

    await createAuditLog({
      userId: user.id,
      action: "CREATE",
      entity: "LOCATION",
      entityId: newLoc.id,
      details: { locationCode, locationName, locationType },
    });

    return NextResponse.json({ success: true, location: newLoc }, { status: 201 });
  } catch (error: any) {
    console.error("Create location error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการบันทึกสถานที่: " + (error?.message || "Unknown error") },
      { status: 500 }
    );
  }
}
