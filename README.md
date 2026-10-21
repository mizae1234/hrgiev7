# HR Attendance & Workforce Management System

ระบบบริหารจัดการเวลาทำงาน พนักงาน 13 บริษัทในเครือโกลด์ อินทิเกรท & EV7 มอบหมายจุดบูธ/สถานที่พิเศษ ตรวจจับพิกัด GPS อัตโนมัติ และการลงเวลาด้วยกล้องสด (Mandatory Live Camera Capture)

---

## 🌟 ฟังก์ชันหลักและจุดเด่นของระบบ (Key Features)

### 1. Admin Web Portal (สำหรับฝ่ายบุคคลและผู้บริหาร - Desktop First)
- **แผงควบคุมอัจฉริยะ (Real-time Dashboard)**: แสดงจำนวนพนักงานประจำการทั้งหมด, จำนวนผู้มีตารางงานวันนี้, พนักงานที่เข้างานแล้ว, มาสาย (Late), ขาดงาน (Absent), ลืมลงเวลาออก (Missing Checkout), และพนักงานที่ได้รับมอบหมายประจำบูธ พร้อมกราฟแนวโน้มรายชั่วโมง (Hourly Trend) และแยกตามแผนก (Department Breakdown)
- **ระบบหลายบริษัท (Multi-Company Architecture)**:
  - `SUPER_ADMIN`: เข้าถึงและตรวจสอบข้อมูลรวมทุกบริษัท (Consolidated View) หรือเลือกเจาะจงเฉพาะบริษัท/สาขาได้
  - `HR_ADMIN`: ถูกจำกัดสิทธิ์ในระดับ Backend ให้เข้าถึงได้เฉพาะบริษัทตนเองเท่านั้น
- **จัดการข้อมูลพนักงาน (Employee Directory)**: ค้นหา, กรองตามบริษัท/แผนก/สถานะ, เพิ่ม/แก้ไขพนักงาน, กำหนดวันเริ่มงาน, วันลาออก, กะเริ่มต้น และสถานที่หลัก
- **นำเข้าพนักงานผ่าน Excel (Batch Import with XLSX)**:
  - มีปุ่มดาวน์โหลดไฟล์ต้นแบบ (`.xlsx`)
  - ตรวจสอบความถูกต้องของข้อมูลทุกแถว ตรวจจับรหัสพนักงานซ้ำ
  - มีหน้าจอแสดงผลการตรวจสอบ (Validation Preview) พร้อมป้ายสถานะข้อผิดพลาด
  - เลือกว่าจะ "ข้ามรายการที่มีอยู่แล้ว (Skip)" หรือ "อัปเดตข้อมูลเดิม (Update)"
- **จัดการสถานที่และจุดบูธ (Work Locations & Booths)**:
  - รองรับทั้งสำนักงานใหญ่ (`OFFICE`) และจุดบูธ/จุดขายนอกสถานที่ (`BOOTH`)
  - ระบุพิกัดละติจูด, ลองจิจูด และรัศมี GPS ที่อนุญาต (เมตร)
  - มีปุ่มเปิดดูบน Google Maps ทันที
- **จัดการกะเวลาทำงาน (Shift Templates)**:
  - กำหนดเวลาเริ่ม-เลิกงาน และระยะเวลายืดหยุ่นก่อนคิดสาย (Grace Period เช่น 15 นาที)
  - รองรับ Shift Priority: กะมอบหมายบูธรายวัน > กะในตารางงาน > กะเริ่มต้นประจำตัวพนักงาน
- **มอบหมายจุดบูธ (Booth Assignments)**: มอบหมายพนักงานรายบุคคลหรือหลายคนพร้อมกันในวันที่กำหนด พร้อมเปลี่ยนสถานที่ตรวจจับ GPS และกะเวลาอัตโนมัติ
- **บันทึกการลงเวลา (Attendance Board)**: ตารางลงเวลารายวัน, คลิกดูภาพถ่ายกล้องสดขณะเข้าและออกงาน, ตรวจสอบระยะห่าง GPS, และมีระบบ **"แก้ไขรายการลงเวลาโดย HR (Manual Correction)"** พร้อมบันทึกประวัติการแก้ไขและเหตุผลลงใน Audit Trail
- **รายงานและการส่งออก (Reports & Excel Export)**: รายงานสรุปประจำวัน, รายงานมาสาย, รายงานขาดงาน, รายงานลืมลงเวลาออก, รายงานประจำจุดบูธ พร้อมปุ่ม **"ส่งออกรายงานเป็น Excel (.xlsx)"**

