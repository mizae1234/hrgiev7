import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { DataService } from "@/lib/data-service";
import { formatBangkokTime } from "@/lib/attendance";
import { uploadAttendanceImage } from "@/lib/s3";

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user || !user.employeeId) {
    return NextResponse.json({ error: "กรุณาเข้าสู่ระบบด้วยบัญชีพนักงาน" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { latitude, longitude, accuracy, photo, deviceInfo } = body;

    // Validate photo
    if (!photo || typeof photo !== "string" || !photo.startsWith("data:image/")) {
      return NextResponse.json(
        { error: "จำเป็นต้องบันทึกภาพถ่ายจากกล้องสด (Live Camera) เพื่อลงเวลาออก" },
        { status: 400 }
      );
    }

    // Validate coordinates
    if (latitude === undefined || longitude === undefined || isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json(
        { error: "ไม่พบพิกัดตำแหน่ง GPS กรุณาเปิดใช้งาน GPS ในอุปกรณ์และอนุญาตการเข้าถึง" },
        { status: 400 }
      );
    }

    // Upload photo to S3 / Object Storage (HR_GIEV7/timeAttendance/YYYYMM/EMP_DATE.jpg)
    let photoUrlToSave = photo;
    try {
      const employee = await DataService.getEmployeeById(user.employeeId);
      const empCode = employee?.employeeId || user.empCode || "EMP";
      const uploadRes = await uploadAttendanceImage({
        employeeCode: empCode,
        photoBase64: photo,
        eventType: "CHECK_OUT",
      });
      photoUrlToSave = uploadRes.url;
    } catch (uploadErr: any) {
      console.warn("S3 upload warning, using local base64:", uploadErr?.message || uploadErr);
    }

    // Call DataService to perform server-side radius check and checkout calculation
    const result = await DataService.recordCheckOut({
      employeeId: user.employeeId,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      accuracy: accuracy ? parseFloat(accuracy) : undefined,
      photoUrl: photoUrlToSave,
      deviceInfo: deviceInfo || req.headers.get("user-agent") || undefined,
    });

    const checkOutFormatted = formatBangkokTime(result.summary.checkOutTime);
    const workHours = (result.totalWorkMinutes / 60).toFixed(1);

    return NextResponse.json({
      success: true,
      message: `ลงเวลาออกงานสำเร็จเรียบร้อย ณ เวลา ${checkOutFormatted} น. (รวมเวลาปฏิบัติงาน ${workHours} ชม.)`,
      checkOutTime: result.summary.checkOutTime,
      distanceMeters: result.distanceMeters,
      totalWorkMinutes: result.totalWorkMinutes,
      status: result.summary.attendanceStatus,
    });
  } catch (error: any) {
    console.error("Check-out error:", error);
    return NextResponse.json(
      { error: error?.message || "เกิดข้อผิดพลาดในการลงเวลาออกงาน" },
      { status: 400 }
    );
  }
}
