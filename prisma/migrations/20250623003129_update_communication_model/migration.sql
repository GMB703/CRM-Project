/*
  Warnings:

  - You are about to drop the column `readAt` on the `communications` table. All the data in the column will be lost.
  - You are about to drop the column `sentAt` on the `communications` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `communications` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `communications` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "communications" DROP COLUMN "readAt",
DROP COLUMN "sentAt",
DROP COLUMN "status",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "direction" SET DEFAULT 'OUTBOUND';
