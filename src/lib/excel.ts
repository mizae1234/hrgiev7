import * as XLSX from "xlsx";

export interface EmployeeImportRow {
  rowNumber: number;
  employeeId: string;
  firstName: string;
  lastName: string;
  companyCode: string;
  departmentCode: string;
  position: string;
  email?: string;
  phone?: string;
  startDate: string; // YYYY-MM-DD
  defaultShiftCode?: string;
  defaultLocationCode?: string;
  isValid: boolean;
  errors: string[];
}

export function parseEmployeeExcel(buffer: Buffer): EmployeeImportRow[] {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  // Convert to JSON with raw values
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
    raw: false,
    dateNF: "yyyy-mm-dd",
  });

  const parsed: EmployeeImportRow[] = [];

  rawRows.forEach((row, index) => {
    const rowNum = index + 2; // Row 1 is header
    const errors: string[] = [];

    // Map common Thai / English header names
    const employeeId = String(
      row["employeeId"] || row["รหัสพนักงาน"] || row["Employee ID"] || ""
    ).trim();
    const firstName = String(
      row["firstName"] || row["ชื่อ"] || row["First Name"] || ""
    ).trim();
    const lastName = String(
      row["lastName"] || row["นามสกุล"] || row["Last Name"] || ""
    ).trim();
    const companyCode = String(
      row["companyCode"] || row["รหัสบริษัท"] || row["Company Code"] || ""
    ).trim().toUpperCase();
    const departmentCode = String(
      row["departmentCode"] || row["รหัสแผนก"] || row["Department Code"] || ""
    ).trim().toUpperCase();
    const position = String(
      row["position"] || row["ตำแหน่ง"] || row["Position"] || ""
    ).trim();
    const email = String(row["email"] || row["อีเมล"] || row["Email"] || "").trim();
    const phone = String(row["phone"] || row["เบอร์โทรศัพท์"] || row["Phone"] || "").trim();
    const startDate = String(
      row["startDate"] || row["วันเริ่มงาน"] || row["Start Date"] || ""
    ).trim();
    const defaultShiftCode = String(
      row["defaultShiftCode"] || row["รหัสกะเริ่มต้น"] || row["Default Shift"] || ""
    ).trim();
    const defaultLocationCode = String(
      row["defaultLocationCode"] || row["รหัสสถานที่เริ่มต้น"] || row["Default Location"] || ""
    ).trim();

    // Skip completely empty rows
    if (!employeeId && !firstName && !lastName) {
      return;
    }

    if (!employeeId) errors.push("กรุณาระบุรหัสพนักงาน (Employee ID)");
    if (!firstName) errors.push("กรุณาระบุชื่อ (First Name)");
    if (!lastName) errors.push("กรุณาระบุนามสกุล (Last Name)");
    if (!companyCode) errors.push("กรุณาระบุรหัสบริษัท (Company Code เช่น GI, GI01, GI06)");
    if (!departmentCode) errors.push("กรุณาระบุรหัสแผนก (Department Code เช่น OPS, HR)");
    if (!position) errors.push("กรุณาระบุตำแหน่งงาน (Position)");
    if (!startDate) {
      errors.push("กรุณาระบุวันเริ่มงาน (Start Date รูปแบบ YYYY-MM-DD)");
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
      // Validate date format
      const parsedDate = new Date(startDate);
      if (isNaN(parsedDate.getTime())) {
        errors.push("รูปแบบวันเริ่มงานไม่ถูกต้อง (ใช้ YYYY-MM-DD เช่น 2024-01-15)");
      }
    }

    parsed.push({
      rowNumber: rowNum,
      employeeId,
      firstName,
      lastName,
      companyCode,
      departmentCode,
      position,
      email: email || undefined,
      phone: phone || undefined,
      startDate,
      defaultShiftCode: defaultShiftCode || undefined,
      defaultLocationCode: defaultLocationCode || undefined,
      isValid: errors.length === 0,
      errors,
    });
  });

  return parsed;
}

/**
 * Generates an Excel template buffer for employee batch import
 */
