import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest, hasCompanyAccess } from "@/lib/auth";
import { DataService } from "@/lib/data-service";
import { createAuditLog } from "@/lib/audit";
import { Role, LocationType } from "@prisma/client";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromRequest(req);
  if (!user || user.role === Role.EMPLOYEE) {
    return NextResponse.json({ error: "ไม่มีสิทธิ์เข้าถึง" }, { status: 403 });
  }

  const { id } = await context.params;
  const location = await DataService.getLocationById(id);
  if (!location) {
    return NextResponse.json({ error: "ไม่พบสถานที่" }, { status: 404 });
  }

  return NextResponse.json({ location });
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
  const existing = await DataService.getLocationById(id);
  if (!existing) {
    return NextResponse.json({ error: "ไม่พบสถานที่" }, { status: 404 });
  }

  if (existing.companyId && !hasCompanyAccess(user, existing.companyId)) {
    return NextResponse.json({ error: "คุณไม่มีสิทธิ์แก้ไขสถานที่ของบริษัทนี้" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      locationCode,
      locationName,
      locationType,
      address,
      latitude,
      longitude,
      allowedRadiusMeters,
      active,
    } = body;

    const updated = await DataService.saveLocation({
      id,
      locationCode: locationCode !== undefined ? locationCode.trim().toUpperCase() : existing.locationCode,
      locationName: locationName !== undefined ? locationName.trim() : existing.locationName,
      companyId: existing.companyId,
      locationType: (locationType as LocationType) || existing.locationType,
      address: address !== undefined ? address : existing.address,
      latitude: latitude !== undefined ? parseFloat(latitude) : existing.latitude,
      longitude: longitude !== undefined ? parseFloat(longitude) : existing.longitude,
      allowedRadiusMeters: allowedRadiusMeters !== undefined ? parseInt(allowedRadiusMeters, 10) : existing.allowedRadiusMeters,
      active: active !== undefined ? Boolean(active) : existing.active,
    });

    await createAuditLog({
      userId: user.id,
      action: "UPDATE",
      entity: "LOCATION",
      entityId: id,
      details: { updatedFields: body },
    });

    return NextResponse.json({ success: true, location: updated });
  } catch (error: any) {
    console.error("Update location error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการอัปเดตสถานที่: " + (error?.message || "Unknown error") },
      { status: 500 }
    );
  }
}