---

### 2. Employee Mobile Portal (สำหรับพนักงาน - Mobile First)
- **หน้าแรกสมาร์ตโฟน (`/employee`)**: แสดงข้อมูลกะเวลาทำงานของวันนี้, สถานที่ที่ต้องไปปฏิบัติงาน (ระบุชัดเจนหากได้รับมอบหมายจุดบูธ), และสถานะเข้า-ออกงาน
- **บังคับถ่ายภาพด้วยกล้องสด (Mandatory Live Camera Capture)**:
  - ใช้ Browser Camera API (`navigator.mediaDevices.getUserMedia`)
  - เลือกกล้องหน้าเป็นค่าเริ่มต้น (Front-facing camera)
  - มีกรอบวงรีแนะนำตำแหน่งใบหน้า (Face-positioning guide)
  - ปิดกั้นการอัปโหลดไฟล์จากคลังภาพ (No gallery upload)
  - บีบอัดรูปถ่ายภาพสดเป็น JPEG สำหรับส่งเข้าระบบอย่างรวดเร็ว
  - ปิดการทำงานของกล้อง (`track.stop()`) ทันทีเมื่อถ่ายเสร็จหรือปิดหน้าต่าง
- **การตรวจสอบพิกัด GPS (GPS Haversine Validation)**:
  - ดึงพิกัดตำแหน่งอุปกรณ์แบบเรียลไทม์
  - คำนวณระยะห่างระหว่างอุปกรณ์กับจุดปฏิบัติงานโดยใช้สูตร Haversine บน Server-side
  - ปิดกั้นการลงเวลาหากอยู่นอกรัศมีที่กำหนด พร้อมแจ้งเตือนระยะห่างจริง
  - มีปุ่มพิกัดจำลองจุดปฏิบัติงานเพื่ออำนวยความสะดวกในการทดสอบบนคอมพิวเตอร์ที่ไม่มี GPS
- **ตารางงานประจำเดือน (`/employee/schedule`)**: ปฏิทินแสดงกะเวลา วันหยุดนักขัตฤกษ์ และวันที่ได้รับมอบหมายประจำบูธ
- **ประวัติการลงเวลา (`/employee/history`)**: ดูบันทึกย้อนหลัง เวลาเข้า-ออก สถานะการมาสาย และกดดูรูปถ่ายที่บันทึกไว้ได้
- **โปรไฟล์ส่วนตัว (`/employee/profile`)**: ดูข้อมูลสังกัด บริษัท แผนก วันเริ่มงาน และออกจากระบบอย่างปลอดภัย

---

## 🛠️ เทคโนโลยีที่ใช้ (Tech Stack)

| ส่วนของระบบ | เทคโนโลยี |
|---|---|
| **Framework** | Next.js (App Router, Turbopack) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS + Lucide React Icons |
| **Database** | PostgreSQL |
| **ORM** | Prisma ORM 6.4.1 |
| **Authentication** | Server-side Session (JWT via `jose`, Passwords via `bcryptjs`, Secure HTTP-Only Cookie) |
| **Form & Validation** | React Hook Form, Zod |
| **Data Visualizations** | Recharts (Hourly Trends, Department Breakdown) |
| **Spreadsheet Engine** | XLSX (SheetJS) สำหรับ Import / Export ไฟล์ `.xlsx` |
| **Geolocation** | Haversine Formula (Server-side validation) |
| **Camera Integration** | Native Browser MediaDevices API |

---

## 🏢 รายชื่อบริษัทในระบบ (Companies List - 13 Entities)

