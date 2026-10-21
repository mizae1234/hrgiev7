import { NextRequest, NextResponse } from "next/server";
import { DataService } from "@/lib/data-service";
import { verifyPassword, createSessionToken, setSessionCookie } from "@/lib/auth";
import { Role } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "กรุณาระบุอีเมลและรหัสผ่าน" },
        { status: 400 }
      );
    }

    const user = await DataService.findUserByEmail(email.trim());
    if (!user || !user.active) {
      return NextResponse.json(
        { error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง หรือบัญชีถูกระงับการใช้งาน" },
        { status: 401 }
      );
    }

    const isMatch = await verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" },
        { status: 401 }
      );
    }

    const sessionUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      companyId: user.companyId || null,
      companyName: user.company?.name,
      employeeId: user.employeeId || null,
      empCode: user.employee?.employeeId,
    };

    const token = await createSessionToken(sessionUser);

    const redirectUrl =
      user.role === Role.EMPLOYEE ? "/employee" : "/admin";

    const response = NextResponse.json({
      success: true,
      user: sessionUser,
      redirectUrl,
    });

    await setSessionCookie(response, token);
    return response;
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการเข้าสู่ระบบ: " + (error?.message || "Unknown error") },
      { status: 500 }
    );
  }
}