export function generateEmployeeTemplate(): Buffer {
  const wb = XLSX.utils.book_new();

  const templateData = [
    {
      "รหัสพนักงาน (employeeId) *": "EMP-GI-002",
      "ชื่อ (firstName) *": "ศิริพร",
      "นามสกุล (lastName) *": "พงษ์พาณิชย์",
      "รหัสบริษัท (companyCode) *": "GI",
      "รหัสแผนก (departmentCode) *": "SALES",
      "ตำแหน่ง (position) *": "เจ้าหน้าที่ฝ่ายขายและบูธ",
      "อีเมล (email)": "siriporn.p@hr.internal",
      "เบอร์โทรศัพท์ (phone)": "089-999-8877",
      "วันเริ่มงาน (startDate YYYY-MM-DD) *": "2024-06-01",
      "รหัสกะเริ่มต้น (defaultShiftCode)": "SHIFT-02-BOOTH1",
      "รหัสสถานที่เริ่มต้น (defaultLocationCode)": "BOOTH-MEGA",
    },
    {
      "รหัสพนักงาน (employeeId) *": "EMP-EV7-002",
      "ชื่อ (firstName) *": "วรเมธ",
      "นามสกุล (lastName) *": "อัครเดโช",
      "รหัสบริษัท (companyCode) *": "GI06",
      "รหัสแผนก (departmentCode) *": "TECH",
      "ตำแหน่ง (position) *": "วิศวกรเทคโนโลยียานยนต์ไฟฟ้า",
      "อีเมล (email)": "worameth.a@hr.internal",
      "เบอร์โทรศัพท์ (phone)": "084-555-1234",
      "วันเริ่มงาน (startDate YYYY-MM-DD) *": "2024-05-15",
      "รหัสกะเริ่มต้น (defaultShiftCode)": "SHIFT-01-OFFICE",
      "รหัสสถานที่เริ่มต้น (defaultLocationCode)": "LOC-EV7-HQ",
    },
  ];

  const ws = XLSX.utils.json_to_sheet(templateData);

  // Set column widths
  ws["!cols"] = [
    { wch: 25 },
    { wch: 20 },
    { wch: 20 },
    { wch: 15 },
    { wch: 15 },
    { wch: 25 },
    { wch: 25 },
    { wch: 18 },
    { wch: 22 },
    { wch: 20 },
    { wch: 25 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Employee_Template");

  // Instruction Sheet
  const instructions = [
    { หัวข้อ: "คำแนะนำการนำเข้าข้อมูลพนักงาน", รายละเอียด: "" },
    { หัวข้อ: "1. คอลัมน์ที่มีเครื่องหมาย *", รายละเอียด: "เป็นข้อมูลจำเป็นที่ต้องระบุ ห้ามเว้นว่าง" },
    { หัวข้อ: "2. รหัสบริษัท (companyCode)", รายละเอียด: "GI = โกลด์ อินทิเกรท, GI01 = กาญจนาภิเษก-บางแค, GI02 = มีนบุรี ... GI06 = EV7 Co.,Ltd., GI12 = เชียงใหม่" },
    { หัวข้อ: "3. รูปแบบวันที่ (startDate)", รายละเอียด: "ต้องเป็น ค.ศ. รูปแบบ YYYY-MM-DD เช่น 2024-01-15" },
    { หัวข้อ: "4. รหัสกะ (shiftCode)", รายละเอียด: "SHIFT-01-OFFICE, SHIFT-02-BOOTH1, SHIFT-03-BOOTH2, SHIFT-04-EARLY" },
    { หัวข้อ: "5. รหัสสถานที่ (locationCode)", รายละเอียด: "LOC-GI-HQ, LOC-EV7-HQ, LOC-GI01, BOOTH-MEGA, BOOTH-CW" },
  ];
  const wsInfo = XLSX.utils.json_to_sheet(instructions);
  wsInfo["!cols"] = [{ wch: 30 }, { wch: 60 }];
  XLSX.utils.book_append_sheet(wb, wsInfo, "คำแนะนำการใช้งาน");

  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

/**
 * Generates an Excel report from JSON data
 */
export function generateExcelReport(
  sheetName: string,
  data: Record<string, unknown>[],
  columnWidths?: { wch: number }[]
): Buffer {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);

  if (columnWidths) {
    ws["!cols"] = columnWidths;
  }

  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

export interface HolidayImportRow {
  rowNumber: number;
  holidayDate: string; // YYYY-MM-DD
  name: string;
  description?: string;
  companyCode?: string; // Optional: empty means all companies
  isValid: boolean;
  errors: string[];
}

/**
 * Parses and validates an uploaded Excel file for holiday batch import
 */
export function parseHolidayExcel(buffer: Buffer): HolidayImportRow[] {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
    raw: false,
    dateNF: "yyyy-mm-dd",
  });

  const parsed: HolidayImportRow[] = [];

  rawRows.forEach((row, index) => {
    const rowNum = index + 2;
    const errors: string[] = [];

    const holidayDate = String(
      row["holidayDate"] ||
        row["วันที่วันหยุด"] ||
        row["วันที่"] ||
        row["Holiday Date"] ||
        row["วันที่วันหยุด (holidayDate YYYY-MM-DD) *"] ||
        ""
    ).trim();

    const name = String(
      row["name"] ||
        row["ชื่อวันหยุด"] ||
        row["ชื่อ"] ||
        row["Holiday Name"] ||
        row["ชื่อวันหยุด (name) *"] ||
        ""
    ).trim();

    const description = String(
      row["description"] ||
        row["รายละเอียด"] ||
        row["Description"] ||
        row["รายละเอียด (description)"] ||
        ""
    ).trim();

    const companyCode = String(
      row["companyCode"] ||
        row["รหัสบริษัท"] ||
        row["Company Code"] ||
        row["รหัสบริษัท (companyCode - เว้นว่างถ้าทุกบริษัท)"] ||
        ""
    ).trim().toUpperCase();

    // Skip fully empty rows
    const isRowEmpty = !holidayDate && !name && !description && !companyCode;
    if (isRowEmpty) return;

    if (!holidayDate) {
      errors.push("กรุณาระบุวันที่วันหยุด (Holiday Date)");
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(holidayDate)) {
      const parsedDate = new Date(holidayDate);
      if (isNaN(parsedDate.getTime())) {
        errors.push("รูปแบบวันที่ไม่ถูกต้อง (ต้องเป็น YYYY-MM-DD เช่น 2026-04-13)");
      }
    }

    if (!name) {
      errors.push("กรุณาระบุชื่อวันหยุด (Holiday Name)");
    }

    parsed.push({
      rowNumber: rowNum,
      holidayDate,
      name,
      description: description || undefined,
      companyCode: companyCode || undefined,
      isValid: errors.length === 0,
      errors,
    });
  });

  return parsed;
}

/**
 * Generates an Excel template buffer for holiday batch import
 */
export function generateHolidayTemplate(): Buffer {
  const wb = XLSX.utils.book_new();

  const templateData = [
    {
      "วันที่วันหยุด (holidayDate YYYY-MM-DD) *": "2026-01-01",
      "ชื่อวันหยุด (name) *": "วันขึ้นปีใหม่ (New Year's Day)",
      "รายละเอียด (description)": "วันหยุดนักขัตฤกษ์สากล",
      "รหัสบริษัท (companyCode - เว้นว่างถ้าทุกบริษัท)": "",
    },
    {
      "วันที่วันหยุด (holidayDate YYYY-MM-DD) *": "2026-04-13",
      "ชื่อวันหยุด (name) *": "วันสงกรานต์ (Songkran Festival)",
      "รายละเอียด (description)": "วันปีใหม่ไทย",
      "รหัสบริษัท (companyCode - เว้นว่างถ้าทุกบริษัท)": "",
    },
    {
      "วันที่วันหยุด (holidayDate YYYY-MM-DD) *": "2026-04-14",
      "ชื่อวันหยุด (name) *": "วันสงกรานต์ (Songkran Festival)",
      "รายละเอียด (description)": "วันครอบครัว",
      "รหัสบริษัท (companyCode - เว้นว่างถ้าทุกบริษัท)": "",
    },
    {
      "วันที่วันหยุด (holidayDate YYYY-MM-DD) *": "2026-04-15",
      "ชื่อวันหยุด (name) *": "วันสงกรานต์ (Songkran Festival)",
      "รายละเอียด (description)": "วันผู้สูงอายุ",
      "รหัสบริษัท (companyCode - เว้นว่างถ้าทุกบริษัท)": "",
    },
    {
      "วันที่วันหยุด (holidayDate YYYY-MM-DD) *": "2026-05-01",
      "ชื่อวันหยุด (name) *": "วันแรงงานแห่งชาติ (National Labour Day)",
      "รายละเอียด (description)": "วันหยุดตามประเพณี",
      "รหัสบริษัท (companyCode - เว้นว่างถ้าทุกบริษัท)": "",
    },
    {
      "วันที่วันหยุด (holidayDate YYYY-MM-DD) *": "2026-10-23",
      "ชื่อวันหยุด (name) *": "วันปิยมหาราช (Chulalongkorn Day)",
      "รายละเอียด (description)": "วันคล้ายวันสวรรคต ร.5",
      "รหัสบริษัท (companyCode - เว้นว่างถ้าทุกบริษัท)": "",
    },
    {
      "วันที่วันหยุด (holidayDate YYYY-MM-DD) *": "2026-12-05",
      "ชื่อวันหยุด (name) *": "วันชาติ / วันพ่อแห่งชาติ (National Day)",
      "รายละเอียด (description)": "วันคล้ายวันพระบรมราชสมภพ ร.9",
      "รหัสบริษัท (companyCode - เว้นว่างถ้าทุกบริษัท)": "",
    },
  ];

  const ws = XLSX.utils.json_to_sheet(templateData);

  ws["!cols"] = [
    { wch: 38 },
    { wch: 38 },
    { wch: 32 },
    { wch: 42 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Holiday_Template");

  // Instructions Sheet
  const instructions = [
    { หัวข้อ: "คำแนะนำการนำเข้าวันหยุดประจำปี (Holiday Import)", รายละเอียด: "" },
    { หัวข้อ: "1. คอลัมน์ที่มีเครื่องหมาย *", รายละเอียด: "เป็นข้อมูลจำเป็นที่ต้องระบุ ห้ามเว้นว่าง" },
    { หัวข้อ: "2. รูปแบบวันที่ (holidayDate)", รายละเอียด: "ต้องเป็น ค.ศ. รูปแบบ YYYY-MM-DD เช่น 2026-01-01" },
    { หัวข้อ: "3. รหัสบริษัท (companyCode)", รายละเอียด: "หากเป็นวันหยุดส่วนกลางที่หยุดทุกบริษัท ให้เว้นว่างไว้ หากเฉพาะบางบริษัทให้ใส่รหัส เช่น GI หรือ GI06" },
  ];
  const wsInfo = XLSX.utils.json_to_sheet(instructions);
  wsInfo["!cols"] = [{ wch: 32 }, { wch: 75 }];
  XLSX.utils.book_append_sheet(wb, wsInfo, "คำแนะนำการใช้งาน");

  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

