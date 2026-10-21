import { prisma } from "./prisma";
import { Role, EmploymentStatus, LocationType, AssignmentType, AttendanceStatus, EventType } from "@prisma/client";
import bcrypt from "bcryptjs";
import { getBangkokToday, formatBangkokDate, evaluateAttendance } from "./attendance";
import { isWithinRadius } from "./geo";

// Flag to track whether Prisma DB is available with a short cache TTL
let dbAvailable: boolean | null = null;
let lastCheckTime = 0;

export async function isDatabaseConnected(): Promise<boolean> {
  const now = Date.now();
  if (dbAvailable !== null && now - lastCheckTime < 5000) {
    return dbAvailable;
  }
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbAvailable = true;
    lastCheckTime = now;
    return true;
  } catch {
    dbAvailable = false;
    lastCheckTime = now;
    return false;
  }
}

// Types for resilient in-memory development store
export interface MemoryCompany {
  id: string;
  code: string;
  name: string;
  taxId?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MemoryDepartment {
  id: string;
  companyId: string;
  code: string;
  name: string;
  active: boolean;
}

export interface MemoryLocation {
  id: string;
  companyId?: string | null;
  locationCode: string;
  locationName: string;
  locationType: LocationType;
  address?: string | null;
  latitude: number;
  longitude: number;
  allowedRadiusMeters: number;
  active: boolean;
}

export interface MemoryShift {
  id: string;
  companyId?: string | null;
  shiftCode: string;
  shiftName: string;
  startTime: string;
  endTime: string;
  gracePeriodMinutes: number;
  active: boolean;
}

export interface MemoryUser {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: Role;
  companyId?: string | null;
  employeeId?: string | null;
  active: boolean;
}

export interface MemoryEmployee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  companyId: string;
  departmentId: string;
  position: string;
  employmentStartDate: Date;
  resignationDate?: Date | null;
  employmentStatus: EmploymentStatus;
  defaultLocationId?: string | null;
  defaultShiftId?: string | null;
  avatarUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MemoryAssignment {
  id: string;
  employeeId: string;
  date: Date;
  workLocationId: string;
  shiftTemplateId?: string | null;
  assignmentType: AssignmentType;
  notes?: string | null;
  createdById?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// In-Memory Data Store for resilient offline/scaffolding mode
const hashedDefaultPassword = bcrypt.hashSync("Password123!", 10);

export const memoryStore: {
  companies: MemoryCompany[];
  departments: MemoryDepartment[];
  locations: MemoryLocation[];
  shifts: MemoryShift[];
  users: MemoryUser[];
  employees: MemoryEmployee[];
  assignments: MemoryAssignment[];
  workSchedules: Array<{
    id: string;
    employeeId: string;
    date: Date;
    shiftTemplateId?: string | null;
    isRestDay: boolean;
    notes?: string | null;
  }>;
  attendanceSummaries: Array<{
    id: string;
    employeeId: string;
    companyId: string;
    date: Date;
    scheduledShiftId?: string | null;
    scheduledLocationId?: string | null;
    effectiveStartTime: string;
    effectiveEndTime: string;
    checkInTime?: Date | null;
    checkOutTime?: Date | null;
    checkInPhotoUrl?: string | null;
    checkOutPhotoUrl?: string | null;
    checkInDistanceMeters?: number | null;
    checkOutDistanceMeters?: number | null;
    checkInLatitude?: number | null;
    checkInLongitude?: number | null;
    checkOutLatitude?: number | null;
    checkOutLongitude?: number | null;
    attendanceStatus: AttendanceStatus;
    isLate: boolean;
    lateMinutes: number;
    isEarlyLeave: boolean;
    earlyLeaveMinutes: number;
    totalWorkMinutes: number;
    isCorrected: boolean;
    correctionReason?: string | null;
    correctedById?: string | null;
    correctedAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }>;
  attendanceEvents: Array<{
    id: string;
    attendanceDailySummaryId?: string | null;
    employeeId: string;
    eventType: EventType;
    eventTime: Date;
    latitude: number;
    longitude: number;
    accuracy?: number | null;
    distanceMeters: number;
    isWithinRadius: boolean;
    photoUrl: string;
    deviceInfo?: string | null;
    notes?: string | null;
    createdAt: Date;
  }>;
  adjustments: Array<{
    id: string;
    dailySummaryId: string;
    employeeId: string;
    adjustedById: string;
    previousCheckIn?: Date | null;
    newCheckIn?: Date | null;
    previousCheckOut?: Date | null;
    newCheckOut?: Date | null;
    previousStatus: AttendanceStatus;
    newStatus: AttendanceStatus;
    reason: string;
    createdAt: Date;
  }>;
  holidays: Array<{
    id: string;
    holidayDate: Date;
    name: string;
    description: string;
  }>;
} = {
  companies: [
    {
      id: "comp-gi",
      code: "GI",
      name: "บริษัท โกลด์ อินทิเกรท จำกัด",
      taxId: "0105558012345",
      address: "อาคารโกลด์ อินทิเกรท กรุงเทพฯ",
      phone: "02-100-0000",
      email: "contact@goldintegrate.co.th",
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "comp-gi01",
      code: "GI01",
      name: "บริษัท โกลด์อินทิเกรท กาญจนาภิเษก – บางแค จำกัด",
      taxId: "0105558012346",
      address: "ถนนกาญจนาภิเษก แขวงบางแคเหนือ เขตบางแค กรุงเทพฯ",
      phone: "02-101-0001",
      email: "branch.gi01@goldintegrate.co.th",
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "comp-gi02",
      code: "GI02",
      name: "บริษัท โกลด์ อินทิเกรท มีนบุรี จำกัด",
      taxId: "0105558012347",
      address: "ถนนสีหบุรานุกิจ แขวงมีนบุรี เขตมีนบุรี กรุงเทพฯ",
      phone: "02-101-0002",
      email: "branch.gi02@goldintegrate.co.th",
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "comp-gi03",
      code: "GI03",
      name: "บริษัท โกลด์ อินทิเกรท เลียบด่วนรามอินทรา จำกัด",
      taxId: "0105558012348",
      address: "ถนนประดิษฐ์มนูธรรม แขวงลาดพร้าว เขตลาดพร้าว กรุงเทพฯ",
      phone: "02-101-0003",
      email: "branch.gi03@goldintegrate.co.th",
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "comp-gi04",
      code: "GI04",
      name: "บริษัท โกลด์ อินทิเกรท สีลม ซอย 9 จำกัด",
      taxId: "0105558012349",
      address: "สีลม ซอย 9 แขวงสีลม เขตบางรัก กรุงเทพฯ",
      phone: "02-101-0004",
      email: "branch.gi04@goldintegrate.co.th",
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "comp-gi05",
      code: "GI05",
      name: "บริษัท โกลด์ อินทิเกรท อุบลราชธานี จำกัด",
      taxId: "0105558012350",
      address: "ถนนชยางกูร ต.ในเมือง อ.เมือง อุบลราชธานี",
      phone: "045-101-0005",
      email: "branch.gi05@goldintegrate.co.th",
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "comp-gi06",
      code: "GI06",
      name: "EV7 Co.,Ltd.",
      taxId: "0105558012351",
      address: "อาคารอีวี เซเว่น ทาวเวอร์ สุขุมวิท กรุงเทพฯ",
      phone: "02-777-7777",
      email: "contact@ev7.co.th",
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "comp-gi07",
      code: "GI07",
      name: "บริษัท โกลด์ อินทิเกรท มหาชัย จำกัด",
      taxId: "0105558012352",
      address: "ถนนพระราม 2 ต.มหาชัย อ.เมือง สมุทรสาคร",
      phone: "034-101-0007",
      email: "branch.gi07@goldintegrate.co.th",
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "comp-gi08",
      code: "GI08",
      name: "บริษัท โกลด์ อินทิเกรท ศาลายา จำกัด",
      taxId: "0105558012353",
      address: "ถนนพุทธมณฑลสาย 4 ต.ศาลายา อ.พุทธมณฑล นครปฐม",
      phone: "02-101-0008",
      email: "branch.gi08@goldintegrate.co.th",
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "comp-gi09",
      code: "GI09",
      name: "บริษัท โกลด์ อินทิเกรท วิภาวดี จำกัด",
      taxId: "0105558012354",
      address: "ถนนวิภาวดีรังสิต แขวงจอมพล เขตจตุจักร กรุงเทพฯ",
      phone: "02-101-0009",
      email: "branch.gi09@goldintegrate.co.th",
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "comp-gi10",
      code: "GI10",
      name: "บริษัท โกลด์ อินทิเกรท พิบูลสงคราม จำกัด",
      taxId: "0105558012355",
      address: "ถนนพิบูลสงคราม ต.สวนใหญ่ อ.เมือง นนทบุรี",
      phone: "02-101-0010",
      email: "branch.gi10@goldintegrate.co.th",
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "comp-gi11",
      code: "GI11",
      name: "บริษัท โกลด์ อินทิเกรท อยุธยา จำกัด",
      taxId: "0105558012356",
      address: "ถนนโรจนะ ต.คลองสวนพลู อ.พระนครศรีอยุธยา พระนครศรีอยุธยา",
      phone: "035-101-0011",
      email: "branch.gi11@goldintegrate.co.th",
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "comp-gi12",
      code: "GI12",
      name: "บริษัท โกลด์ อินทิเกรท เชียงใหม่ จำกัด",
      taxId: "0105558012357",
      address: "ถนนซุปเปอร์ไฮเวย์ เชียงใหม่-ลำปาง ต.ช้างเผือก อ.เมือง เชียงใหม่",
      phone: "053-101-0012",
      email: "branch.gi12@goldintegrate.co.th",
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],

  departments: [
    { id: "dept-gi-ops", companyId: "comp-gi", code: "OPS", name: "ฝ่ายปฏิบัติการและบริการ (Operations & Services)", active: true },
    { id: "dept-gi-hr", companyId: "comp-gi", code: "HR", name: "ฝ่ายทรัพยากรบุคคล (Human Resources)", active: true },
    { id: "dept-gi-sales", companyId: "comp-gi", code: "SALES", name: "ฝ่ายขายและบูธกิจกรรม (Sales & Booth Operations)", active: true },
    { id: "dept-ev7-tech", companyId: "comp-gi06", code: "TECH", name: "ฝ่ายเทคโนโลยียานยนต์ไฟฟ้า (EV Technology & Systems)", active: true },
    { id: "dept-ev7-ops", companyId: "comp-gi06", code: "OPS", name: "ฝ่ายปฏิบัติการและศูนย์บริการ EV (EV Service Operations)", active: true },
    { id: "dept-gi01-branch", companyId: "comp-gi01", code: "BRANCH", name: "ฝ่ายปฏิบัติการสาขากาญจนาภิเษก – บางแค", active: true },
  ],

  locations: [
    {
      id: "loc-gi-hq",
      companyId: "comp-gi",
      locationCode: "LOC-GI-HQ",
      locationName: "สำนักงานใหญ่ โกลด์ อินทิเกรท",
      locationType: LocationType.OFFICE,
      address: "อาคารโกลด์ อินทิเกรท กรุงเทพฯ",
      latitude: 13.736717,
      longitude: 100.523186,
      allowedRadiusMeters: 150,
      active: true,
    },
    {
      id: "loc-ev7-hq",
      companyId: "comp-gi06",
      locationCode: "LOC-EV7-HQ",
      locationName: "สำนักงานใหญ่ EV7 Co.,Ltd.",
      locationType: LocationType.OFFICE,
      address: "อาคารอีวี เซเว่น ทาวเวอร์ สุขุมวิท กรุงเทพฯ",
      latitude: 13.7225,
      longitude: 100.5289,
      allowedRadiusMeters: 150,
      active: true,
    },
    {
      id: "loc-gi01",
      companyId: "comp-gi01",
      locationCode: "LOC-GI01",
      locationName: "สาขากาญจนาภิเษก – บางแค",
      locationType: LocationType.OFFICE,
      address: "ถนนกาญจนาภิเษก แขวงบางแคเหนือ เขตบางแค กรุงเทพฯ",
      latitude: 13.7051,
      longitude: 100.4074,
      allowedRadiusMeters: 150,
      active: true,
    },
    {
      id: "booth-mega",
      companyId: null,
      locationCode: "BOOTH-MEGA",
      locationName: "บูธโปรโมชั่น เมกา บางนา (ชั้น 1 โซนแฟชั่น)",
      locationType: LocationType.BOOTH,
      address: "39 หมู่ 6 ถนนบางนา-ตราด กม.8 ต.บางแก้ว อ.บางพลี สมุทรปราการ",
      latitude: 13.6473,
      longitude: 100.6806,
      allowedRadiusMeters: 100,
      active: true,
    },
    {
      id: "booth-cw",
      companyId: null,
      locationCode: "BOOTH-CW",
      locationName: "บูธเปิดตัวสินค้า เซ็นทรัลเวิลด์ (ชั้น 2 เอเทรียม)",
      locationType: LocationType.BOOTH,
      address: "999/9 ถนนพระราม 1 แขวงปทุมวัน เขตปทุมวัน กรุงเทพฯ",
      latitude: 13.7466,
      longitude: 100.5393,
      allowedRadiusMeters: 120,
      active: true,
    },
  ],

  shifts: [
    {
      id: "shift-office",
      companyId: null,
      shiftCode: "SHIFT-01-OFFICE",
      shiftName: "กะทำงานมาตรฐานสำนักงาน (09:00 - 18:00)",
      startTime: "09:00",
      endTime: "18:00",
      gracePeriodMinutes: 15,
      active: true,
    },
    {
      id: "shift-booth1",
      companyId: null,
      shiftCode: "SHIFT-02-BOOTH1",
      shiftName: "กะบูธ/ห้างสรรพสินค้า เช้า (10:00 - 19:00)",
      startTime: "10:00",
      endTime: "19:00",
      gracePeriodMinutes: 15,
      active: true,
    },
    {
      id: "shift-booth2",
      companyId: null,
      shiftCode: "SHIFT-03-BOOTH2",
      shiftName: "กะบูธ/ห้างสรรพสินค้า บ่าย (11:00 - 20:00)",
      startTime: "11:00",
      endTime: "20:00",
      gracePeriodMinutes: 15,
      active: true,
    },
    {
      id: "shift-early",
      companyId: null,
      shiftCode: "SHIFT-04-EARLY",
      shiftName: "กะเช้าพิเศษ ปฏิบัติการ/ศูนย์บริการ (08:00 - 17:00)",
      startTime: "08:00",
      endTime: "17:00",
      gracePeriodMinutes: 15,
      active: true,
    },
  ],

  users: [
    {
      id: "user-superadmin",
      email: "superadmin@hr.internal",
      passwordHash: hashedDefaultPassword,
      name: "สมชาย ยิ่งยง (Super Admin)",
      role: Role.SUPER_ADMIN,
      companyId: null,
      employeeId: null,
      active: true,
    },
    {
      id: "user-hr-gi",
      email: "hr.gi@hr.internal",
      passwordHash: hashedDefaultPassword,
      name: "วิภาดา สดใส (HR Admin GI)",
      role: Role.HR_ADMIN,
      companyId: "comp-gi",
      employeeId: null,
      active: true,
    },
    {
      id: "user-hr-ev7",
      email: "hr.ev7@hr.internal",
      passwordHash: hashedDefaultPassword,
      name: "กิตติพงษ์ สว่างจิต (HR Admin EV7)",
      role: Role.HR_ADMIN,
      companyId: "comp-gi06",
      employeeId: null,
      active: true,
    },
    {
      id: "user-emp1",
      email: "emp1@hr.internal",
      passwordHash: hashedDefaultPassword,
      name: "นภัสสร รัตนโชติ",
      role: Role.EMPLOYEE,
      companyId: "comp-gi",
      employeeId: "emp-gi-001",
      active: true,
    },
    {
      id: "user-emp2",
      email: "emp2@hr.internal",
      passwordHash: hashedDefaultPassword,
      name: "ธนากร เจริญทรัพย์",
      role: Role.EMPLOYEE,
      companyId: "comp-gi01",
      employeeId: "emp-gi01-001",
      active: true,
    },
    {
      id: "user-emp3",
      email: "emp3@hr.internal",
      passwordHash: hashedDefaultPassword,
      name: "ชลธิชา แก้วมณี",
      role: Role.EMPLOYEE,
      companyId: "comp-gi06",
      employeeId: "emp-ev7-001",
      active: true,
    },
  ],

  employees: [
    {
      id: "emp-gi-001",
      employeeId: "EMP-GI-001",
      firstName: "นภัสสร",
      lastName: "รัตนโชติ",
      email: "emp1@hr.internal",
      phone: "081-111-2233",
      companyId: "comp-gi",
      departmentId: "dept-gi-sales",
      position: "เจ้าหน้าที่ประจำบูธและฝ่ายขายอาวุโส (Senior Booth Sales)",
      employmentStartDate: new Date("2024-01-15"),
      resignationDate: null,
      employmentStatus: EmploymentStatus.ACTIVE,
      defaultLocationId: "loc-gi-hq",
      defaultShiftId: "shift-office",
      avatarUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "emp-gi01-001",
      employeeId: "EMP-GI01-001",
      firstName: "ธนากร",
      lastName: "เจริญทรัพย์",
      email: "emp2@hr.internal",
      phone: "082-222-3344",
      companyId: "comp-gi01",
      departmentId: "dept-gi01-branch",
      position: "เจ้าหน้าที่ปฏิบัติการสาขา (Branch Officer)",
      employmentStartDate: new Date("2024-03-01"),
      resignationDate: null,
      employmentStatus: EmploymentStatus.ACTIVE,
      defaultLocationId: "loc-gi01",
      defaultShiftId: "shift-early",
      avatarUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "emp-ev7-001",
      employeeId: "EMP-EV7-001",
      firstName: "ชลธิชา",
      lastName: "แก้วมณี",
      email: "emp3@hr.internal",
      phone: "083-333-4455",
      companyId: "comp-gi06",
      departmentId: "dept-ev7-tech",
      position: "วิศวกรระบบและเทคโนโลยี EV (EV Solutions Engineer)",
      employmentStartDate: new Date("2023-08-01"),
      resignationDate: null,
      employmentStatus: EmploymentStatus.ACTIVE,
      defaultLocationId: "loc-ev7-hq",
      defaultShiftId: "shift-office",
      avatarUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],

  assignments: [
    {
      id: "assign-1",
      employeeId: "emp-gi-001",
      date: getBangkokToday(),
      workLocationId: "booth-cw",
      shiftTemplateId: "shift-booth2", // 11:00 - 20:00
      assignmentType: AssignmentType.BOOTH,
      notes: "มอบหมายปฏิบัติงานพิเศษ ณ บูธเซ็นทรัลเวิลด์ กะบ่าย (11:00 - 20:00)",
      createdById: "user-hr-gi",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],

  workSchedules: [] as Array<{
    id: string;
    employeeId: string;
    date: Date;
    shiftTemplateId?: string | null;
    isRestDay: boolean;
    notes?: string | null;
  }>,

  attendanceSummaries: [] as Array<{
    id: string;
    employeeId: string;
    companyId: string;
    date: Date;
    scheduledShiftId?: string | null;
    scheduledLocationId?: string | null;
    effectiveStartTime: string;
    effectiveEndTime: string;
    checkInTime?: Date | null;
    checkOutTime?: Date | null;
    checkInPhotoUrl?: string | null;
    checkOutPhotoUrl?: string | null;
    checkInDistanceMeters?: number | null;
    checkOutDistanceMeters?: number | null;
    checkInLatitude?: number | null;
    checkInLongitude?: number | null;
    checkOutLatitude?: number | null;
    checkOutLongitude?: number | null;
    attendanceStatus: AttendanceStatus;
    isLate: boolean;
    lateMinutes: number;
    isEarlyLeave: boolean;
    earlyLeaveMinutes: number;
    totalWorkMinutes: number;
    isCorrected: boolean;
    correctionReason?: string | null;
    correctedById?: string | null;
    correctedAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }>,

  attendanceEvents: [] as Array<{
    id: string;
    attendanceDailySummaryId?: string | null;
    employeeId: string;
    eventType: EventType;
    eventTime: Date;
    latitude: number;
    longitude: number;
    accuracy?: number | null;
    distanceMeters: number;
    isWithinRadius: boolean;
    photoUrl: string;
    deviceInfo?: string | null;
    notes?: string | null;
    createdAt: Date;
  }>,

  adjustments: [] as Array<{
    id: string;
    dailySummaryId: string;
    employeeId: string;
    adjustedById: string;
    previousCheckIn?: Date | null;
    newCheckIn?: Date | null;
    previousCheckOut?: Date | null;
    newCheckOut?: Date | null;
    previousStatus: AttendanceStatus;
    newStatus: AttendanceStatus;
    reason: string;
    createdAt: Date;
  }>,

  holidays: [
    { id: "h1", holidayDate: new Date("2026-01-01"), name: "วันขึ้นปีใหม่ (New Year's Day)", description: "วันหยุดราชการและวันหยุดตามประเพณี" },
    { id: "h2", holidayDate: new Date("2026-01-02"), name: "วันหยุดพิเศษช่วงปีใหม่", description: "วันหยุดราชการกรณีพิเศษตามมติ ครม." },
    { id: "h3", holidayDate: new Date("2026-03-03"), name: "วันมาฆบูชา (Makha Bucha Day)", description: "วันสำคัญทางพระพุทธศาสนา" },
    { id: "h4", holidayDate: new Date("2026-04-06"), name: "วันจักรี (Chakri Memorial Day)", description: "วันพระบาทสมเด็จพระพุทธยอดฟ้าจุฬาโลกมหาราช" },
    { id: "h5", holidayDate: new Date("2026-04-13"), name: "วันสงกรานต์ (Songkran Festival)", description: "วันมหาสงกรานต์" },
    { id: "h6", holidayDate: new Date("2026-04-14"), name: "วันสงกรานต์ (Songkran Festival)", description: "วันเนา / วันครอบครัว" },
    { id: "h7", holidayDate: new Date("2026-04-15"), name: "วันสงกรานต์ (Songkran Festival)", description: "วันเถลิงศก" },
    { id: "h8", holidayDate: new Date("2026-05-01"), name: "วันแรงงานแห่งชาติ (Labour Day)", description: "วันหยุดตามประเพณีของผู้ใช้แรงงาน" },
    { id: "h9", holidayDate: new Date("2026-05-04"), name: "วันฉัตรมงคล (Coronation Day)", description: "วันพระราชพิธีฉัตรมงคล" },
    { id: "h10", holidayDate: new Date("2026-05-31"), name: "วันวิสาขบูชา (Visakha Bucha Day)", description: "วันสำคัญสากลทางพระพุทธศาสนา" },
    { id: "h11", holidayDate: new Date("2026-06-01"), name: "วันหยุดชดเชยวันวิสาขบูชา", description: "วันหยุดชดเชยวันวิสาขบูชา" },
    { id: "h12", holidayDate: new Date("2026-06-03"), name: "วันเฉลิมพระชนมพรรษา สมเด็จพระนางเจ้าฯ พระบรมราชินี", description: "วันเฉลิมพระชนมพรรษา สมเด็จพระนางเจ้าสุทิดาฯ" },
    { id: "h13", holidayDate: new Date("2026-07-28"), name: "วันเฉลิมพระชนมพรรษา พระบาทสมเด็จพระเจ้าอยู่หัว ร.10", description: "วันเฉลิมพระชนมพรรษา พระบาทสมเด็จพระวชิรเกล้าเจ้าอยู่หัว" },
    { id: "h14", holidayDate: new Date("2026-07-29"), name: "วันอาสาฬหบูชา (Asahna Bucha Day)", description: "วันสำคัญทางพระพุทธศาสนา" },
    { id: "h15", holidayDate: new Date("2026-07-30"), name: "วันเข้าพรรษา (Buddhist Lent Day)", description: "วันเริ่มต้นเทศกาลเข้าพรรษา" },
    { id: "h16", holidayDate: new Date("2026-08-12"), name: "วันแม่แห่งชาติ (Mother's Day)", description: "วันเฉลิมพระชนมพรรษา สมเด็จพระบรมราชชนนีพันปีหลวง" },
    { id: "h17", holidayDate: new Date("2026-10-13"), name: "วันนวมินทรมหาราช (King Rama IX Memorial Day)", description: "วันคล้ายวันสวรรคต พระบาทสมเด็จพระบรมชนกาธิเบศร มหาภูมิพลอดุลยเดชมหาราชฯ" },
    { id: "h18", holidayDate: new Date("2026-10-23"), name: "วันปิยมหาราช (Chulalongkorn Day)", description: "วันคล้ายวันสวรรคต พระบาทสมเด็จพระจุลจอมเกล้าเจ้าอยู่หัว" },
    { id: "h19", holidayDate: new Date("2026-12-05"), name: "วันพ่อแห่งชาติ / วันชาติ (Father's Day / National Day)", description: "วันคล้ายวันพระบรมราชสมภพ พระบาทสมเด็จพระบรมชนกาธิเบศร มหาภูมิพลอดุลยเดชมหาราชฯ" },
    { id: "h20", holidayDate: new Date("2026-12-07"), name: "วันหยุดชดเชยวันคล้ายวันพระบรมราชสมภพ ร.9", description: "ชดเชยวันชาติและวันพ่อแห่งชาติ" },
    { id: "h21", holidayDate: new Date("2026-12-10"), name: "วันรัฐธรรมนูญ (Constitution Day)", description: "วันพระราชทานรัฐธรรมนูญแห่งราชอาณาจักรไทย" },
    { id: "h22", holidayDate: new Date("2026-12-31"), name: "วันสิ้นปี (New Year's Eve)", description: "วันสิ้นปีตามปฏิทินสากล" },
  ],
};

// Data service operations with DB-first pattern and seamless fallback
export const DataService = {
  // --- Companies ---
  async getCompanies() {
    if (await isDatabaseConnected()) {
      return prisma.company.findMany({ where: { active: true }, orderBy: { code: "asc" } });
    }
    return memoryStore.companies;
  },

  async getCompanyById(id: string) {
    if (await isDatabaseConnected()) {
      return prisma.company.findUnique({ where: { id } });
    }
    return memoryStore.companies.find((c) => c.id === id) || null;
  },

  // --- Departments ---
  async getDepartments(companyId?: string) {
    if (await isDatabaseConnected()) {
      return prisma.department.findMany({
        where: companyId ? { companyId, active: true } : { active: true },
        include: { company: true },
        orderBy: { code: "asc" },
      });
    }
    return memoryStore.departments
      .filter((d) => (!companyId ? true : d.companyId === companyId))
      .map((d) => ({
        ...d,
        company: memoryStore.companies.find((c) => c.id === d.companyId),
      }));
  },

  // --- Users & Auth ---
  async findUserByEmail(email: string) {
    if (await isDatabaseConnected()) {
      return prisma.user.findUnique({
        where: { email },
        include: { company: true, employee: true },
      });
    }
    const user = memoryStore.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return null;
    const company = user.companyId ? memoryStore.companies.find((c) => c.id === user.companyId) : null;
    const employee = user.employeeId ? memoryStore.employees.find((e) => e.id === user.employeeId) : null;
    return { ...user, company, employee };
  },

  // --- Locations ---
  async getLocations(companyId?: string) {
    if (await isDatabaseConnected()) {
      return prisma.workLocation.findMany({
        where: companyId ? { OR: [{ companyId }, { companyId: null }] } : undefined,
        include: { company: true },
        orderBy: { locationCode: "asc" },
      });
    }
    return memoryStore.locations
      .filter((l) => (!companyId ? true : l.companyId === companyId || l.companyId === null))
      .map((l) => ({
        ...l,
        company: l.companyId ? memoryStore.companies.find((c) => c.id === l.companyId) : null,
      }));
  },

  async getLocationById(id: string) {
    if (await isDatabaseConnected()) {
      return prisma.workLocation.findUnique({ where: { id }, include: { company: true } });
    }
    const loc = memoryStore.locations.find((l) => l.id === id);
    if (!loc) return null;
    return {
      ...loc,
      company: loc.companyId ? memoryStore.companies.find((c) => c.id === loc.companyId) : null,
    };
  },

  async saveLocation(data: {
    id?: string;
    locationCode: string;
    locationName: string;
    companyId?: string | null;
    locationType: LocationType;
    address?: string | null;
    latitude: number;
    longitude: number;
    allowedRadiusMeters: number;
    active: boolean;
  }) {
    if (await isDatabaseConnected()) {
      if (data.id) {
        return prisma.workLocation.update({ where: { id: data.id }, data });
      }
      return prisma.workLocation.create({ data });
    }
    if (data.id) {
      const idx = memoryStore.locations.findIndex((l) => l.id === data.id);
      if (idx !== -1) {
        memoryStore.locations[idx] = { ...memoryStore.locations[idx], ...data };
        return memoryStore.locations[idx];
      }
    }
    const newLoc = { ...data, id: "loc-" + Date.now(), companyId: data.companyId || null, address: data.address || null };
    memoryStore.locations.push(newLoc);
    return newLoc;
  },

  // --- Shifts ---
  async getShifts(companyId?: string) {
    if (await isDatabaseConnected()) {
      return prisma.shiftTemplate.findMany({
        where: companyId ? { OR: [{ companyId }, { companyId: null }] } : undefined,
        include: { company: true },
        orderBy: { shiftCode: "asc" },
      });
    }
    return memoryStore.shifts.map((s) => ({
      ...s,
      company: s.companyId ? memoryStore.companies.find((c) => c.id === s.companyId) : null,
    }));
  },

  async getShiftById(id: string) {
    if (await isDatabaseConnected()) {
      return prisma.shiftTemplate.findUnique({ where: { id } });
    }
    return memoryStore.shifts.find((s) => s.id === id) || null;
  },

  async saveShift(data: {
    id?: string;
    shiftCode: string;
    shiftName: string;
    companyId?: string | null;
    startTime: string;
    endTime: string;
    gracePeriodMinutes: number;
    active: boolean;
  }) {
    if (await isDatabaseConnected()) {
      if (data.id) {
        return prisma.shiftTemplate.update({ where: { id: data.id }, data });
      }
      return prisma.shiftTemplate.create({ data });
    }
    if (data.id) {
      const idx = memoryStore.shifts.findIndex((s) => s.id === data.id);
      if (idx !== -1) {
        memoryStore.shifts[idx] = { ...memoryStore.shifts[idx], ...data };
        return memoryStore.shifts[idx];
      }
    }
    const newShift = { ...data, id: "shift-" + Date.now(), companyId: data.companyId || null };
    memoryStore.shifts.push(newShift);
    return newShift;
  },

  // --- Employees ---
  async getEmployees({
    companyId,
    departmentId,
    status,
    search,
  }: {
    companyId?: string;
    departmentId?: string;
    status?: string;
    search?: string;
  } = {}) {
    if (await isDatabaseConnected()) {
      return prisma.employee.findMany({
        where: {
          companyId: companyId || undefined,
          departmentId: departmentId || undefined,
          employmentStatus: status ? (status as EmploymentStatus) : undefined,
          OR: search
            ? [
                { employeeId: { contains: search, mode: "insensitive" } },
                { firstName: { contains: search, mode: "insensitive" } },
                { lastName: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
                { position: { contains: search, mode: "insensitive" } },
              ]
            : undefined,
        },
        include: {
          company: true,
          department: true,
          defaultShift: true,
          defaultLocation: true,
        },
        orderBy: { employeeId: "asc" },
      });
    }

    return memoryStore.employees
      .filter((e) => {
        if (companyId && e.companyId !== companyId) return false;
        if (departmentId && e.departmentId !== departmentId) return false;
        if (status && e.employmentStatus !== status) return false;
        if (search) {
          const s = search.toLowerCase();
          const match =
            e.employeeId.toLowerCase().includes(s) ||
            e.firstName.toLowerCase().includes(s) ||
            e.lastName.toLowerCase().includes(s) ||
            (e.email && e.email.toLowerCase().includes(s)) ||
            e.position.toLowerCase().includes(s);
          if (!match) return false;
        }
        return true;
      })
      .map((e) => ({
        ...e,
        company: memoryStore.companies.find((c) => c.id === e.companyId),
        department: memoryStore.departments.find((d) => d.id === e.departmentId),
        defaultShift: memoryStore.shifts.find((s) => s.id === e.defaultShiftId),
        defaultLocation: memoryStore.locations.find((l) => l.id === e.defaultLocationId),
      }));
  },

  async getEmployeeById(id: string) {
    if (await isDatabaseConnected()) {
      return prisma.employee.findUnique({
        where: { id },
        include: {
          company: true,
          department: true,
          defaultShift: true,
          defaultLocation: true,
          locationAssignments: {
            include: { workLocation: true, shiftTemplate: true },
            orderBy: { date: "desc" },
            take: 10,
          },
          attendanceSummaries: {
            orderBy: { date: "desc" },
            take: 30,
          },
        },
      });
    }

    const emp = memoryStore.employees.find((e) => e.id === id);
    if (!emp) return null;
    return {
      ...emp,
      company: memoryStore.companies.find((c) => c.id === emp.companyId),
      department: memoryStore.departments.find((d) => d.id === emp.departmentId),
      defaultShift: memoryStore.shifts.find((s) => s.id === emp.defaultShiftId),
      defaultLocation: memoryStore.locations.find((l) => l.id === emp.defaultLocationId),
      locationAssignments: memoryStore.assignments
        .filter((a) => a.employeeId === id)
        .map((a) => ({
          ...a,
          workLocation: memoryStore.locations.find((l) => l.id === a.workLocationId),
          shiftTemplate: memoryStore.shifts.find((s) => s.id === a.shiftTemplateId),
        })),
      attendanceSummaries: memoryStore.attendanceSummaries.filter((s) => s.employeeId === id),
    };
  },

  async saveEmployee(data: {
    id?: string;
    employeeId: string;
    firstName: string;
    lastName: string;
    companyId: string;
    departmentId: string;
    position: string;
    email?: string | null;
    phone?: string | null;
    employmentStartDate: Date;
    resignationDate?: Date | null;
    employmentStatus: EmploymentStatus;
    defaultShiftId?: string | null;
    defaultLocationId?: string | null;
  }) {
    if (await isDatabaseConnected()) {
      if (data.id) {
        return prisma.employee.update({ where: { id: data.id }, data });
      }
      return prisma.employee.create({ data });
    }

    if (data.id) {
      const idx = memoryStore.employees.findIndex((e) => e.id === data.id);
      if (idx !== -1) {
        memoryStore.employees[idx] = {
          ...memoryStore.employees[idx],
          ...data,
          updatedAt: new Date(),
        };
        return memoryStore.employees[idx];
      }
    }

    const newEmp = {
      ...data,
      id: "emp-" + Date.now(),
      createdAt: new Date(),
      updatedAt: new Date(),
      avatarUrl: null,
      email: data.email || null,
      phone: data.phone || null,
      resignationDate: data.resignationDate || null,
      defaultShiftId: data.defaultShiftId || null,
      defaultLocationId: data.defaultLocationId || null,
    };
    memoryStore.employees.push(newEmp);
    return newEmp;
  },

  // --- Assignments (Booths / Locations) ---
  async getAssignments({
    companyId,
    date,
    employeeId,
  }: {
    companyId?: string;
    date?: Date;
    employeeId?: string;
  } = {}) {
    const dateFormatted = date ? formatBangkokDate(date) : undefined;

    if (await isDatabaseConnected()) {
      return prisma.locationAssignment.findMany({
        where: {
          employeeId: employeeId || undefined,
          date: date || undefined,
          employee: companyId ? { companyId } : undefined,
        },
        include: {
          employee: { include: { company: true, department: true } },
          workLocation: true,
          shiftTemplate: true,
        },
        orderBy: { date: "asc" },
      });
    }

    return memoryStore.assignments
      .filter((a) => {
        if (employeeId && a.employeeId !== employeeId) return false;
        if (dateFormatted && formatBangkokDate(a.date) !== dateFormatted) return false;
        if (companyId) {
          const emp = memoryStore.employees.find((e) => e.id === a.employeeId);
          if (emp?.companyId !== companyId) return false;
        }
        return true;
      })
      .map((a) => {
        const emp = memoryStore.employees.find((e) => e.id === a.employeeId);
        return {
          ...a,
          employee: emp
            ? {
                ...emp,
                company: memoryStore.companies.find((c) => c.id === emp.companyId),
                department: memoryStore.departments.find((d) => d.id === emp.departmentId),
              }
            : null,
          workLocation: memoryStore.locations.find((l) => l.id === a.workLocationId),
          shiftTemplate: memoryStore.shifts.find((s) => s.id === a.shiftTemplateId),
        };
      });
  },

  /**
   * Creates an assignment for an employee on a date.
   * An employee can have only ONE assignment per day: any existing assignment
   * for the same employee + date is replaced. Returns the new assignment and
   * how many previous assignments were replaced.
   */
  async createAssignment(data: {
    employeeId: string;
    date: Date;
    workLocationId: string;
    shiftTemplateId?: string | null;
    assignmentType: AssignmentType;
    notes?: string | null;
    createdById?: string | null;
  }) {
    if (await isDatabaseConnected()) {
      const [deleted, assignment] = await prisma.$transaction([
        prisma.locationAssignment.deleteMany({
          where: { employeeId: data.employeeId, date: data.date },
        }),
        prisma.locationAssignment.create({ data }),
      ]);
      return { assignment, replacedCount: deleted.count };
    }

    const dateFormatted = formatBangkokDate(data.date);
    const before = memoryStore.assignments.length;
    memoryStore.assignments = memoryStore.assignments.filter(
      (a) => !(a.employeeId === data.employeeId && formatBangkokDate(a.date) === dateFormatted)
    );
    const replacedCount = before - memoryStore.assignments.length;

    const newAssign = {
      ...data,
      id: "assign-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
      shiftTemplateId: data.shiftTemplateId || null,
      notes: data.notes || null,
      createdById: data.createdById || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memoryStore.assignments.push(newAssign);
    return { assignment: newAssign, replacedCount };
  },

  async deleteAssignment(id: string) {
    if (await isDatabaseConnected()) {
      return prisma.locationAssignment.delete({ where: { id } });
    }
    const idx = memoryStore.assignments.findIndex((a) => a.id === id);
    if (idx !== -1) {
      memoryStore.assignments.splice(idx, 1);
      return true;
    }
    return false;
  },

  // --- Effective Shift and Location Calculation for Employee on Given Date ---
  async getEffectiveSchedule(employeeId: string, date: Date) {
    const dateFormatted = formatBangkokDate(date);

    // 1. Check Booth/Location assignment first (newest wins if duplicates exist)
    let assignment = null;
    if (await isDatabaseConnected()) {
      assignment = await prisma.locationAssignment.findFirst({
        where: { employeeId, date },
        include: { workLocation: true, shiftTemplate: true },
        orderBy: { createdAt: "desc" },
      });
    } else {
      const match = memoryStore.assignments
        .filter(
          (a) => a.employeeId === employeeId && formatBangkokDate(a.date) === dateFormatted
        )
        .at(-1);
      if (match) {
        assignment = {
          ...match,
          workLocation: memoryStore.locations.find((l) => l.id === match.workLocationId)!,
          shiftTemplate: memoryStore.shifts.find((s) => s.id === match.shiftTemplateId) || null,
        };
      }
    }

    // 2. Employee details
    let emp: any = null;
    if (await isDatabaseConnected()) {
      emp = await prisma.employee.findUnique({
        where: { id: employeeId },
        include: { defaultLocation: true, defaultShift: true },
      });
    } else {
      const found = memoryStore.employees.find((e) => e.id === employeeId);
      if (found) {
        emp = {
          ...found,
          defaultLocation: memoryStore.locations.find((l) => l.id === found.defaultLocationId) || null,
          defaultShift: memoryStore.shifts.find((s) => s.id === found.defaultShiftId) || null,
        };
      }
    }

    if (!emp) throw new Error("Employee not found");

    // Location priority: assignment > defaultLocation
    const effectiveLocation = assignment?.workLocation || emp.defaultLocation;

    // Shift priority: assignment shift > defaultShift > default fallback
    const effectiveShift =
      assignment?.shiftTemplate ||
      emp.defaultShift || {
        id: "default",
        shiftCode: "DEFAULT",
        shiftName: "กะมาตรฐาน (09:00 - 18:00)",
        startTime: "09:00",
        endTime: "18:00",
        gracePeriodMinutes: 15,
      };

    return {
      employee: emp,
      assignment,
      isBooth: assignment?.assignmentType === AssignmentType.BOOTH,
      effectiveLocation,
      effectiveShift,
    };
  },

  // --- Attendance Records & Summaries ---
  async getDailyAttendance({
    companyId,
    date,
    departmentId,
    status,
    search,
  }: {
    companyId?: string;
    date: Date;
    departmentId?: string;
    status?: string;
    search?: string;
  }) {
    const dateFormatted = formatBangkokDate(date);

    if (await isDatabaseConnected()) {
      return prisma.attendanceDailySummary.findMany({
        where: {
          date,
          companyId: companyId || undefined,
          attendanceStatus: status ? (status as AttendanceStatus) : undefined,
          employee: {
            departmentId: departmentId || undefined,
            OR: search
              ? [
                  { employeeId: { contains: search, mode: "insensitive" } },
                  { firstName: { contains: search, mode: "insensitive" } },
                  { lastName: { contains: search, mode: "insensitive" } },
                ]
              : undefined,
          },
        },
        include: {
          employee: { include: { company: true, department: true } },
          scheduledLocation: true,
          scheduledShift: true,
        },
        orderBy: { employee: { employeeId: "asc" } },
      });
    }

    return memoryStore.attendanceSummaries
      .filter((s) => {
        if (formatBangkokDate(s.date) !== dateFormatted) return false;
        if (companyId && s.companyId !== companyId) return false;
        if (status && s.attendanceStatus !== status) return false;

        const emp = memoryStore.employees.find((e) => e.id === s.employeeId);
        if (!emp) return false;
        if (departmentId && emp.departmentId !== departmentId) return false;
        if (search) {
          const q = search.toLowerCase();
          const match =
            emp.employeeId.toLowerCase().includes(q) ||
            emp.firstName.toLowerCase().includes(q) ||
            emp.lastName.toLowerCase().includes(q);
          if (!match) return false;
        }
        return true;
      })
      .map((s) => {
        const emp = memoryStore.employees.find((e) => e.id === s.employeeId)!;
        return {
          ...s,
          employee: {
            ...emp,
            company: memoryStore.companies.find((c) => c.id === emp.companyId),
            department: memoryStore.departments.find((d) => d.id === emp.departmentId),
          },
          scheduledLocation: memoryStore.locations.find((l) => l.id === s.scheduledLocationId),
          scheduledShift: memoryStore.shifts.find((sh) => sh.id === s.scheduledShiftId),
        };
      });
  },

  async getEmployeeAttendanceHistory(employeeId: string, limit = 60) {
    if (await isDatabaseConnected()) {
      return prisma.attendanceDailySummary.findMany({
        where: { employeeId },
        include: { scheduledLocation: true, scheduledShift: true },
        orderBy: { date: "desc" },
        take: limit,
      });
    }

    return memoryStore.attendanceSummaries
      .filter((s) => s.employeeId === employeeId)
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, limit)
      .map((s) => ({
        ...s,
        scheduledLocation: memoryStore.locations.find((l) => l.id === s.scheduledLocationId),
        scheduledShift: memoryStore.shifts.find((sh) => sh.id === s.scheduledShiftId),
      }));
  },

  async recordCheckIn({
    employeeId,
    latitude,
    longitude,
    accuracy,
    photoUrl,
    deviceInfo,
  }: {
    employeeId: string;
    latitude: number;
    longitude: number;
    accuracy?: number;
    photoUrl: string;
    deviceInfo?: string;
  }) {
    const today = getBangkokToday();
    const nowUtc = new Date();

    // 1. Resolve effective schedule
    const { employee, effectiveLocation, effectiveShift } = await this.getEffectiveSchedule(
      employeeId,
      today
    );

    if (!effectiveLocation) {
      throw new Error("ไม่พบสถานที่ปฏิบัติงานที่กำหนด กรุณาติดต่อฝ่ายทรัพยากรบุคคล");
    }

    // 2. Validate GPS Radius
    const { isWithin, distanceMeters } = isWithinRadius(
      latitude,
      longitude,
      effectiveLocation.latitude,
      effectiveLocation.longitude,
      effectiveLocation.allowedRadiusMeters
    );

    if (!isWithin) {
      throw new Error(
        `คุณอยู่นอกพื้นที่ที่กำหนด: ระยะห่าง ${Math.round(distanceMeters)} เมตร (รัศมีที่อนุญาตไม่เกิน ${
          effectiveLocation.allowedRadiusMeters
        } เมตร)`
      );
    }

    // 3. Evaluate Lateness
    const evalResult = evaluateAttendance({
      checkInTime: nowUtc,
      shiftStartTime: effectiveShift.startTime,
      shiftEndTime: effectiveShift.endTime,
      gracePeriodMinutes: effectiveShift.gracePeriodMinutes,
      dateMidnight: today,
    });

    if (await isDatabaseConnected()) {
      // Upsert summary
      const summary = await prisma.attendanceDailySummary.upsert({
        where: {
          employeeId_date: {
            employeeId,
            date: today,
          },
        },
        update: {
          checkInTime: nowUtc,
          checkInPhotoUrl: photoUrl,
          checkInLatitude: latitude,
          checkInLongitude: longitude,
          checkInDistanceMeters: distanceMeters,
          attendanceStatus: evalResult.calculatedStatus,
          isLate: evalResult.isLate,
          lateMinutes: evalResult.lateMinutes,
        },
        create: {
          employeeId,
          companyId: employee.companyId,
          date: today,
          scheduledLocationId: effectiveLocation.id,
          scheduledShiftId: effectiveShift.id,
          effectiveStartTime: effectiveShift.startTime,
          effectiveEndTime: effectiveShift.endTime,
          checkInTime: nowUtc,
          checkInPhotoUrl: photoUrl,
          checkInLatitude: latitude,
          checkInLongitude: longitude,
          checkInDistanceMeters: distanceMeters,
          attendanceStatus: evalResult.calculatedStatus,
          isLate: evalResult.isLate,
          lateMinutes: evalResult.lateMinutes,
        },
      });

      // Log raw event
      await prisma.attendanceEvent.create({
        data: {
          attendanceDailySummaryId: summary.id,
          employeeId,
          eventType: EventType.CHECK_IN,
          eventTime: nowUtc,
          latitude,
          longitude,
          accuracy: accuracy || null,
          distanceMeters,
          isWithinRadius: isWithin,
          photoUrl,
          deviceInfo: deviceInfo || null,
        },
      });

      return { summary, distanceMeters, isLate: evalResult.isLate, lateMinutes: evalResult.lateMinutes };
    }

    // In-memory fallback
    let summary = memoryStore.attendanceSummaries.find(
      (s) => s.employeeId === employeeId && formatBangkokDate(s.date) === formatBangkokDate(today)
    );

    if (summary) {
      summary.checkInTime = nowUtc;
      summary.checkInPhotoUrl = photoUrl;
      summary.checkInLatitude = latitude;
      summary.checkInLongitude = longitude;
      summary.checkInDistanceMeters = distanceMeters;
      summary.attendanceStatus = evalResult.calculatedStatus;
      summary.isLate = evalResult.isLate;
      summary.lateMinutes = evalResult.lateMinutes;
      summary.updatedAt = new Date();
    } else {
      summary = {
        id: "summary-" + Date.now(),
        employeeId,
        companyId: employee.companyId,
        date: today,
        scheduledLocationId: effectiveLocation.id,
        scheduledShiftId: effectiveShift.id,
        effectiveStartTime: effectiveShift.startTime,
        effectiveEndTime: effectiveShift.endTime,
        checkInTime: nowUtc,
        checkInPhotoUrl: photoUrl,
        checkInLatitude: latitude,
        checkInLongitude: longitude,
        checkInDistanceMeters: distanceMeters,
        attendanceStatus: evalResult.calculatedStatus,
        isLate: evalResult.isLate,
        lateMinutes: evalResult.lateMinutes,
        isEarlyLeave: false,
        earlyLeaveMinutes: 0,
        totalWorkMinutes: 0,
        isCorrected: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      memoryStore.attendanceSummaries.push(summary);
    }

    memoryStore.attendanceEvents.push({
      id: "event-" + Date.now(),
      attendanceDailySummaryId: summary.id,
      employeeId,
      eventType: EventType.CHECK_IN,
      eventTime: nowUtc,
      latitude,
      longitude,
      accuracy,
      distanceMeters,
      isWithinRadius: isWithin,
      photoUrl,
      deviceInfo,
      createdAt: new Date(),
    });

    return { summary, distanceMeters, isLate: evalResult.isLate, lateMinutes: evalResult.lateMinutes };
  },

  async recordCheckOut({
    employeeId,
    latitude,
    longitude,
    accuracy,
    photoUrl,
    deviceInfo,
  }: {
    employeeId: string;
    latitude: number;
    longitude: number;
    accuracy?: number;
    photoUrl: string;
    deviceInfo?: string;
  }) {
    const today = getBangkokToday();
    const nowUtc = new Date();

    const { employee, effectiveLocation, effectiveShift } = await this.getEffectiveSchedule(
      employeeId,
      today
    );

    if (!effectiveLocation) {
      throw new Error("ไม่พบสถานที่ปฏิบัติงานที่กำหนด");
    }

    // Validate GPS radius
    const { isWithin, distanceMeters } = isWithinRadius(
      latitude,
      longitude,
      effectiveLocation.latitude,
      effectiveLocation.longitude,
      effectiveLocation.allowedRadiusMeters
    );

    if (!isWithin) {
      throw new Error(
        `คุณอยู่นอกพื้นที่ที่กำหนด: ระยะห่าง ${Math.round(distanceMeters)} เมตร (รัศมีที่อนุญาตไม่เกิน ${
          effectiveLocation.allowedRadiusMeters
        } เมตร)`
      );
    }

    let existingSummary: any = null;
    if (await isDatabaseConnected()) {
      existingSummary = await prisma.attendanceDailySummary.findUnique({
        where: { employeeId_date: { employeeId, date: today } },
      });
    } else {
      existingSummary = memoryStore.attendanceSummaries.find(
        (s) => s.employeeId === employeeId && formatBangkokDate(s.date) === formatBangkokDate(today)
      );
    }

    if (!existingSummary || !existingSummary.checkInTime) {
      throw new Error("ไม่พบข้อมูลการลงเวลาเข้างานของวันนี้ กรุณาลงเวลาเข้างานก่อนลงเวลาออก");
    }

    const evalResult = evaluateAttendance({
      checkInTime: existingSummary.checkInTime,
      checkOutTime: nowUtc,
      shiftStartTime: effectiveShift.startTime,
      shiftEndTime: effectiveShift.endTime,
      gracePeriodMinutes: effectiveShift.gracePeriodMinutes,
      dateMidnight: today,
    });

    if (await isDatabaseConnected()) {
      const summary = await prisma.attendanceDailySummary.update({
        where: { id: existingSummary.id },
        data: {
          checkOutTime: nowUtc,
          checkOutPhotoUrl: photoUrl,
          checkOutLatitude: latitude,
          checkOutLongitude: longitude,
          checkOutDistanceMeters: distanceMeters,
          isEarlyLeave: evalResult.isEarlyLeave,
          earlyLeaveMinutes: evalResult.earlyLeaveMinutes,
          totalWorkMinutes: evalResult.totalWorkMinutes,
          attendanceStatus: evalResult.calculatedStatus,
        },
      });

      await prisma.attendanceEvent.create({
        data: {
          attendanceDailySummaryId: summary.id,
          employeeId,
          eventType: EventType.CHECK_OUT,
          eventTime: nowUtc,
          latitude,
          longitude,
          accuracy: accuracy || null,
          distanceMeters,
          isWithinRadius: isWithin,
          photoUrl,
          deviceInfo: deviceInfo || null,
        },
      });

      return { summary, distanceMeters, totalWorkMinutes: evalResult.totalWorkMinutes };
    }

    existingSummary.checkOutTime = nowUtc;
    existingSummary.checkOutPhotoUrl = photoUrl;
    existingSummary.checkOutLatitude = latitude;
    existingSummary.checkOutLongitude = longitude;
    existingSummary.checkOutDistanceMeters = distanceMeters;
    existingSummary.isEarlyLeave = evalResult.isEarlyLeave;
    existingSummary.earlyLeaveMinutes = evalResult.earlyLeaveMinutes;
    existingSummary.totalWorkMinutes = evalResult.totalWorkMinutes;
    existingSummary.attendanceStatus = evalResult.calculatedStatus;
    existingSummary.updatedAt = new Date();

    memoryStore.attendanceEvents.push({
      id: "event-" + Date.now(),
      attendanceDailySummaryId: existingSummary.id,
      employeeId,
      eventType: EventType.CHECK_OUT,
      eventTime: nowUtc,
      latitude,
      longitude,
      accuracy,
      distanceMeters,
      isWithinRadius: isWithin,
      photoUrl,
      deviceInfo,
      createdAt: new Date(),
    });

    return { summary: existingSummary, distanceMeters, totalWorkMinutes: evalResult.totalWorkMinutes };
  },

  // --- Manual Attendance Correction (HR Audit Trail) ---
  async correctAttendance({
    summaryId,
    adjustedById,
    newCheckIn,
    newCheckOut,
    newStatus,
    reason,
  }: {
    summaryId: string;
    adjustedById: string;
    newCheckIn?: Date | null;
    newCheckOut?: Date | null;
    newStatus: AttendanceStatus;
    reason: string;
  }) {
    if (await isDatabaseConnected()) {
      const summary = await prisma.attendanceDailySummary.findUnique({
        where: { id: summaryId },
      });
      if (!summary) throw new Error("ไม่พบรายการลงเวลา");

      const adjustment = await prisma.attendanceAdjustment.create({
        data: {
          dailySummaryId: summary.id,
          employeeId: summary.employeeId,
          adjustedById,
          previousCheckIn: summary.checkInTime,
          newCheckIn: newCheckIn || summary.checkInTime,
          previousCheckOut: summary.checkOutTime,
          newCheckOut: newCheckOut || summary.checkOutTime,
          previousStatus: summary.attendanceStatus,
          newStatus,
          reason,
        },
      });

      const updated = await prisma.attendanceDailySummary.update({
        where: { id: summaryId },
        data: {
          checkInTime: newCheckIn !== undefined ? newCheckIn : summary.checkInTime,
          checkOutTime: newCheckOut !== undefined ? newCheckOut : summary.checkOutTime,
          attendanceStatus: newStatus,
          isCorrected: true,
          correctionReason: reason,
          correctedById: adjustedById,
          correctedAt: new Date(),
        },
      });

      return { updated, adjustment };
    }

    const summary = memoryStore.attendanceSummaries.find((s) => s.id === summaryId);
    if (!summary) throw new Error("ไม่พบรายการลงเวลา");

    const adjustment = {
      id: "adj-" + Date.now(),
      dailySummaryId: summary.id,
      employeeId: summary.employeeId,
      adjustedById,
      previousCheckIn: summary.checkInTime,
      newCheckIn: newCheckIn !== undefined ? newCheckIn : summary.checkInTime,
      previousCheckOut: summary.checkOutTime,
      newCheckOut: newCheckOut !== undefined ? newCheckOut : summary.checkOutTime,
      previousStatus: summary.attendanceStatus,
      newStatus,
      reason,
      createdAt: new Date(),
    };
    memoryStore.adjustments.push(adjustment);

    summary.checkInTime = newCheckIn !== undefined ? newCheckIn : summary.checkInTime;
    summary.checkOutTime = newCheckOut !== undefined ? newCheckOut : summary.checkOutTime;
    summary.attendanceStatus = newStatus;
    summary.isCorrected = true;
    summary.correctionReason = reason;
    summary.correctedById = adjustedById;
    summary.correctedAt = new Date();
    summary.updatedAt = new Date();

    return { updated: summary, adjustment };
  },

  // --- Reports & Dashboard Stats ---
  async getDashboardStats(companyId?: string, targetDate?: Date) {
    const date = targetDate || getBangkokToday();
    const dateFormatted = formatBangkokDate(date);

    const employees = await this.getEmployees({ companyId });
    const totalActiveEmployees = employees.filter(
      (e) => e.employmentStatus === EmploymentStatus.ACTIVE
    ).length;

    const assignments = await this.getAssignments({ companyId, date });
    const boothAssignedCount = assignments.filter(
      (a) => a.assignmentType === AssignmentType.BOOTH
    ).length;

    const attendances = await this.getDailyAttendance({ companyId, date });

    const checkedInCount = attendances.filter((a) => a.checkInTime !== null).length;
    const lateCount = attendances.filter((a) => a.isLate || a.attendanceStatus === AttendanceStatus.LATE).length;
    const earlyLeaveCount = attendances.filter((a) => a.isEarlyLeave).length;
    const missingCheckoutCount = attendances.filter(
      (a) => a.attendanceStatus === AttendanceStatus.MISSING_CHECKOUT
    ).length;

    // Scheduled today is active employees minus rest days/leaves
    const scheduledToday = totalActiveEmployees;
    const absentCount = Math.max(0, scheduledToday - checkedInCount);

    return {
      date: dateFormatted,
      totalActiveEmployees,
      scheduledToday,
      checkedInCount,
      lateCount,
      earlyLeaveCount,
      absentCount,
      missingCheckoutCount,
      boothAssignedCount,
      attendanceRate:
        scheduledToday > 0 ? Math.round((checkedInCount / scheduledToday) * 100) : 0,
    };
  },

  // --- Holidays ---
  async getHolidays(companyId?: string) {
    if (await isDatabaseConnected()) {
      return prisma.holiday.findMany({
        where: companyId ? { OR: [{ companyId }, { companyId: null }] } : undefined,
        orderBy: { holidayDate: "asc" },
      });
    }
    return memoryStore.holidays;
  },
};