| รหัส (Code) | ชื่อบริษัท / สาขา |
|---|---|
| **GI** | บริษัท โกลด์ อินทิเกรท จำกัด (สำนักงานใหญ่) |
| **GI01** | บริษัท โกลด์อินทิเกรท กาญจนาภิเษก – บางแค จำกัด |
| **GI02** | บริษัท โกลด์ อินทิเกรท มีนบุรี จำกัด |
| **GI03** | บริษัท โกลด์ อินทิเกรท เลียบด่วนรามอินทรา จำกัด |
| **GI04** | บริษัท โกลด์ อินทิเกรท สีลม ซอย 9 จำกัด |
| **GI05** | บริษัท โกลด์ อินทิเกรท อุบลราชธานี จำกัด |
| **GI06** | EV7 Co.,Ltd. |
| **GI07** | บริษัท โกลด์ อินทิเกรท มหาชัย จำกัด |
| **GI08** | บริษัท โกลด์ อินทิเกรท ศาลายา จำกัด |
| **GI09** | บริษัท โกลด์ อินทิเกรท วิภาวดี จำกัด |
| **GI10** | บริษัท โกลด์ อินทิเกรท พิบูลสงคราม จำกัด |
| **GI11** | บริษัท โกลด์ อินทิเกรท อยุธยา จำกัด |
| **GI12** | บริษัท โกลด์ อินทิเกรท เชียงใหม่ จำกัด |

---

## 🔑 บัญชีผู้ใช้สำหรับทดสอบระบบ (Demo Accounts)

ทุกบัญชีใช้รหัสผ่านเดียวกัน: **`Password123!`**

| บทบาท (Role) | อีเมล (Email) | รายละเอียดและสิทธิ์การเข้าถึง |
|---|---|---|
| **Super Admin** | `superadmin@hr.internal` | สิทธิ์สูงสุด ดูแลและสลับดูข้อมูลได้ทุกบริษัทในเครือ (Consolidated View) |
| **HR Admin (GI)** | `hr.gi@hr.internal` | ผู้ดูแลฝ่ายบุคคล เฉพาะบริษัท โกลด์ อินทิเกรท จำกัด |
| **HR Admin (EV7)** | `hr.ev7@hr.internal` | ผู้ดูแลฝ่ายบุคคล เฉพาะบริษัท EV7 Co.,Ltd. |
| **Employee 1** | `emp1@hr.internal` | นภัสสร (EMP-GI-001) - วันนี้ได้รับมอบหมายพิเศษประจำบูธเซ็นทรัลเวิลด์ (กะ 11:00 - 20:00) |
| **Employee 2** | `emp2@hr.internal` | ธนากร (EMP-GI01-001) - ประจำสาขากาญจนาภิเษก – บางแค (กะเช้า 08:00 - 17:00) |
| **Employee 3** | `emp3@hr.internal` | ชลธิชา (EMP-EV7-001) - วิศวกรยานยนต์ไฟฟ้า ประจำสำนักงาน EV7 Co.,Ltd. |

*(หน้าจอเข้าสู่ระบบ `/login` มีปุ่ม **1-Click Demo Accounts** ให้สามารถคลิกเลือกและเข้าสู่ระบบได้ทันทีโดยไม่ต้องพิมพ์)*

---

## ⚙️ การติดตั้งและเริ่มต้นใช้งาน (Installation & Setup)

### 1. ตั้งค่า Environment Variables
คัดลอกไฟล์ `.env.example` ไปเป็น `.env`:
```bash
cp .env.example .env
```

ระบุค่าการเชื่อมต่อฐานข้อมูลใน `.env`:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/hr_attendance?schema=public"
AUTH_SECRET="your-super-secure-secret-key-32chars"
NEXT_PUBLIC_APP_NAME="HR Attendance"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

> **หมายเหตุ**: ระบบถูกออกแบบสถาปัตยกรรมแบบ Resilient Dual-Mode หากยังไม่ได้เชื่อมต่อ PostgreSQL ระบบจะรันผ่าน In-Memory Data Store ที่มีข้อมูลตั้งต้นครบถ้วน ทำให้สามารถทดสอบฟังก์ชัน UI กล้องสด และ GPS ได้ทันทีโดยไม่เกิด Error

### 2. การ Migrate ฐานข้อมูล PostgreSQL
เมื่อระบุ `DATABASE_URL` เรียบร้อยแล้ว ให้รันคำสั่ง Migration:
```bash
npx prisma migrate deploy
# หรือ
npx prisma db push
```

