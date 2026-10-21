import {
  PrismaClient,
  Role,
  EmploymentStatus,
  LocationType,
  AssignmentType,
  AttendanceStatus,
  EventType,
  LeaveType,
  LeaveStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const COMPANIES_DATA = [
  {
    code: "GI",
    name: "บริษัท โกลด์ อินทิเกรท จำกัด",
    taxId: "0105558012345",
    address: "อาคารโกลด์ อินทิเกรท กรุงเทพฯ",
    phone: "02-100-0000",
    email: "contact@goldintegrate.co.th",
  },
  {
    code: "GI01",
    name: "บริษัท โกลด์อินทิเกรท กาญจนาภิเษก – บางแค จำกัด",
    taxId: "0105558012346",
    address: "ถนนกาญจนาภิเษก แขวงบางแคเหนือ เขตบางแค กรุงเทพฯ",
    phone: "02-101-0001",
    email: "branch.gi01@goldintegrate.co.th",
  },
  {
    code: "GI02",
    name: "บริษัท โกลด์ อินทิเกรท มีนบุรี จำกัด",
    taxId: "0105558012347",
    address: "ถนนสีหบุรานุกิจ แขวงมีนบุรี เขตมีนบุรี กรุงเทพฯ",
    phone: "02-101-0002",
    email: "branch.gi02@goldintegrate.co.th",
  },
  {
    code: "GI03",
    name: "บริษัท โกลด์ อินทิเกรท เลียบด่วนรามอินทรา จำกัด",
    taxId: "0105558012348",
    address: "ถนนประดิษฐ์มนูธรรม แขวงลาดพร้าว เขตลาดพร้าว กรุงเทพฯ",
    phone: "02-101-0003",
    email: "branch.gi03@goldintegrate.co.th",
  },
  {
    code: "GI04",
    name: "บริษัท โกลด์ อินทิเกรท สีลม ซอย 9 จำกัด",
    taxId: "0105558012349",
    address: "สีลม ซอย 9 แขวงสีลม เขตบางรัก กรุงเทพฯ",
    phone: "02-101-0004",
    email: "branch.gi04@goldintegrate.co.th",
  },
  {
    code: "GI05",
    name: "บริษัท โกลด์ อินทิเกรท อุบลราชธานี จำกัด",
    taxId: "0105558012350",
    address: "ถนนชยางกูร ต.ในเมือง อ.เมือง อุบลราชธานี",
    phone: "045-101-0005",
    email: "branch.gi05@goldintegrate.co.th",
  },
  {
    code: "GI06",
    name: "EV7 Co.,Ltd.",
    taxId: "0105558012351",
    address: "อาคารอีวี เซเว่น ทาวเวอร์ สุขุมวิท กรุงเทพฯ",
    phone: "02-777-7777",
    email: "contact@ev7.co.th",
  },
  {
    code: "GI07",
    name: "บริษัท โกลด์ อินทิเกรท มหาชัย จำกัด",
    taxId: "0105558012352",
    address: "ถนนพระราม 2 ต.มหาชัย อ.เมือง สมุทรสาคร",
    phone: "034-101-0007",
    email: "branch.gi07@goldintegrate.co.th",
  },
  {
    code: "GI08",
    name: "บริษัท โกลด์ อินทิเกรท ศาลายา จำกัด",
    taxId: "0105558012353",
    address: "ถนนพุทธมณฑลสาย 4 ต.ศาลายา อ.พุทธมณฑล นครปฐม",
    phone: "02-101-0008",
    email: "branch.gi08@goldintegrate.co.th",
  },
  {
    code: "GI09",
    name: "บริษัท โกลด์ อินทิเกรท วิภาวดี จำกัด",
    taxId: "0105558012354",
    address: "ถนนวิภาวดีรังสิต แขวงจอมพล เขตจตุจักร กรุงเทพฯ",
    phone: "02-101-0009",
    email: "branch.gi09@goldintegrate.co.th",
  },
  {
    code: "GI10",
    name: "บริษัท โกลด์ อินทิเกรท พิบูลสงคราม จำกัด",
    taxId: "0105558012355",
    address: "ถนนพิบูลสงคราม ต.สวนใหญ่ อ.เมือง นนทบุรี",
    phone: "02-101-0010",
    email: "branch.gi10@goldintegrate.co.th",
  },
  {
    code: "GI11",
    name: "บริษัท โกลด์ อินทิเกรท อยุธยา จำกัด",
    taxId: "0105558012356",
    address: "ถนนโรจนะ ต.คลองสวนพลู อ.พระนครศรีอยุธยา พระนครศรีอยุธยา",
    phone: "035-101-0011",
    email: "branch.gi11@goldintegrate.co.th",
  },
  {
    code: "GI12",
    name: "บริษัท โกลด์ อินทิเกรท เชียงใหม่ จำกัด",
    taxId: "0105558012357",
    address: "ถนนซุปเปอร์ไฮเวย์ เชียงใหม่-ลำปาง ต.ช้างเผือก อ.เมือง เชียงใหม่",
    phone: "053-101-0012",
    email: "branch.gi12@goldintegrate.co.th",
  },
];

const OFFICIAL_HOLIDAYS_2026 = [
  { date: "2026-01-01", name: "วันขึ้นปีใหม่ (New Year's Day)", description: "วันหยุดราชการและวันหยุดตามประเพณี" },
  { date: "2026-01-02", name: "วันหยุดพิเศษช่วงปีใหม่", description: "วันหยุดราชการกรณีพิเศษตามมติ ครม." },
  { date: "2026-03-03", name: "วันมาฆบูชา (Makha Bucha Day)", description: "วันสำคัญทางพระพุทธศาสนา" },
  { date: "2026-04-06", name: "วันจักรี (Chakri Memorial Day)", description: "วันพระบาทสมเด็จพระพุทธยอดฟ้าจุฬาโลกมหาราช" },
  { date: "2026-04-13", name: "วันสงกรานต์ (Songkran Festival)", description: "วันมหาสงกรานต์" },
  { date: "2026-04-14", name: "วันสงกรานต์ (Songkran Festival)", description: "วันเนา / วันครอบครัว" },
  { date: "2026-04-15", name: "วันสงกรานต์ (Songkran Festival)", description: "วันเถลิงศก" },
  { date: "2026-05-01", name: "วันแรงงานแห่งชาติ (Labour Day)", description: "วันหยุดตามประเพณีของผู้ใช้แรงงาน" },
  { date: "2026-05-04", name: "วันฉัตรมงคล (Coronation Day)", description: "วันพระราชพิธีฉัตรมงคล" },
  { date: "2026-05-31", name: "วันวิสาขบูชา (Visakha Bucha Day)", description: "วันสำคัญสากลทางพระพุทธศาสนา" },
  { date: "2026-06-01", name: "วันหยุดชดเชยวันวิสาขบูชา", description: "วันหยุดชดเชยวันวิสาขบูชา" },
  { date: "2026-06-03", name: "วันเฉลิมพระชนมพรรษา สมเด็จพระนางเจ้าฯ พระบรมราชินี", description: "วันเฉลิมพระชนมพรรษา สมเด็จพระนางเจ้าสุทิดาฯ" },
  { date: "2026-07-28", name: "วันเฉลิมพระชนมพรรษา พระบาทสมเด็จพระเจ้าอยู่หัว ร.10", description: "วันเฉลิมพระชนมพรรษา พระบาทสมเด็จพระวชิรเกล้าเจ้าอยู่หัว" },
  { date: "2026-07-29", name: "วันอาสาฬหบูชา (Asahna Bucha Day)", description: "วันสำคัญทางพระพุทธศาสนา" },
  { date: "2026-07-30", name: "วันเข้าพรรษา (Buddhist Lent Day)", description: "วันเริ่มต้นเทศกาลเข้าพรรษา" },
  { date: "2026-08-12", name: "วันแม่แห่งชาติ (Mother's Day)", description: "วันเฉลิมพระชนมพรรษา สมเด็จพระบรมราชชนนีพันปีหลวง" },
  { date: "2026-10-13", name: "วันนวมินทรมหาราช (King Rama IX Memorial Day)", description: "วันคล้ายวันสวรรคต พระบาทสมเด็จพระบรมชนกาธิเบศร มหาภูมิพลอดุลยเดชมหาราชฯ" },
  { date: "2026-10-23", name: "วันปิยมหาราช (Chulalongkorn Day)", description: "วันคล้ายวันสวรรคต พระบาทสมเด็จพระจุลจอมเกล้าเจ้าอยู่หัว" },
  { date: "2026-12-05", name: "วันพ่อแห่งชาติ / วันชาติ (Father's Day / National Day)", description: "วันคล้ายวันพระบรมราชสมภพ พระบาทสมเด็จพระบรมชนกาธิเบศร มหาภูมิพลอดุลยเดชมหาราชฯ" },
  { date: "2026-12-07", name: "วันหยุดชดเชยวันคล้ายวันพระบรมราชสมภพ ร.9", description: "ชดเชยวันชาติและวันพ่อแห่งชาติ" },
  { date: "2026-12-10", name: "วันรัฐธรรมนูญ (Constitution Day)", description: "วันพระราชทานรัฐธรรมนูญแห่งราชอาณาจักรไทย" },
  { date: "2026-12-31", name: "วันสิ้นปี (New Year's Eve)", description: "วันสิ้นปีตามปฏิทินสากล" },
];

async function main() {
  console.log("🌱 Starting database seeding with Gold Integrate & EV7 companies...");

  // 1. Password Hash (Default password for all seed users: Password123!)
  const passwordHash = await bcrypt.hash("Password123!", 10);

  // Clean up old dummy test data if present
  console.log("🧹 Resetting existing seed tables...");
  await prisma.attendanceAdjustment.deleteMany({});
  await prisma.attendancePhoto.deleteMany({});
  await prisma.attendanceEvent.deleteMany({});
  await prisma.attendanceDailySummary.deleteMany({});
  await prisma.locationAssignment.deleteMany({});
  await prisma.workSchedule.deleteMany({});
  await prisma.employeeDefaultShift.deleteMany({});
  await prisma.leaveRecord.deleteMany({});
  await prisma.userCompanyAccess.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.employee.deleteMany({});
  await prisma.workLocation.deleteMany({});
  await prisma.shiftTemplate.deleteMany({});
  await prisma.department.deleteMany({});
  await prisma.holiday.deleteMany({});
  await prisma.company.deleteMany({});

  // 2. Seed All 13 Companies
  const companyMap = new Map<string, any>();
  for (const c of COMPANIES_DATA) {
    const created = await prisma.company.create({
      data: {
        code: c.code,
        name: c.name,
        taxId: c.taxId,
        address: c.address,
        phone: c.phone,
        email: c.email,
        active: true,
      },
    });
    companyMap.set(c.code, created);
  }
  console.log(`✓ Seeded ${COMPANIES_DATA.length} Companies successfully!`);

  const companyGI = companyMap.get("GI");
  const companyGI01 = companyMap.get("GI01");
  const companyGI02 = companyMap.get("GI02");
  const companyEV7 = companyMap.get("GI06");

  // 3. Seed Departments
  // GI Departments (Head Office)
  const deptGIOps = await prisma.department.create({
    data: {
      companyId: companyGI.id,
      code: "OPS",
      name: "ฝ่ายปฏิบัติการและบริการ (Operations & Services)",
      active: true,
    },
  });

  const deptGIHR = await prisma.department.create({
    data: {
      companyId: companyGI.id,
      code: "HR",
      name: "ฝ่ายทรัพยากรบุคคล (Human Resources)",
      active: true,
    },
  });

  const deptGISales = await prisma.department.create({
    data: {
      companyId: companyGI.id,
      code: "SALES",
      name: "ฝ่ายขายและบูธกิจกรรม (Sales & Booth Operations)",
      active: true,
    },
  });

  // EV7 Departments
  const deptEV7Tech = await prisma.department.create({
    data: {
      companyId: companyEV7.id,
      code: "TECH",
      name: "ฝ่ายเทคโนโลยียานยนต์ไฟฟ้า (EV Technology & Systems)",
      active: true,
    },
  });

  const deptEV7Ops = await prisma.department.create({
    data: {
      companyId: companyEV7.id,
      code: "OPS",
      name: "ฝ่ายปฏิบัติการและศูนย์บริการ EV (EV Service Operations)",
      active: true,
    },
  });

  // GI01 Branch Department
  const deptGI01Branch = await prisma.department.create({
    data: {
      companyId: companyGI01.id,
      code: "BRANCH",
      name: "ฝ่ายปฏิบัติการสาขากาญจนาภิเษก – บางแค",
      active: true,
    },
  });

  // GI02 Branch Department
  const deptGI02Branch = await prisma.department.create({
    data: {
      companyId: companyGI02.id,
      code: "BRANCH",
      name: "ฝ่ายปฏิบัติการสาขามีนบุรี",
      active: true,
    },
  });

  // Create standard department for each other branch
  for (const c of COMPANIES_DATA) {
    if (!["GI", "GI01", "GI02", "GI06"].includes(c.code)) {
      const branchCompany = companyMap.get(c.code);
      await prisma.department.create({
        data: {
          companyId: branchCompany.id,
          code: "BRANCH",
          name: `ฝ่ายปฏิบัติการประจำสาขา (${c.code})`,
          active: true,
        },
      });
    }
  }

  console.log("✓ Seeded Departments for all companies");

  // 4. Seed Shift Templates
  const shiftOffice = await prisma.shiftTemplate.create({
    data: {
      companyId: null,
      shiftCode: "SHIFT-01-OFFICE",
      shiftName: "กะทำงานมาตรฐานสำนักงาน (09:00 - 18:00)",
      startTime: "09:00",
      endTime: "18:00",
      gracePeriodMinutes: 15,
      active: true,
    },
  });

  const shiftBooth1 = await prisma.shiftTemplate.create({
    data: {
      companyId: null,
      shiftCode: "SHIFT-02-BOOTH1",
      shiftName: "กะบูธ/ห้างสรรพสินค้า เช้า (10:00 - 19:00)",
      startTime: "10:00",
      endTime: "19:00",
      gracePeriodMinutes: 15,
      active: true,
    },
  });

  const shiftBooth2 = await prisma.shiftTemplate.create({
    data: {
      companyId: null,
      shiftCode: "SHIFT-03-BOOTH2",
      shiftName: "กะบูธ/ห้างสรรพสินค้า บ่าย (11:00 - 20:00)",
      startTime: "11:00",
      endTime: "20:00",
      gracePeriodMinutes: 15,
      active: true,
    },
  });

  const shiftEarly = await prisma.shiftTemplate.create({
    data: {
      companyId: null,
      shiftCode: "SHIFT-04-EARLY",
      shiftName: "กะเช้าพิเศษ ปฏิบัติการ/ศูนย์บริการ (08:00 - 17:00)",
      startTime: "08:00",
      endTime: "17:00",
      gracePeriodMinutes: 15,
      active: true,
    },
  });

  console.log("✓ Seeded Shift Templates");

  // 5. Seed Work Locations
  const locGIHQ = await prisma.workLocation.create({
    data: {
      companyId: companyGI.id,
      locationCode: "LOC-GI-HQ",
      locationName: "สำนักงานใหญ่ โกลด์ อินทิเกรท",
      locationType: LocationType.OFFICE,
      address: "อาคารโกลด์ อินทิเกรท กรุงเทพฯ",
      latitude: 13.736717,
      longitude: 100.523186,
      allowedRadiusMeters: 150,
      active: true,
    },
  });

  const locEV7HQ = await prisma.workLocation.create({
    data: {
      companyId: companyEV7.id,
      locationCode: "LOC-EV7-HQ",
      locationName: "สำนักงานใหญ่ EV7 Co.,Ltd.",
      locationType: LocationType.OFFICE,
      address: "อาคารอีวี เซเว่น ทาวเวอร์ สุขุมวิท กรุงเทพฯ",
      latitude: 13.7225,
      longitude: 100.5289,
      allowedRadiusMeters: 150,
      active: true,
    },
  });

  const locGI01 = await prisma.workLocation.create({
    data: {
      companyId: companyGI01.id,
      locationCode: "LOC-GI01",
      locationName: "สาขากาญจนาภิเษก – บางแค",
      locationType: LocationType.OFFICE,
      address: "ถนนกาญจนาภิเษก แขวงบางแคเหนือ เขตบางแค กรุงเทพฯ",
      latitude: 13.7051,
      longitude: 100.4074,
      allowedRadiusMeters: 150,
      active: true,
    },
  });

  const locGI02 = await prisma.workLocation.create({
    data: {
      companyId: companyGI02.id,
      locationCode: "LOC-GI02",
      locationName: "สาขามีนบุรี",
      locationType: LocationType.OFFICE,
      address: "ถนนสีหบุรานุกิจ แขวงมีนบุรี เขตมีนบุรี กรุงเทพฯ",
      latitude: 13.8139,
      longitude: 100.7196,
      allowedRadiusMeters: 150,
      active: true,
    },
  });

  // Booth Locations
  const locBoothCW = await prisma.workLocation.create({
    data: {
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
  });

  const locBoothMega = await prisma.workLocation.create({
    data: {
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
  });

  console.log("✓ Seeded Work Locations (Offices & Booths)");

  // 6. Seed Super Admin User
  await prisma.user.create({
    data: {
      email: "superadmin@hr.internal",
      passwordHash,
      name: "สมชาย ยิ่งยง (Super Admin)",
      role: Role.SUPER_ADMIN,
      companyId: null,
      active: true,
    },
  });

  // 7. Seed HR Admin Users
  const hrAdminGI = await prisma.user.create({
    data: {
      email: "hr.gi@hr.internal",
      passwordHash,
      name: "วิภาดา สดใส (HR Admin GI)",
      role: Role.HR_ADMIN,
      companyId: companyGI.id,
      active: true,
    },
  });

  await prisma.user.create({
    data: {
      email: "hr.ev7@hr.internal",
      passwordHash,
      name: "กิตติพงษ์ สว่างจิต (HR Admin EV7)",
      role: Role.HR_ADMIN,
      companyId: companyEV7.id,
      active: true,
    },
  });

  console.log("✓ Seeded Admin Users (Super Admin, HR Admin GI, HR Admin EV7)");

  // 8. Seed 8 Modest Test Employees across entities
  const employeesData = [
    // 1. GI - Senior Booth Sales
    {
      employeeId: "EMP-GI-001",
      firstName: "นภัสสร",
      lastName: "รัตนโชติ",
      email: "emp1@hr.internal",
      phone: "081-111-2233",
      companyId: companyGI.id,
      departmentId: deptGISales.id,
      position: "เจ้าหน้าที่ประจำบูธและฝ่ายขายอาวุโส (Senior Booth Sales)",
      defaultLocationId: locGIHQ.id,
      defaultShiftId: shiftOffice.id,
      startDate: new Date("2024-01-15"),
    },
    // 2. GI - Operations Supervisor
    {
      employeeId: "EMP-GI-002",
      firstName: "อัครเดช",
      lastName: "มั่นคง",
      email: "emp2@hr.internal",
      phone: "081-222-3344",
      companyId: companyGI.id,
      departmentId: deptGIOps.id,
      position: "หัวหน้างานปฏิบัติการและบริการ (Operations Supervisor)",
      defaultLocationId: locGIHQ.id,
      defaultShiftId: shiftOffice.id,
      startDate: new Date("2023-06-01"),
    },
    // 3. GI - HR Officer
    {
      employeeId: "EMP-GI-003",
      firstName: "กัญญารัตน์",
      lastName: "จิตต์ประเสริฐ",
      email: "emp3@hr.internal",
      phone: "081-333-4455",
      companyId: companyGI.id,
      departmentId: deptGIHR.id,
      position: "เจ้าหน้าที่ฝ่ายสรรหาและพัฒนาบุคคล (HR Officer)",
      defaultLocationId: locGIHQ.id,
      defaultShiftId: shiftOffice.id,
      startDate: new Date("2024-02-01"),
    },
    // 4. GI - Driver / Logistic
    {
      employeeId: "EMP-GI-004",
      firstName: "ธีรภัทร",
      lastName: "วงศ์ษา",
      email: "emp4@hr.internal",
      phone: "081-444-5566",
      companyId: companyGI.id,
      departmentId: deptGIOps.id,
      position: "เจ้าหน้าที่ขับรถและขนส่งสินค้าระหว่างสาขา (Logistic Driver)",
      defaultLocationId: locGIHQ.id,
      defaultShiftId: shiftEarly.id,
      startDate: new Date("2024-04-10"),
    },
    // 5. GI01 - Branch Officer
    {
      employeeId: "EMP-GI01-001",
      firstName: "ธนากร",
      lastName: "เจริญทรัพย์",
      email: "emp5@hr.internal",
      phone: "082-222-3344",
      companyId: companyGI01.id,
      departmentId: deptGI01Branch.id,
      position: "เจ้าหน้าที่ปฏิบัติการสาขากาญจนาภิเษก (Branch Officer)",
      defaultLocationId: locGI01.id,
      defaultShiftId: shiftEarly.id,
      startDate: new Date("2024-03-01"),
    },
    // 6. GI02 - Branch Manager
    {
      employeeId: "EMP-GI02-001",
      firstName: "ปิยะดา",
      lastName: "อรรถสิทธิ์",
      email: "emp6@hr.internal",
      phone: "082-333-7788",
      companyId: companyGI02.id,
      departmentId: deptGI02Branch.id,
      position: "ผู้จัดการสาขามีนบุรี (Branch Manager)",
      defaultLocationId: locGI02.id,
      defaultShiftId: shiftOffice.id,
      startDate: new Date("2023-11-15"),
    },
    // 7. EV7 - EV Systems Engineer
    {
      employeeId: "EMP-EV7-001",
      firstName: "ชลธิชา",
      lastName: "แก้วมณี",
      email: "emp7@hr.internal",
      phone: "083-333-4455",
      companyId: companyEV7.id,
      departmentId: deptEV7Tech.id,
      position: "วิศวกรระบบและเทคโนโลยี EV (EV Solutions Engineer)",
      defaultLocationId: locEV7HQ.id,
      defaultShiftId: shiftOffice.id,
      startDate: new Date("2023-08-01"),
    },
    // 8. EV7 - Service Technician
    {
      employeeId: "EMP-EV7-002",
      firstName: "วรากร",
      lastName: "แสนสุข",
      email: "emp8@hr.internal",
      phone: "083-444-9900",
      companyId: companyEV7.id,
      departmentId: deptEV7Ops.id,
      position: "ช่างเทคนิคซ่อมบำรุงยานยนต์ไฟฟ้า (EV Service Technician)",
      defaultLocationId: locEV7HQ.id,
      defaultShiftId: shiftEarly.id,
      startDate: new Date("2024-05-01"),
    },
  ];

  const empMap = new Map<string, any>();

  for (const empData of employeesData) {
    const createdEmp = await prisma.employee.create({
      data: {
        employeeId: empData.employeeId,
        firstName: empData.firstName,
        lastName: empData.lastName,
        email: empData.email,
        phone: empData.phone,
        companyId: empData.companyId,
        departmentId: empData.departmentId,
        position: empData.position,
        employmentStartDate: empData.startDate,
        employmentStatus: EmploymentStatus.ACTIVE,
        defaultLocationId: empData.defaultLocationId,
        defaultShiftId: empData.defaultShiftId,
      },
    });

    await prisma.user.create({
      data: {
        email: empData.email,
        passwordHash,
        name: `${empData.firstName} ${empData.lastName}`,
        role: Role.EMPLOYEE,
        companyId: empData.companyId,
        employeeId: createdEmp.id,
        active: true,
      },
    });

    empMap.set(empData.employeeId, createdEmp);
  }

  console.log(`✓ Seeded ${employeesData.length} Test Employees and Login Users`);

  // 9. Seed Today's Activities (2026-10-14 Bangkok Time)
  const today = new Date("2026-10-14T00:00:00.000Z");

  const emp1 = empMap.get("EMP-GI-001");
  const emp2 = empMap.get("EMP-GI-002");
  const emp3 = empMap.get("EMP-GI-003");
  const emp5 = empMap.get("EMP-GI01-001");
  const emp7 = empMap.get("EMP-EV7-001");

  // Assignment 1: EMP-GI-001 to Booth Central World today
  await prisma.locationAssignment.create({
    data: {
      employeeId: emp1.id,
      date: today,
      workLocationId: locBoothCW.id,
      shiftTemplateId: shiftBooth2.id, // 11:00 - 20:00
      assignmentType: AssignmentType.BOOTH,
      notes: "มอบหมายปฏิบัติงานพิเศษ ณ บูธเซ็นทรัลเวิลด์ กะบ่าย (11:00 - 20:00)",
      createdById: hrAdminGI.id,
    },
  });
  console.log("✓ Assigned EMP-GI-001 to Central World Booth for today");

  // Attendance 1: EMP-GI-001 checked in on-time at Booth Central World at 10:48 (03:48 UTC)
  const checkInEmp1 = new Date("2026-10-14T03:48:00.000Z");

  const summary1 = await prisma.attendanceDailySummary.create({
    data: {
      employeeId: emp1.id,
      companyId: companyGI.id,
      date: today,
      scheduledShiftId: shiftBooth2.id,
      scheduledLocationId: locBoothCW.id,
      effectiveStartTime: "11:00",
      effectiveEndTime: "20:00",
      checkInTime: checkInEmp1,
      checkInLatitude: 13.7466,
      checkInLongitude: 100.5393,
      checkInDistanceMeters: 38.5,
      checkInPhotoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300",
      attendanceStatus: AttendanceStatus.PRESENT,
      isLate: false,
      lateMinutes: 0,
    },
  });

  await prisma.attendanceEvent.create({
    data: {
      attendanceDailySummaryId: summary1.id,
      employeeId: emp1.id,
      eventType: EventType.CHECK_IN,
      eventTime: checkInEmp1,
      latitude: 13.7466,
      longitude: 100.5393,
      distanceMeters: 38.5,
      isWithinRadius: true,
      photoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300",
      notes: "ลงเวลาเข้างานประจำบูธ เซ็นทรัลเวิลด์",
    },
  });

  // Attendance 2: EMP-GI-002 checked in 08:52 at GI HQ (ON_TIME)
  const checkInEmp2 = new Date("2026-10-14T01:52:00.000Z");

  const summary2 = await prisma.attendanceDailySummary.create({
    data: {
      employeeId: emp2.id,
      companyId: companyGI.id,
      date: today,
      scheduledShiftId: shiftOffice.id,
      scheduledLocationId: locGIHQ.id,
      effectiveStartTime: "09:00",
      effectiveEndTime: "18:00",
      checkInTime: checkInEmp2,
      checkInLatitude: 13.7367,
      checkInLongitude: 100.5231,
      checkInDistanceMeters: 24.0,
      checkInPhotoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300",
      attendanceStatus: AttendanceStatus.PRESENT,
      isLate: false,
      lateMinutes: 0,
    },
  });

  await prisma.attendanceEvent.create({
    data: {
      attendanceDailySummaryId: summary2.id,
      employeeId: emp2.id,
      eventType: EventType.CHECK_IN,
      eventTime: checkInEmp2,
      latitude: 13.7367,
      longitude: 100.5231,
      distanceMeters: 24.0,
      isWithinRadius: true,
      photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300",
      notes: "ลงเวลาเข้างานสำนักงานใหญ่",
    },
  });

  // Attendance 3: EMP-GI01-001 checked in 07:55 at GI01 Branch (ON_TIME)
  const checkInEmp5 = new Date("2026-10-14T00:55:00.000Z");

  const summary5 = await prisma.attendanceDailySummary.create({
    data: {
      employeeId: emp5.id,
      companyId: companyGI01.id,
      date: today,
      scheduledShiftId: shiftEarly.id,
      scheduledLocationId: locGI01.id,
      effectiveStartTime: "08:00",
      effectiveEndTime: "17:00",
      checkInTime: checkInEmp5,
      checkInLatitude: 13.7051,
      checkInLongitude: 100.4074,
      checkInDistanceMeters: 18.2,
      checkInPhotoUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300",
      attendanceStatus: AttendanceStatus.PRESENT,
      isLate: false,
      lateMinutes: 0,
    },
  });

  await prisma.attendanceEvent.create({
    data: {
      attendanceDailySummaryId: summary5.id,
      employeeId: emp5.id,
      eventType: EventType.CHECK_IN,
      eventTime: checkInEmp5,
      latitude: 13.7051,
      longitude: 100.4074,
      distanceMeters: 18.2,
      isWithinRadius: true,
      photoUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300",
      notes: "ลงเวลาเข้างานสาขากาญจนาภิเษก",
    },
  });

  // Attendance 4: EMP-EV7-001 checked in 09:28 at EV7 HQ (LATE by 28 mins)
  const checkInEmp7 = new Date("2026-10-14T02:28:00.000Z");

  const summary7 = await prisma.attendanceDailySummary.create({
    data: {
      employeeId: emp7.id,
      companyId: companyEV7.id,
      date: today,
      scheduledShiftId: shiftOffice.id,
      scheduledLocationId: locEV7HQ.id,
      effectiveStartTime: "09:00",
      effectiveEndTime: "18:00",
      checkInTime: checkInEmp7,
      checkInLatitude: 13.7225,
      checkInLongitude: 100.5289,
      checkInDistanceMeters: 45.0,
      checkInPhotoUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300",
      attendanceStatus: AttendanceStatus.LATE,
      isLate: true,
      lateMinutes: 28,
    },
  });

  await prisma.attendanceEvent.create({
    data: {
      attendanceDailySummaryId: summary7.id,
      employeeId: emp7.id,
      eventType: EventType.CHECK_IN,
      eventTime: checkInEmp7,
      latitude: 13.7225,
      longitude: 100.5289,
      distanceMeters: 45.0,
      isWithinRadius: true,
      photoUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300",
      notes: "ลงเวลาสาย 28 นาที (ฝนตกการจราจรติดขัด)",
    },
  });

  // Leave 1: EMP-GI-003 on approved Sick Leave today
  await prisma.leaveRecord.create({
    data: {
      employeeId: emp3.id,
      companyId: companyGI.id,
      leaveType: LeaveType.SICK,
      startDate: today,
      endDate: today,
      reason: "ลาป่วย เป็นไข้หวัด มีใบรับรองแพทย์",
      status: LeaveStatus.APPROVED,
      approvedById: hrAdminGI.id,
    },
  });

  console.log("✓ Seeded Today's Check-in & Leave Attendance Records for Dashboard testing");

  // 10. Seed Official Public Holidays for 2026 (22 entries)
  for (const h of OFFICIAL_HOLIDAYS_2026) {
    await prisma.holiday.create({
      data: {
        holidayDate: new Date(`${h.date}T00:00:00.000Z`),
        name: h.name,
        description: h.description,
        companyId: null, // Shared official holidays
      },
    });
  }

  console.log(`✓ Seeded ${OFFICIAL_HOLIDAYS_2026.length} Official Holidays for 2026`);
  console.log("🎉 Seeding finished successfully!");
  console.log(`
==================================================================
Default Login Credentials (All passwords: Password123!):
- Super Admin:    superadmin@hr.internal (เข้าถึงได้ทุกบริษัททั้ง 13 บริษัท)
- HR Admin GI:    hr.gi@hr.internal      (บริษัท โกลด์ อินทิเกรท จำกัด)
- HR Admin EV7:   hr.ev7@hr.internal     (EV7 Co.,Ltd.)

Test Employees (พนักงานทดสอบ):
1. EMP-GI-001:   emp1@hr.internal (นภัสสร รัตนโชติ - บูธเซ็นทรัลเวิลด์)
2. EMP-GI-002:   emp2@hr.internal (อัครเดช มั่นคง - สำนักงานใหญ่ GI)
3. EMP-GI-003:   emp3@hr.internal (กัญญารัตน์ จิตต์ประเสริฐ - ฝ่ายบุคคล GI [ลาป่วยวันนี้])
4. EMP-GI-004:   emp4@hr.internal (ธีรภัทร วงศ์ษา - ขับรถขนส่ง GI)
5. EMP-GI01-001: emp5@hr.internal (ธนากร เจริญทรัพย์ - สาขากาญจนาภิเษก)
6. EMP-GI02-001: emp6@hr.internal (ปิยะดา อรรถสิทธิ์ - สาขามีนบุรี)
7. EMP-EV7-001:  emp7@hr.internal (ชลธิชา แก้วมณี - วิศวกร EV7 [เข้างานสายวันนี้])
8. EMP-EV7-002:  emp8@hr.internal (วรากร แสนสุข - ช่างเทคนิค EV7)
==================================================================
  `);
}

main()
  .catch((e) => {
    console.error("❌ Error during database seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
