-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'ON_LEAVE', 'HOLIDAY');

-- CreateEnum
CREATE TYPE "LeaveRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TicketPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'WAITING', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN', 'TEMPORARY');

-- AlterEnum
ALTER TYPE "Status" ADD VALUE 'ARCHIVED';

-- AlterTable
ALTER TABLE "people" ADD COLUMN     "phone" TEXT;

-- CreateTable
CREATE TABLE "organization_units" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "unitType" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "unitId" TEXT,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "designations" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "gradeLevel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "designations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "locations" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "country" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_profiles" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "departmentId" TEXT,
    "designationId" TEXT,
    "locationId" TEXT,
    "employeeCode" TEXT NOT NULL,
    "employmentType" "EmploymentType" NOT NULL DEFAULT 'FULL_TIME',
    "joiningDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "managerPersonId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employment_histories" (
    "id" TEXT NOT NULL,
    "employeeProfileId" TEXT NOT NULL,
    "changeType" TEXT NOT NULL,
    "previousData" JSONB,
    "newData" JSONB NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employment_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_events" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" TEXT NOT NULL DEFAULT 'WEB',
    "location" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attendance_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_summaries" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'PRESENT',
    "workDurationMinutes" INTEGER NOT NULL DEFAULT 0,
    "overtimeMinutes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leave_types" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "defaultDaysPerYear" INTEGER NOT NULL DEFAULT 12,
    "isPaid" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leave_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leave_balances" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "leaveTypeId" TEXT NOT NULL,
    "allocatedDays" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "usedDays" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pendingDays" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leave_balances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leave_requests" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "leaveTypeId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "daysCount" DOUBLE PRECISION NOT NULL,
    "reason" TEXT,
    "status" "LeaveRequestStatus" NOT NULL DEFAULT 'PENDING',
    "approvedByUserId" TEXT,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leave_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leave_ledgers" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "transactionType" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leave_ledgers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_types" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "document_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "documentTypeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "verificationStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "expiryDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_categories" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "ticket_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tickets" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" "TicketPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "TicketStatus" NOT NULL DEFAULT 'OPEN',
    "assignedToUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academic_years" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "academic_years_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faculties" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,

    CONSTRAINT "faculties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_courses" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "facultyId" TEXT,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,

    CONSTRAINT "program_courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "batches" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sections" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_profiles" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "studentRollNo" TEXT NOT NULL,
    "admissionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_enrollments" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "studentProfileId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "student_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guardian_profiles" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "relationshipType" TEXT NOT NULL,

    CONSTRAINT "guardian_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_openings" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_openings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidates" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "jobOpeningId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "stage" TEXT NOT NULL DEFAULT 'APPLIED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "candidates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_cycles" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "review_cycles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "salary_structures" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "baseMonthlyAmount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',

    CONSTRAINT "salary_structures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_runs" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "periodName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "processedCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payroll_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payslips" (
    "id" TEXT NOT NULL,
    "payrollRunId" TEXT NOT NULL,
    "salaryStructureId" TEXT,
    "netAmount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payslips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_field_definitions" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "entityName" TEXT NOT NULL,
    "fieldKey" TEXT NOT NULL,
    "fieldLabel" TEXT NOT NULL,
    "fieldType" TEXT NOT NULL,
    "options" JSONB,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "custom_field_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_definitions" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "entityName" TEXT NOT NULL,
    "schema" JSONB NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "form_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_definitions" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "entityName" TEXT NOT NULL,
    "states" JSONB NOT NULL,
    "transitions" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workflow_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'INFO',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organization_units_organizationId_code_key" ON "organization_units"("organizationId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "departments_organizationId_code_key" ON "departments"("organizationId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "designations_organizationId_code_key" ON "designations"("organizationId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "locations_organizationId_code_key" ON "locations"("organizationId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "employee_profiles_personId_key" ON "employee_profiles"("personId");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_summaries_organizationId_personId_date_key" ON "attendance_summaries"("organizationId", "personId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "leave_types_organizationId_code_key" ON "leave_types"("organizationId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "leave_balances_organizationId_personId_leaveTypeId_key" ON "leave_balances"("organizationId", "personId", "leaveTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "document_types_organizationId_code_key" ON "document_types"("organizationId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "ticket_categories_organizationId_code_key" ON "ticket_categories"("organizationId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "faculties_organizationId_code_key" ON "faculties"("organizationId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "program_courses_organizationId_code_key" ON "program_courses"("organizationId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "student_profiles_personId_key" ON "student_profiles"("personId");

-- CreateIndex
CREATE UNIQUE INDEX "guardian_profiles_personId_key" ON "guardian_profiles"("personId");

-- CreateIndex
CREATE UNIQUE INDEX "custom_field_definitions_organizationId_entityName_fieldKey_key" ON "custom_field_definitions"("organizationId", "entityName", "fieldKey");

-- AddForeignKey
ALTER TABLE "organization_units" ADD CONSTRAINT "organization_units_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_units" ADD CONSTRAINT "organization_units_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "organization_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "organization_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "designations" ADD CONSTRAINT "designations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "locations" ADD CONSTRAINT "locations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_profiles" ADD CONSTRAINT "employee_profiles_personId_fkey" FOREIGN KEY ("personId") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_profiles" ADD CONSTRAINT "employee_profiles_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_profiles" ADD CONSTRAINT "employee_profiles_designationId_fkey" FOREIGN KEY ("designationId") REFERENCES "designations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_profiles" ADD CONSTRAINT "employee_profiles_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employment_histories" ADD CONSTRAINT "employment_histories_employeeProfileId_fkey" FOREIGN KEY ("employeeProfileId") REFERENCES "employee_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_events" ADD CONSTRAINT "attendance_events_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_events" ADD CONSTRAINT "attendance_events_personId_fkey" FOREIGN KEY ("personId") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_summaries" ADD CONSTRAINT "attendance_summaries_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_summaries" ADD CONSTRAINT "attendance_summaries_personId_fkey" FOREIGN KEY ("personId") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_types" ADD CONSTRAINT "leave_types_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_balances" ADD CONSTRAINT "leave_balances_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_balances" ADD CONSTRAINT "leave_balances_personId_fkey" FOREIGN KEY ("personId") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_balances" ADD CONSTRAINT "leave_balances_leaveTypeId_fkey" FOREIGN KEY ("leaveTypeId") REFERENCES "leave_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_personId_fkey" FOREIGN KEY ("personId") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_leaveTypeId_fkey" FOREIGN KEY ("leaveTypeId") REFERENCES "leave_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_ledgers" ADD CONSTRAINT "leave_ledgers_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_ledgers" ADD CONSTRAINT "leave_ledgers_personId_fkey" FOREIGN KEY ("personId") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_types" ADD CONSTRAINT "document_types_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_personId_fkey" FOREIGN KEY ("personId") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_documentTypeId_fkey" FOREIGN KEY ("documentTypeId") REFERENCES "document_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_categories" ADD CONSTRAINT "ticket_categories_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_personId_fkey" FOREIGN KEY ("personId") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ticket_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_assignedToUserId_fkey" FOREIGN KEY ("assignedToUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academic_years" ADD CONSTRAINT "academic_years_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faculties" ADD CONSTRAINT "faculties_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_courses" ADD CONSTRAINT "program_courses_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_courses" ADD CONSTRAINT "program_courses_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "faculties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batches" ADD CONSTRAINT "batches_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batches" ADD CONSTRAINT "batches_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "program_courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sections" ADD CONSTRAINT "sections_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sections" ADD CONSTRAINT "sections_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_personId_fkey" FOREIGN KEY ("personId") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_enrollments" ADD CONSTRAINT "student_enrollments_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_enrollments" ADD CONSTRAINT "student_enrollments_studentProfileId_fkey" FOREIGN KEY ("studentProfileId") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_enrollments" ADD CONSTRAINT "student_enrollments_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "academic_years"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_enrollments" ADD CONSTRAINT "student_enrollments_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guardian_profiles" ADD CONSTRAINT "guardian_profiles_personId_fkey" FOREIGN KEY ("personId") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_openings" ADD CONSTRAINT "job_openings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_jobOpeningId_fkey" FOREIGN KEY ("jobOpeningId") REFERENCES "job_openings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_cycles" ADD CONSTRAINT "review_cycles_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salary_structures" ADD CONSTRAINT "salary_structures_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_runs" ADD CONSTRAINT "payroll_runs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_payrollRunId_fkey" FOREIGN KEY ("payrollRunId") REFERENCES "payroll_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_salaryStructureId_fkey" FOREIGN KEY ("salaryStructureId") REFERENCES "salary_structures"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_field_definitions" ADD CONSTRAINT "custom_field_definitions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_definitions" ADD CONSTRAINT "form_definitions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_definitions" ADD CONSTRAINT "workflow_definitions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
