/*
  Warnings:

  - You are about to drop the column `content` on the `contracts` table. All the data in the column will be lost.
  - You are about to drop the column `signedAt` on the `contracts` table. All the data in the column will be lost.
  - You are about to drop the column `signedBy` on the `contracts` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `contracts` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `contracts` table. All the data in the column will be lost.
  - Added the required column `data` to the `contracts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `contracts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `url` to the `contracts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `contracts` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "contracts" DROP CONSTRAINT "contracts_estimateId_fkey";

-- AlterTable
ALTER TABLE "contracts" DROP COLUMN "content",
DROP COLUMN "signedAt",
DROP COLUMN "signedBy",
DROP COLUMN "status",
DROP COLUMN "title",
ADD COLUMN     "data" JSONB NOT NULL,
ADD COLUMN     "organizationId" TEXT NOT NULL,
ADD COLUMN     "url" TEXT NOT NULL,
ADD COLUMN     "userId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_estimateId_fkey" FOREIGN KEY ("estimateId") REFERENCES "Estimate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
