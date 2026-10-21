-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'HR_ADMIN', 'EMPLOYEE');

-- CreateEnum
CREATE TYPE "EmploymentStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'RESIGNED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "LocationType" AS ENUM ('OFFICE', 'BOOTH');

-- CreateEnum
CREATE TYPE "AssignmentType" AS ENUM ('BOOTH', 'TEMPORARY', 'PROJECT');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'LATE', 'ABSENT', 'EARLY_LEAVE', 'MISSING_CHECKOUT', 'DAY_OFF', 'ON_LEAVE');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('CHECK_IN', 'CHECK_OUT');

-- CreateEnum
CREATE TYPE "LeaveType" AS ENUM ('ANNUAL', 'SICK', 'PERSONAL', 'OTHER');

-- CreateEnum
CREATE TYPE "LeaveStatus" AS ENUM ('APPROVED', 'PENDING', 'REJECTED');

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "taxId" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'EMPLOYEE',
    "companyId" TEXT,
    "employeeId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_company_accesses" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_company_accesses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "companyId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "employmentStartDate" TIMESTAMP(3) NOT NULL,
    "resignationDate" TIMESTAMP(3),
    "employmentStatus" "EmploymentStatus" NOT NULL DEFAULT 'ACTIVE',
    "defaultShiftId" TEXT,
    "defaultLocationId" TEXT,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_locations" (
    "id" TEXT NOT NULL,
    "locationCode" TEXT NOT NULL,
    "locationName" TEXT NOT NULL,
    "companyId" TEXT,
    "locationType" "LocationType" NOT NULL DEFAULT 'OFFICE',
    "address" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "allowedRadiusMeters" INTEGER NOT NULL DEFAULT 100,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "work_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shift_templates" (
    "id" TEXT NOT NULL,
    "companyId" TEXT,
    "shiftCode" TEXT NOT NULL,
    "shiftName" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "gracePeriodMinutes" INTEGER NOT NULL DEFAULT 15,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shift_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_default_shifts" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "shiftTemplateId" TEXT NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_default_shifts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_schedules" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "shiftTemplateId" TEXT,
    "isRestDay" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "work_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "location_assignments" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "workLocationId" TEXT NOT NULL,
    "shiftTemplateId" TEXT,
    "assignmentType" "AssignmentType" NOT NULL DEFAULT 'BOOTH',
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "location_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_daily_summaries" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "scheduledShiftId" TEXT,
    "scheduledLocationId" TEXT,
    "effectiveStartTime" TEXT NOT NULL,
    "effectiveEndTime" TEXT NOT NULL,
    "checkInTime" TIMESTAMP(3),
    "checkOutTime" TIMESTAMP(3),
    "checkInPhotoUrl" TEXT,
    "checkOutPhotoUrl" TEXT,
    "checkInDistanceMeters" DOUBLE PRECISION,
    "checkOutDistanceMeters" DOUBLE PRECISION,
    "checkInLatitude" DOUBLE PRECISION,
    "checkInLongitude" DOUBLE PRECISION,
    "checkOutLatitude" DOUBLE PRECISION,
    "checkOutLongitude" DOUBLE PRECISION,
    "attendanceStatus" "AttendanceStatus" NOT NULL DEFAULT 'ABSENT',
    "isLate" BOOLEAN NOT NULL DEFAULT false,
    "lateMinutes" INTEGER NOT NULL DEFAULT 0,
    "isEarlyLeave" BOOLEAN NOT NULL DEFAULT false,
    "earlyLeaveMinutes" INTEGER NOT NULL DEFAULT 0,
    "totalWorkMinutes" INTEGER NOT NULL DEFAULT 0,
    "isCorrected" BOOLEAN NOT NULL DEFAULT false,
    "correctionReason" TEXT,
    "correctedById" TEXT,
    "correctedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_daily_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_events" (
    "id" TEXT NOT NULL,
    "attendanceDailySummaryId" TEXT,
    "employeeId" TEXT NOT NULL,
    "eventType" "EventType" NOT NULL,
    "eventTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "accuracy" DOUBLE PRECISION,
    "distanceMeters" DOUBLE PRECISION NOT NULL,
    "isWithinRadius" BOOLEAN NOT NULL,
    "photoUrl" TEXT NOT NULL,
    "deviceInfo" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attendance_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_photos" (
    "id" TEXT NOT NULL,
    "attendanceEventId" TEXT,
    "employeeId" TEXT NOT NULL,
    "photoType" "EventType" NOT NULL,
    "storagePath" TEXT NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mimeType" TEXT NOT NULL DEFAULT 'image/jpeg',
    "fileSize" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attendance_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_adjustments" (
    "id" TEXT NOT NULL,
    "dailySummaryId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "adjustedById" TEXT NOT NULL,
    "previousCheckIn" TIMESTAMP(3),
    "newCheckIn" TIMESTAMP(3),
    "previousCheckOut" TIMESTAMP(3),
    "newCheckOut" TIMESTAMP(3),
    "previousStatus" "AttendanceStatus" NOT NULL,
    "newStatus" "AttendanceStatus" NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attendance_adjustments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leave_records" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "leaveType" "LeaveType" NOT NULL DEFAULT 'ANNUAL',
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "reason" TEXT,
    "status" "LeaveStatus" NOT NULL DEFAULT 'APPROVED',
    "approvedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leave_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "holidays" (
    "id" TEXT NOT NULL,
    "companyId" TEXT,
    "holidayDate" DATE NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "holidays_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "details" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "companies_code_key" ON "companies"("code");

-- CreateIndex
CREATE UNIQUE INDEX "departments_companyId_code_key" ON "departments"("companyId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_employeeId_key" ON "users"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "user_company_accesses_userId_companyId_key" ON "user_company_accesses"("userId", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "employees_employeeId_key" ON "employees"("employeeId");

-- CreateIndex
CREATE INDEX "employees_companyId_idx" ON "employees"("companyId");

-- CreateIndex
CREATE INDEX "employees_departmentId_idx" ON "employees"("departmentId");

-- CreateIndex
CREATE INDEX "employees_employmentStatus_idx" ON "employees"("employmentStatus");

-- CreateIndex
CREATE UNIQUE INDEX "work_locations_locationCode_key" ON "work_locations"("locationCode");

-- CreateIndex
CREATE INDEX "work_locations_companyId_idx" ON "work_locations"("companyId");

-- CreateIndex
CREATE INDEX "work_locations_locationType_idx" ON "work_locations"("locationType");

-- CreateIndex
CREATE UNIQUE INDEX "shift_templates_shiftCode_key" ON "shift_templates"("shiftCode");

-- CreateIndex
CREATE INDEX "shift_templates_companyId_idx" ON "shift_templates"("companyId");

-- CreateIndex
CREATE INDEX "employee_default_shifts_employeeId_idx" ON "employee_default_shifts"("employeeId");

-- CreateIndex
CREATE INDEX "work_schedules_date_idx" ON "work_schedules"("date");

-- CreateIndex
CREATE UNIQUE INDEX "work_schedules_employeeId_date_key" ON "work_schedules"("employeeId", "date");

-- CreateIndex
CREATE INDEX "location_assignments_employeeId_date_idx" ON "location_assignments"("employeeId", "date");

-- CreateIndex
CREATE INDEX "location_assignments_workLocationId_date_idx" ON "location_assignments"("workLocationId", "date");

-- CreateIndex
CREATE INDEX "attendance_daily_summaries_companyId_date_idx" ON "attendance_daily_summaries"("companyId", "date");

-- CreateIndex
CREATE INDEX "attendance_daily_summaries_attendanceStatus_idx" ON "attendance_daily_summaries"("attendanceStatus");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_daily_summaries_employeeId_date_key" ON "attendance_daily_summaries"("employeeId", "date");

-- CreateIndex
CREATE INDEX "attendance_events_employeeId_eventTime_idx" ON "attendance_events"("employeeId", "eventTime");

-- CreateIndex
CREATE INDEX "attendance_photos_employeeId_idx" ON "attendance_photos"("employeeId");

-- CreateIndex
CREATE INDEX "attendance_adjustments_dailySummaryId_idx" ON "attendance_adjustments"("dailySummaryId");

-- CreateIndex
CREATE INDEX "attendance_adjustments_employeeId_idx" ON "attendance_adjustments"("employeeId");

-- CreateIndex
CREATE INDEX "leave_records_employeeId_startDate_endDate_idx" ON "leave_records"("employeeId", "startDate", "endDate");

-- CreateIndex
CREATE INDEX "leave_records_companyId_idx" ON "leave_records"("companyId");

-- CreateIndex
CREATE INDEX "holidays_holidayDate_idx" ON "holidays"("holidayDate");

-- CreateIndex
CREATE INDEX "holidays_companyId_idx" ON "holidays"("companyId");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_entity_entityId_idx" ON "audit_logs"("entity", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_company_accesses" ADD CONSTRAINT "user_company_accesses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_company_accesses" ADD CONSTRAINT "user_company_accesses_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_defaultShiftId_fkey" FOREIGN KEY ("defaultShiftId") REFERENCES "shift_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_defaultLocationId_fkey" FOREIGN KEY ("defaultLocationId") REFERENCES "work_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_locations" ADD CONSTRAINT "work_locations_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shift_templates" ADD CONSTRAINT "shift_templates_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_default_shifts" ADD CONSTRAINT "employee_default_shifts_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_default_shifts" ADD CONSTRAINT "employee_default_shifts_shiftTemplateId_fkey" FOREIGN KEY ("shiftTemplateId") REFERENCES "shift_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_schedules" ADD CONSTRAINT "work_schedules_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_schedules" ADD CONSTRAINT "work_schedules_shiftTemplateId_fkey" FOREIGN KEY ("shiftTemplateId") REFERENCES "shift_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "location_assignments" ADD CONSTRAINT "location_assignments_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "location_assignments" ADD CONSTRAINT "location_assignments_workLocationId_fkey" FOREIGN KEY ("workLocationId") REFERENCES "work_locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "location_assignments" ADD CONSTRAINT "location_assignments_shiftTemplateId_fkey" FOREIGN KEY ("shiftTemplateId") REFERENCES "shift_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_daily_summaries" ADD CONSTRAINT "attendance_daily_summaries_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_daily_summaries" ADD CONSTRAINT "attendance_daily_summaries_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_daily_summaries" ADD CONSTRAINT "attendance_daily_summaries_scheduledShiftId_fkey" FOREIGN KEY ("scheduledShiftId") REFERENCES "shift_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_daily_summaries" ADD CONSTRAINT "attendance_daily_summaries_scheduledLocationId_fkey" FOREIGN KEY ("scheduledLocationId") REFERENCES "work_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_events" ADD CONSTRAINT "attendance_events_attendanceDailySummaryId_fkey" FOREIGN KEY ("attendanceDailySummaryId") REFERENCES "attendance_daily_summaries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_events" ADD CONSTRAINT "attendance_events_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_photos" ADD CONSTRAINT "attendance_photos_attendanceEventId_fkey" FOREIGN KEY ("attendanceEventId") REFERENCES "attendance_events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_photos" ADD CONSTRAINT "attendance_photos_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_adjustments" ADD CONSTRAINT "attendance_adjustments_dailySummaryId_fkey" FOREIGN KEY ("dailySummaryId") REFERENCES "attendance_daily_summaries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_adjustments" ADD CONSTRAINT "attendance_adjustments_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_adjustments" ADD CONSTRAINT "attendance_adjustments_adjustedById_fkey" FOREIGN KEY ("adjustedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_records" ADD CONSTRAINT "leave_records_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_records" ADD CONSTRAINT "leave_records_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "holidays" ADD CONSTRAINT "holidays_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

