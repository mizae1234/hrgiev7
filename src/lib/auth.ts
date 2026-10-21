import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";

const SECRET_KEY = new TextEncoder().encode(
  process.env.AUTH_SECRET || "hr-attendance-default-development-secret-key-32chars"
);

export const SESSION_COOKIE_NAME = "hr_session";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  companyId: string | null;
  companyName?: string;
  employeeId?: string | null;
  empCode?: string | null;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET_KEY);
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return {
      id: payload.id as string,
      email: payload.email as string,
      name: payload.name as string,
      role: payload.role as Role,
      companyId: (payload.companyId as string) || null,
      companyName: payload.companyName as string | undefined,
      employeeId: (payload.employeeId as string) || null,
      empCode: payload.empCode as string | undefined,
    };
  } catch {
    return null;
  }
}

export async function setSessionCookie(response: NextResponse, token: string) {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
}

export async function clearSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;
    return await verifySessionToken(token);
  } catch {
    return null;
  }
}

export async function getUserFromRequest(req: NextRequest): Promise<SessionUser | null> {
  try {
    const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;
    return await verifySessionToken(token);
  } catch {
    return null;
  }
}

/**
 * Checks if a user has access to a target company.
 * - SUPER_ADMIN can access all companies.
 * - HR_ADMIN can only access their assigned companyId.
 */
export function hasCompanyAccess(user: SessionUser, targetCompanyId: string | null | undefined): boolean {
  if (user.role === Role.SUPER_ADMIN) return true;
  if (!targetCompanyId) return false;
  return user.companyId === targetCompanyId;
}
