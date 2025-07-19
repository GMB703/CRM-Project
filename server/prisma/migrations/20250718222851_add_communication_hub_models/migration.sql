/*
  Warnings:

  - You are about to drop the column `bodyHtml` on the `message_history` table. All the data in the column will be lost.
  - You are about to drop the column `bodyText` on the `message_history` table. All the data in the column will be lost.
  - You are about to drop the column `clickedAt` on the `message_history` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `message_history` table. All the data in the column will be lost.
  - You are about to drop the column `deliveredAt` on the `message_history` table. All the data in the column will be lost.
  - You are about to drop the column `direction` on the `message_history` table. All the data in the column will be lost.
  - You are about to drop the column `errorMessage` on the `message_history` table. All the data in the column will be lost.
  - You are about to drop the column `externalId` on the `message_history` table. All the data in the column will be lost.
  - You are about to drop the column `externalStatus` on the `message_history` table. All the data in the column will be lost.
  - You are about to drop the column `failedAt` on the `message_history` table. All the data in the column will be lost.
  - You are about to drop the column `readAt` on the `message_history` table. All the data in the column will be lost.
  - You are about to drop the column `recipientEmail` on the `message_history` table. All the data in the column will be lost.
  - You are about to drop the column `recipientName` on the `message_history` table. All the data in the column will be lost.
  - You are about to drop the column `recipientPhone` on the `message_history` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `message_history` table. All the data in the column will be lost.
  - You are about to drop the column `templateId` on the `message_history` table. All the data in the column will be lost.
  - You are about to drop the column `templateVariables` on the `message_history` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `message_history` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `message_history` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `message_history` table. All the data in the column will be lost.
  - You are about to drop the column `bodyHtml` on the `message_templates` table. All the data in the column will be lost.
  - You are about to drop the column `bodyText` on the `message_templates` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `message_templates` table. All the data in the column will be lost.
  - You are about to drop the column `createdById` on the `message_templates` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `message_templates` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `message_templates` table. All the data in the column will be lost.
  - You are about to drop the column `lastUsedAt` on the `message_templates` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `message_templates` table. All the data in the column will be lost.
  - You are about to drop the column `usageCount` on the `message_templates` table. All the data in the column will be lost.
  - You are about to drop the column `variables` on the `message_templates` table. All the data in the column will be lost.
  - Added the required column `body` to the `message_history` table without a default value. This is not possible if the table is not empty.
  - Added the required column `recipientId` to the `message_history` table without a default value. This is not possible if the table is not empty.
  - Added the required column `senderId` to the `message_history` table without a default value. This is not possible if the table is not empty.
  - Made the column `subject` on table `message_history` required. This step will fail if there are existing NULL values in that column.
  - Made the column `sentAt` on table `message_history` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `body` to the `message_templates` table without a default value. This is not possible if the table is not empty.
  - Added the required column `creatorId` to the `message_templates` table without a default value. This is not possible if the table is not empty.
  - Made the column `subject` on table `message_templates` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "message_history" DROP CONSTRAINT "message_history_clientId_fkey";

-- DropForeignKey
ALTER TABLE "message_history" DROP CONSTRAINT "message_history_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "message_history" DROP CONSTRAINT "message_history_projectId_fkey";

-- DropForeignKey
ALTER TABLE "message_history" DROP CONSTRAINT "message_history_templateId_fkey";

-- DropForeignKey
ALTER TABLE "message_history" DROP CONSTRAINT "message_history_userId_fkey";

-- DropForeignKey
ALTER TABLE "message_templates" DROP CONSTRAINT "message_templates_createdById_fkey";

-- DropForeignKey
ALTER TABLE "message_templates" DROP CONSTRAINT "message_templates_organizationId_fkey";

-- DropIndex
DROP INDEX "message_history_clientId_createdAt_idx";

-- DropIndex
DROP INDEX "message_history_clientId_idx";

-- DropIndex
DROP INDEX "message_history_externalId_idx";

-- DropIndex
DROP INDEX "message_history_organizationId_createdAt_idx";

-- DropIndex
DROP INDEX "message_history_organizationId_idx";

-- DropIndex
DROP INDEX "message_history_organizationId_status_idx";

-- DropIndex
DROP INDEX "message_history_organizationId_type_idx";

-- DropIndex
DROP INDEX "message_history_projectId_idx";

-- DropIndex
DROP INDEX "message_history_userId_idx";

-- DropIndex
DROP INDEX "message_templates_name_organizationId_key";

-- DropIndex
DROP INDEX "message_templates_organizationId_category_idx";

-- DropIndex
DROP INDEX "message_templates_organizationId_idx";

-- DropIndex
DROP INDEX "message_templates_organizationId_isActive_idx";

-- DropIndex
DROP INDEX "message_templates_organizationId_type_idx";

-- AlterTable
ALTER TABLE "message_history" DROP COLUMN "bodyHtml",
DROP COLUMN "bodyText",
DROP COLUMN "clickedAt",
DROP COLUMN "createdAt",
DROP COLUMN "deliveredAt",
DROP COLUMN "direction",
DROP COLUMN "errorMessage",
DROP COLUMN "externalId",
DROP COLUMN "externalStatus",
DROP COLUMN "failedAt",
DROP COLUMN "readAt",
DROP COLUMN "recipientEmail",
DROP COLUMN "recipientName",
DROP COLUMN "recipientPhone",
DROP COLUMN "status",
DROP COLUMN "templateId",
DROP COLUMN "templateVariables",
DROP COLUMN "type",
DROP COLUMN "updatedAt",
DROP COLUMN "userId",
ADD COLUMN     "body" TEXT NOT NULL,
ADD COLUMN     "recipientId" TEXT NOT NULL,
ADD COLUMN     "senderId" TEXT NOT NULL,
ALTER COLUMN "subject" SET NOT NULL,
ALTER COLUMN "sentAt" SET NOT NULL,
ALTER COLUMN "sentAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "message_templates" DROP COLUMN "bodyHtml",
DROP COLUMN "bodyText",
DROP COLUMN "category",
DROP COLUMN "createdById",
DROP COLUMN "description",
DROP COLUMN "isActive",
DROP COLUMN "lastUsedAt",
DROP COLUMN "type",
DROP COLUMN "usageCount",
DROP COLUMN "variables",
ADD COLUMN     "body" TEXT NOT NULL,
ADD COLUMN     "creatorId" TEXT NOT NULL,
ALTER COLUMN "subject" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "message_templates" ADD CONSTRAINT "message_templates_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_templates" ADD CONSTRAINT "message_templates_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_history" ADD CONSTRAINT "message_history_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_history" ADD CONSTRAINT "message_history_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_history" ADD CONSTRAINT "message_history_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_history" ADD CONSTRAINT "message_history_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_history" ADD CONSTRAINT "message_history_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
