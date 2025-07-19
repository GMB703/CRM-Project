-- DropIndex
DROP INDEX "user_notification_preferences_userId_idx";

-- CreateTable
CREATE TABLE "organization_themes" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "primaryColor" TEXT NOT NULL DEFAULT '#1976d2',
    "secondaryColor" TEXT NOT NULL DEFAULT '#dc004e',
    "accentColor" TEXT NOT NULL DEFAULT '#f50057',
    "logoUrl" TEXT,
    "companyName" TEXT,
    "darkMode" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_themes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organization_themes_organizationId_key" ON "organization_themes"("organizationId");

-- AddForeignKey
ALTER TABLE "organization_themes" ADD CONSTRAINT "organization_themes_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
