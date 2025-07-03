-- Add missing enum
CREATE TYPE "OrganizationRole" AS ENUM ('OWNER', 'ADMIN', 'MANAGER', 'MEMBER', 'GUEST');

-- Add missing enum
CREATE TYPE "DiscountType" AS ENUM ('NONE', 'PERCENTAGE', 'FIXED_AMOUNT');

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "logo" TEXT,
    "primaryColor" TEXT,
    "settings" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_settings" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "primaryColor" TEXT DEFAULT '#1976d2',
    "secondaryColor" TEXT DEFAULT '#dc004e',
    "accentColor" TEXT DEFAULT '#f50057',
    "logoUrl" TEXT,
    "faviconUrl" TEXT,
    "companyName" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "address" JSONB,
    "enabledFeatures" JSONB DEFAULT '["crm", "projects"]',
    "sidebarCollapsed" BOOLEAN DEFAULT false,
    "darkMode" BOOLEAN DEFAULT false,
    "language" TEXT DEFAULT 'en',
    "timezone" TEXT DEFAULT 'UTC',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_organizations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "role" "OrganizationRole" NOT NULL DEFAULT 'MEMBER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estimate_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,

    CONSTRAINT "estimate_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estimate_template_line_items" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "serviceType" TEXT,
    "category" TEXT,
    "defaultQuantity" DECIMAL(10,2) NOT NULL DEFAULT 1,
    "defaultUnitPrice" DECIMAL(10,2) NOT NULL,
    "laborHours" DECIMAL(5,2),
    "materialCost" DECIMAL(10,2),
    "markup" DECIMAL(5,4) DEFAULT 0,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "templateId" TEXT NOT NULL,

    CONSTRAINT "estimate_template_line_items_pkey" PRIMARY KEY ("id")
);

-- Add organizationId to existing tables
ALTER TABLE "users" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "users" ADD COLUMN "organizationRole" "OrganizationRole" NOT NULL DEFAULT 'MEMBER';

ALTER TABLE "clients" ADD COLUMN "organizationId" TEXT;

ALTER TABLE "projects" ADD COLUMN "organizationId" TEXT;

-- Update estimates table
ALTER TABLE "estimates" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "estimates" ADD COLUMN "estimateNumber" TEXT;
ALTER TABLE "estimates" ADD COLUMN "portalUrl" TEXT;
ALTER TABLE "estimates" ADD COLUMN "portalToken" TEXT;
ALTER TABLE "estimates" ADD COLUMN "discountType" "DiscountType" NOT NULL DEFAULT 'NONE';
ALTER TABLE "estimates" ADD COLUMN "discountValue" DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE "estimates" ADD COLUMN "subtotal" DECIMAL(10,2);
ALTER TABLE "estimates" ADD COLUMN "taxAmount" DECIMAL(10,2);
ALTER TABLE "estimates" ADD COLUMN "notes" TEXT;
ALTER TABLE "estimates" ADD COLUMN "terms" TEXT;

-- Update estimate_line_items table
ALTER TABLE "estimate_line_items" ADD COLUMN "serviceType" TEXT;
ALTER TABLE "estimate_line_items" ADD COLUMN "category" TEXT;
ALTER TABLE "estimate_line_items" ADD COLUMN "laborHours" DECIMAL(5,2);
ALTER TABLE "estimate_line_items" ADD COLUMN "materialCost" DECIMAL(10,2);
ALTER TABLE "estimate_line_items" ADD COLUMN "markup" DECIMAL(5,4) DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "organizations_code_key" ON "organizations"("code");

-- CreateIndex
CREATE UNIQUE INDEX "organization_settings_organizationId_key" ON "organization_settings"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "user_organizations_userId_organizationId_key" ON "user_organizations"("userId", "organizationId");

-- CreateIndex
CREATE INDEX "user_organizations_userId_idx" ON "user_organizations"("userId");

-- CreateIndex
CREATE INDEX "user_organizations_organizationId_idx" ON "user_organizations"("organizationId");

-- CreateIndex
CREATE INDEX "user_organizations_organizationId_role_idx" ON "user_organizations"("organizationId", "role");

-- CreateIndex
CREATE INDEX "user_organizations_userId_isActive_idx" ON "user_organizations"("userId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_organizationId_key" ON "users"("email", "organizationId");

-- CreateIndex
CREATE INDEX "users_organizationId_idx" ON "users"("organizationId");

-- CreateIndex
CREATE INDEX "users_organizationId_role_idx" ON "users"("organizationId", "role");

-- CreateIndex
CREATE INDEX "users_organizationId_isActive_idx" ON "users"("organizationId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "clients_email_organizationId_key" ON "clients"("email", "organizationId");

-- CreateIndex
CREATE INDEX "clients_organizationId_idx" ON "clients"("organizationId");

-- CreateIndex
CREATE INDEX "clients_organizationId_status_idx" ON "clients"("organizationId", "status");

-- CreateIndex
CREATE INDEX "clients_organizationId_createdAt_idx" ON "clients"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "clients_organizationId_source_idx" ON "clients"("organizationId", "source");

-- CreateIndex
CREATE INDEX "projects_organizationId_idx" ON "projects"("organizationId");

-- CreateIndex
CREATE INDEX "projects_organizationId_status_idx" ON "projects"("organizationId", "status");

-- CreateIndex
CREATE INDEX "projects_organizationId_stage_idx" ON "projects"("organizationId", "stage");

-- CreateIndex
CREATE INDEX "projects_organizationId_priority_idx" ON "projects"("organizationId", "priority");

-- CreateIndex
CREATE INDEX "projects_organizationId_isActive_idx" ON "projects"("organizationId", "isActive");

-- CreateIndex
CREATE INDEX "projects_organizationId_createdAt_idx" ON "projects"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "projects_clientId_organizationId_idx" ON "projects"("clientId", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "estimates_estimateNumber_key" ON "estimates"("estimateNumber");

-- CreateIndex
CREATE UNIQUE INDEX "estimates_portalUrl_key" ON "estimates"("portalUrl");

-- CreateIndex
CREATE UNIQUE INDEX "estimates_portalToken_key" ON "estimates"("portalToken");

-- CreateIndex
CREATE INDEX "estimates_organizationId_idx" ON "estimates"("organizationId");

-- CreateIndex
CREATE INDEX "estimates_organizationId_status_idx" ON "estimates"("organizationId", "status");

-- CreateIndex
CREATE INDEX "estimates_organizationId_createdAt_idx" ON "estimates"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "estimate_templates_organizationId_idx" ON "estimate_templates"("organizationId");

-- CreateIndex
CREATE INDEX "estimate_templates_organizationId_isActive_idx" ON "estimate_templates"("organizationId", "isActive");

-- CreateIndex
CREATE INDEX "estimate_templates_organizationId_category_idx" ON "estimate_templates"("organizationId", "category");

-- AddForeignKey
ALTER TABLE "organization_settings" ADD CONSTRAINT "organization_settings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_organizations" ADD CONSTRAINT "user_organizations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_organizations" ADD CONSTRAINT "user_organizations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimate_templates" ADD CONSTRAINT "estimate_templates_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimate_templates" ADD CONSTRAINT "estimate_templates_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimate_template_line_items" ADD CONSTRAINT "estimate_template_line_items_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "estimate_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE; 