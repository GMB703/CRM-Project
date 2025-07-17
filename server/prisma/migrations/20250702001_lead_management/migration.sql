-- CreateEnum
CREATE TYPE "LeadStageType" AS ENUM (
  'NEW',
  'CONTACTED',
  'QUALIFIED',
  'PROPOSAL',
  'NEGOTIATION',
  'CLOSED_WON',
  'CLOSED_LOST'
);

-- CreateEnum
CREATE TYPE "LeadActivityType" AS ENUM (
  'CALL',
  'EMAIL',
  'MEETING',
  'NOTE',
  'STAGE_CHANGE',
  'DEMO',
  'QUOTE_SENT',
  'FOLLOW_UP',
  'CONVERSION',
  'OTHER'
);

-- AlterEnum
ALTER TYPE "ClientStatus" ADD VALUE 'QUALIFIED';
ALTER TYPE "ClientStatus" ADD VALUE 'CONVERTED';
ALTER TYPE "ClientStatus" ADD VALUE 'UNQUALIFIED';

-- CreateTable
CREATE TABLE "lead_stages" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "color" TEXT DEFAULT '#1976d2',
  "order" INTEGER NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "organizationId" TEXT NOT NULL,
  CONSTRAINT "lead_stages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_source_configs" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "organizationId" TEXT NOT NULL,
  CONSTRAINT "lead_source_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_activities" (
  "id" TEXT NOT NULL,
  "type" "LeadActivityType" NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "outcome" TEXT,
  "nextAction" TEXT,
  "duration" INTEGER,
  "scheduledAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "organizationId" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  CONSTRAINT "lead_activities_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "clients" 
  ADD COLUMN "leadStage" TEXT,
  ADD COLUMN "assignedUserId" TEXT,
  ADD COLUMN "leadScore" INTEGER,
  ADD COLUMN "lastContactedAt" TIMESTAMP(3),
  ADD COLUMN "nextFollowUpAt" TIMESTAMP(3),
  ADD COLUMN "convertedAt" TIMESTAMP(3),
  ADD COLUMN "estimatedValue" DECIMAL(10,2),
  ADD COLUMN "actualValue" DECIMAL(10,2),
  ADD COLUMN "inactivityThreshold" INTEGER DEFAULT 7,
  ADD COLUMN "reminderFrequency" INTEGER DEFAULT 1,
  ADD COLUMN "lastReminderSentAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "lead_stages_organizationId_name_key" ON "lead_stages"("organizationId", "name");
CREATE INDEX "lead_stages_organizationId_idx" ON "lead_stages"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "lead_source_configs_organizationId_name_key" ON "lead_source_configs"("organizationId", "name");
CREATE INDEX "lead_source_configs_organizationId_idx" ON "lead_source_configs"("organizationId");

-- CreateIndex
CREATE INDEX "lead_activities_organizationId_idx" ON "lead_activities"("organizationId");
CREATE INDEX "lead_activities_clientId_idx" ON "lead_activities"("clientId");
CREATE INDEX "lead_activities_userId_idx" ON "lead_activities"("userId");
CREATE INDEX "lead_activities_type_idx" ON "lead_activities"("type");
CREATE INDEX "lead_activities_createdAt_idx" ON "lead_activities"("createdAt");

-- CreateIndex
CREATE INDEX "clients_organizationId_leadStage_idx" ON "clients"("organizationId", "leadStage");
CREATE INDEX "clients_organizationId_assignedUserId_idx" ON "clients"("organizationId", "assignedUserId");
CREATE INDEX "clients_organizationId_nextFollowUpAt_idx" ON "clients"("organizationId", "nextFollowUpAt");
CREATE INDEX "clients_organizationId_leadScore_idx" ON "clients"("organizationId", "leadScore");

-- AddForeignKey
ALTER TABLE "lead_stages" ADD CONSTRAINT "lead_stages_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_source_configs" ADD CONSTRAINT "lead_source_configs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE; 