### 3. นำเข้าข้อมูลเริ่มต้น (Seeding)
รันคำสั่ง Seed เพื่อสร้างบริษัท แผนก จุดบูธ กะเวลา และผู้ใช้งานตัวอย่าง:
```bash
npm run seed
```

### 4. รันแอปพลิเคชัน
```bash
# รันสำหรับ Development
npm run dev

# รันสำหรับ Production
npm run build
npm run start
```

เปิดเบราว์เซอร์ที่: **`http://localhost:3000`**

---

## 📁 โครงสร้างโปรเจกต์ (Project Structure)

```
hr/
├── prisma/
│   ├── schema.prisma              # Schema ฐานข้อมูล PostgreSQL ทั้งหมด 16 ตาราง
│   ├── migrations/                # SQL Migration files สำหรับ deploy
│   └── seed.ts                    # Script นำเข้าข้อมูลเริ่มต้น (บริษัท, กะ, บูธ, พนักงาน)
├── src/
│   ├── app/
│   │   ├── admin/                 # พอร์ทัลผู้ดูแลระบบ (Admin Portal)
│   │   │   ├── page.tsx           # แผงควบคุมสถิติและกราฟ (Dashboard)
│   │   │   ├── employees/         # ทะเบียนพนักงาน
│   │   │   │   └── import/        # นำเข้าพนักงานจาก Excel พร้อม Preview
│   │   │   ├── locations/         # จัดการสำนักงานและจุดบูธ
│   │   │   ├── shifts/            # จัดการกะเวลาทำงาน
│   │   │   ├── assignments/       # มอบหมายพนักงานประจำจุดบูธ
│   │   │   ├── attendance/        # ตรวจสอบการลงเวลา & แก้ไขรายการโดย HR
│   │   │   └── reports/           # รายงานและการส่งออก Excel
│   │   ├── employee/              # พอร์ทัลพนักงานบนมือถือ (Employee Mobile Portal)
│   │   │   ├── page.tsx           # หน้าแรก ตรวจสอบกะ บันทึกเวลาด้วยกล้องสดและ GPS
│   │   │   ├── schedule/          # ปฏิทินตารางงานและวันหยุด
│   │   │   ├── history/           # ประวัติการลงเวลาและภาพถ่าย
│   │   │   └── profile/           # ข้อมูลส่วนตัวและปุ่มออกจากระบบ
│   │   ├── api/                   # REST API Routes แบบป้องกันสิทธิ์
│   │   │   ├── auth/              # login, logout, me (JWT Cookie Sessions)
│   │   │   ├── admin/             # APIs สำหรับจัดการข้อมูลแอดมินและการส่งออก Excel
│   │   │   └── employee/          # APIs สำหรับลงเวลาเข้า-ออกงาน ตารางงาน และประวัติ
│   │   ├── login/                 # หน้าจอเข้าสู่ระบบแบบ Dual-Portal
│   │   ├── layout.tsx             # Root Layout
│   │   └── page.tsx               # Root Gateway
│   ├── components/
│   │   ├── admin/                 # Admin Layout, Header (Company Switcher), Sidebar
│   │   ├── employee/              # Mobile Shell, BottomNav, CameraCaptureModal
│   │   └── ui/                    # ปุ่ม, ฟอร์ม, Badge, Modal, Card
│   └── lib/
│       ├── prisma.ts              # Prisma Client Singleton
│       ├── data-service.ts        # Data Access Layer & Business Logic
│       ├── auth.ts                # Session Token, Cookie & Permission Check
│       ├── geo.ts                 # สูตรคำนวณระยะห่าง GPS (Haversine Formula)
│       ├── attendance.ts          # การคำนวณการมาสาย กลับก่อน และ Timezone กรุงเทพฯ
│       ├── excel.ts               # ระบบสร้าง Template และประมวลผล Excel
│       └── audit.ts               # ระบบบันทึก Audit Log การแก้ไขข้อมูลของ HR
├── .env.example                   # ไฟล์ตัวอย่าง Environment Variables
├── package.json
└── tsconfig.json
```
