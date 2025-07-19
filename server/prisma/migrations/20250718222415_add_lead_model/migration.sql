/*
  Warnings:

  - You are about to drop the column `assignedUserId` on the `clients` table. All the data in the column will be lost.
  - You are about to drop the column `convertedAt` on the `clients` table. All the data in the column will be lost.
  - You are about to drop the column `estimatedValue` on the `clients` table. All the data in the column will be lost.
  - You are about to drop the column `inactivityThreshold` on the `clients` table. All the data in the column will be lost.
  - You are about to drop the column `lastContactedAt` on the `clients` table. All the data in the column will be lost.
  - You are about to drop the column `lastReminderSentAt` on the `clients` table. All the data in the column will be lost.
  - You are about to drop the column `leadScore` on the `clients` table. All the data in the column will be lost.
  - You are about to drop the column `leadStage` on the `clients` table. All the data in the column will be lost.
  - You are about to drop the column `nextFollowUpAt` on the `clients` table. All the data in the column will be lost.
  - You are about to drop the column `reminderFrequency` on the `clients` table. All the data in the column will be lost.
  - You are about to drop the column `source` on the `clients` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `clients` table. All the data in the column will be lost.
  - You are about to drop the column `tags` on the `clients` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "clients" DROP CONSTRAINT "clients_assignedUserId_fkey";

-- DropIndex
DROP INDEX "clients_organizationId_assignedUserId_idx";

-- DropIndex
DROP INDEX "clients_organizationId_leadScore_idx";

-- DropIndex
DROP INDEX "clients_organizationId_leadStage_idx";

-- DropIndex
DROP INDEX "clients_organizationId_nextFollowUpAt_idx";

-- DropIndex
DROP INDEX "clients_organizationId_source_idx";

-- DropIndex
DROP INDEX "clients_organizationId_status_idx";

-- AlterTable
ALTER TABLE "clients" DROP COLUMN "assignedUserId",
DROP COLUMN "convertedAt",
DROP COLUMN "estimatedValue",
DROP COLUMN "inactivityThreshold",
DROP COLUMN "lastContactedAt",
DROP COLUMN "lastReminderSentAt",
DROP COLUMN "leadScore",
DROP COLUMN "leadStage",
DROP COLUMN "nextFollowUpAt",
DROP COLUMN "reminderFrequency",
DROP COLUMN "source",
DROP COLUMN "status",
DROP COLUMN "tags";

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "company" TEXT,
    "source" "LeadSource",
    "tags" TEXT[],
    "status" "ClientStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT NOT NULL,
    "assignedUserId" TEXT,
    "leadScore" INTEGER,
    "lastContactedAt" TIMESTAMP(3),
    "nextFollowUpAt" TIMESTAMP(3),
    "estimatedValue" DECIMAL(10,2),
    "userId" TEXT,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "leads_organizationId_idx" ON "leads"("organizationId");

-- CreateIndex
CREATE INDEX "leads_organizationId_status_idx" ON "leads"("organizationId", "status");

-- CreateIndex
CREATE INDEX "leads_organizationId_createdAt_idx" ON "leads"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "leads_organizationId_source_idx" ON "leads"("organizationId", "source");

-- CreateIndex
CREATE INDEX "leads_organizationId_assignedUserId_idx" ON "leads"("organizationId", "assignedUserId");

-- CreateIndex
CREATE INDEX "leads_organizationId_nextFollowUpAt_idx" ON "leads"("organizationId", "nextFollowUpAt");

-- CreateIndex
CREATE INDEX "leads_organizationId_leadScore_idx" ON "leads"("organizationId", "leadScore");

-- CreateIndex
CREATE UNIQUE INDEX "leads_email_organizationId_key" ON "leads"("email", "organizationId");

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
