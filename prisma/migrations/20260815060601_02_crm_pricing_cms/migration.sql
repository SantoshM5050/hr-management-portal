-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'DEMO_SCHEDULED', 'DEMO_COMPLETED', 'TRIAL_STARTED', 'CONVERTED', 'LOST');

-- CreateTable
CREATE TABLE "plans" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "monthlyPrice" DOUBLE PRECISION NOT NULL,
    "annualPrice" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "features" JSONB NOT NULL,
    "limits" JSONB NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "orgName" TEXT NOT NULL,
    "orgTypeCode" TEXT NOT NULL,
    "peopleCount" TEXT,
    "country" TEXT,
    "preferredDate" TEXT,
    "preferredTime" TEXT,
    "modulesOfInterest" JSONB,
    "message" TEXT,
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "assignedToUserId" TEXT,
    "notes" TEXT,
    "followUpDate" TIMESTAMP(3),
    "convertedOrgId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_activities" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "performedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms_contents" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cms_contents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "plans_code_key" ON "plans"("code");

-- CreateIndex
CREATE UNIQUE INDEX "cms_contents_key_key" ON "cms_contents"("key");

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_assignedToUserId_fkey" FOREIGN KEY ("assignedToUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
