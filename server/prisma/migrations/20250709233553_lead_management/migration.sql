/*
  Warnings:

  - You are about to drop the `estimate_line_items` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `estimates` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `organization_settings` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[email]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CHANGES_REQUESTED');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('DEPOSIT', 'MILESTONE', 'FINAL', 'FULL');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'PAID', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "MessageTemplateCategory" AS ENUM ('WELCOME', 'FOLLOW_UP', 'PROPOSAL', 'REMINDER', 'THANK_YOU', 'MARKETING', 'SUPPORT', 'INVOICE', 'ESTIMATE', 'PROJECT_UPDATE', 'LEAD_NURTURE', 'APPOINTMENT', 'CUSTOM');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('PENDING', 'QUEUED', 'SENDING', 'SENT', 'DELIVERED', 'READ', 'CLICKED', 'FAILED', 'BOUNCED', 'SPAM', 'UNSUBSCRIBED');

-- CreateEnum
CREATE TYPE "AutomationTriggerType" AS ENUM ('LEAD_CREATED', 'LEAD_STAGE_CHANGED', 'LEAD_ASSIGNED', 'FOLLOW_UP_DUE', 'LEAD_INACTIVE', 'PROJECT_STATUS_CHANGED', 'ESTIMATE_SENT', 'ESTIMATE_VIEWED', 'ESTIMATE_APPROVED', 'ESTIMATE_EXPIRED', 'INVOICE_SENT', 'PAYMENT_RECEIVED', 'CUSTOM_DATE', 'CUSTOM_FIELD_CHANGED');

-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('LEAD_PIPELINE', 'LEAD_CONVERSION', 'REVENUE_ANALYTICS', 'USER_PERFORMANCE', 'PROJECT_ANALYTICS', 'ESTIMATE_ANALYTICS', 'COMMUNICATION_METRICS', 'CUSTOM_REPORT');

-- CreateEnum
CREATE TYPE "AnalyticsMetricType" AS ENUM ('COUNT', 'SUM', 'AVERAGE', 'PERCENTAGE', 'RATIO', 'GROWTH_RATE');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "EstimateStatus" ADD VALUE 'PENDING_APPROVAL';
ALTER TYPE "EstimateStatus" ADD VALUE 'APPROVED';
ALTER TYPE "EstimateStatus" ADD VALUE 'VIEWED';
ALTER TYPE "EstimateStatus" ADD VALUE 'CONVERTED';

-- AlterEnum
ALTER TYPE "LeadActivityType" ADD VALUE 'TASK';

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'INACTIVITY_REMINDER';

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'SUPER_ADMIN';

-- DropForeignKey
ALTER TABLE "contracts" DROP CONSTRAINT "contracts_estimateId_fkey";

-- DropForeignKey
ALTER TABLE "estimate_line_items" DROP CONSTRAINT "estimate_line_items_estimateId_fkey";

-- DropForeignKey
ALTER TABLE "estimates" DROP CONSTRAINT "estimates_clientId_fkey";

-- DropForeignKey
ALTER TABLE "estimates" DROP CONSTRAINT "estimates_creatorId_fkey";

-- DropForeignKey
ALTER TABLE "estimates" DROP CONSTRAINT "estimates_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "estimates" DROP CONSTRAINT "estimates_projectId_fkey";

-- DropForeignKey
ALTER TABLE "estimates" DROP CONSTRAINT "estimates_templateId_fkey";

-- DropForeignKey
ALTER TABLE "organization_settings" DROP CONSTRAINT "organization_settings_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_organizationId_fkey";

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "firstName" DROP NOT NULL,
ALTER COLUMN "lastName" DROP NOT NULL,
ALTER COLUMN "organizationId" DROP NOT NULL;

-- DropTable
DROP TABLE "estimate_line_items";

-- DropTable
DROP TABLE "estimates";

-- DropTable
DROP TABLE "organization_settings";

-- DropEnum
DROP TYPE "LeadStageType";

-- CreateTable
CREATE TABLE "OrganizationSettings" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "defaultCurrency" TEXT NOT NULL DEFAULT 'USD',
    "defaultTimeZone" TEXT NOT NULL DEFAULT 'UTC',
    "defaultDateFormat" TEXT NOT NULL DEFAULT 'YYYY-MM-DD',
    "defaultLanguage" TEXT NOT NULL DEFAULT 'en',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
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

    CONSTRAINT "OrganizationSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Estimate" (
    "id" TEXT NOT NULL,
    "referenceNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "EstimateStatus" NOT NULL DEFAULT 'DRAFT',
    "organizationId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "projectId" TEXT,
    "creatorId" TEXT NOT NULL,
    "approvedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "subtotal" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "taxRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "requiresApproval" BOOLEAN NOT NULL DEFAULT false,
    "isTemplate" BOOLEAN NOT NULL DEFAULT false,
    "templateName" TEXT,
    "templateId" TEXT,
    "pdfPath" TEXT,
    "pdfGeneratedAt" TIMESTAMP(3),
    "paymentTerms" TEXT,
    "depositRequired" BOOLEAN NOT NULL DEFAULT false,
    "depositAmount" DECIMAL(10,2),
    "depositPercentage" DECIMAL(5,2),

    CONSTRAINT "Estimate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EstimateLineItem" (
    "id" TEXT NOT NULL,
    "estimateId" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "description" TEXT,
    "sku" TEXT,
    "category" TEXT,
    "room" TEXT,
    "quantity" DECIMAL(10,2) NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'ea',
    "unitCost" DECIMAL(10,2) NOT NULL,
    "markup" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "lineTotal" DECIMAL(10,2) NOT NULL,
    "taxable" BOOLEAN NOT NULL DEFAULT true,
    "taxRate" DECIMAL(5,2),
    "organizationId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "catalogItemId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EstimateLineItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatalogItem" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sku" TEXT,
    "category" TEXT,
    "defaultCost" DECIMAL(10,2) NOT NULL,
    "defaultMarkup" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "defaultPrice" DECIMAL(10,2) NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'ea',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "taxable" BOOLEAN NOT NULL DEFAULT true,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "lastUsed" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "CatalogItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EstimateApproval" (
    "id" TEXT NOT NULL,
    "estimateId" TEXT NOT NULL,
    "status" "ApprovalStatus" NOT NULL,
    "comments" TEXT,
    "approvedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EstimateApproval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EstimatePayment" (
    "id" TEXT NOT NULL,
    "estimateId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "paymentType" "PaymentType" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "dueDate" TIMESTAMP(3),
    "paidDate" TIMESTAMP(3),
    "stripePaymentId" TEXT,
    "paymentMethod" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EstimatePayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EstimateEmailLog" (
    "id" TEXT NOT NULL,
    "estimateId" TEXT NOT NULL,
    "toEmail" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentById" TEXT NOT NULL,
    "delivered" BOOLEAN NOT NULL DEFAULT false,
    "opened" BOOLEAN NOT NULL DEFAULT false,
    "clicked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "EstimateEmailLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "MessageTemplateCategory" NOT NULL,
    "type" "CommunicationType" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "subject" TEXT,
    "bodyText" TEXT NOT NULL,
    "bodyHtml" TEXT,
    "variables" JSONB,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" TIMESTAMP(3),
    "organizationId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "message_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "communication_channels" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "CommunicationType" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "config" JSONB,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "dailyLimit" INTEGER,
    "monthlyLimit" INTEGER,
    "currentDaily" INTEGER NOT NULL DEFAULT 0,
    "currentMonthly" INTEGER NOT NULL DEFAULT 0,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "communication_channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_history" (
    "id" TEXT NOT NULL,
    "subject" TEXT,
    "bodyText" TEXT NOT NULL,
    "bodyHtml" TEXT,
    "type" "CommunicationType" NOT NULL,
    "direction" "CommunicationDirection" NOT NULL DEFAULT 'OUTBOUND',
    "status" "MessageStatus" NOT NULL DEFAULT 'PENDING',
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "clickedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "externalId" TEXT,
    "externalStatus" TEXT,
    "templateId" TEXT,
    "templateVariables" JSONB,
    "channelId" TEXT,
    "clientId" TEXT,
    "projectId" TEXT,
    "leadActivityId" TEXT,
    "userId" TEXT,
    "organizationId" TEXT NOT NULL,
    "recipientEmail" TEXT,
    "recipientPhone" TEXT,
    "recipientName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "message_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "communication_automations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "triggerType" "AutomationTriggerType" NOT NULL,
    "triggerConfig" JSONB,
    "conditions" JSONB,
    "templateId" TEXT,
    "channelId" TEXT,
    "delay" INTEGER NOT NULL DEFAULT 0,
    "organizationId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "executionCount" INTEGER NOT NULL DEFAULT 0,
    "lastExecutedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "communication_automations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomField" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "fieldName" TEXT NOT NULL,
    "fieldType" TEXT NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "validationRules" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormLayout" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "layout" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FormLayout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowTemplate" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "triggers" JSONB NOT NULL,
    "actions" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkflowTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "reportType" "ReportType" NOT NULL,
    "config" JSONB NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "report_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_metrics" (
    "id" TEXT NOT NULL,
    "metricKey" TEXT NOT NULL,
    "metricName" TEXT NOT NULL,
    "metricValue" DECIMAL(15,4) NOT NULL,
    "metricType" "AnalyticsMetricType" NOT NULL,
    "dimension" TEXT,
    "periodStart" TIMESTAMP(3),
    "periodEnd" TIMESTAMP(3),
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "analytics_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationSettings_organizationId_key" ON "OrganizationSettings"("organizationId");

-- CreateIndex
CREATE INDEX "Estimate_organizationId_status_idx" ON "Estimate"("organizationId", "status");

-- CreateIndex
CREATE INDEX "Estimate_clientId_idx" ON "Estimate"("clientId");

-- CreateIndex
CREATE INDEX "Estimate_creatorId_idx" ON "Estimate"("creatorId");

-- CreateIndex
CREATE UNIQUE INDEX "Estimate_referenceNumber_organizationId_key" ON "Estimate"("referenceNumber", "organizationId");

-- CreateIndex
CREATE INDEX "EstimateLineItem_estimateId_idx" ON "EstimateLineItem"("estimateId");

-- CreateIndex
CREATE INDEX "EstimateLineItem_catalogItemId_idx" ON "EstimateLineItem"("catalogItemId");

-- CreateIndex
CREATE INDEX "CatalogItem_organizationId_category_idx" ON "CatalogItem"("organizationId", "category");

-- CreateIndex
CREATE INDEX "CatalogItem_organizationId_isActive_idx" ON "CatalogItem"("organizationId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "CatalogItem_sku_organizationId_key" ON "CatalogItem"("sku", "organizationId");

-- CreateIndex
CREATE INDEX "EstimateApproval_estimateId_idx" ON "EstimateApproval"("estimateId");

-- CreateIndex
CREATE INDEX "EstimatePayment_estimateId_idx" ON "EstimatePayment"("estimateId");

-- CreateIndex
CREATE INDEX "EstimatePayment_organizationId_status_idx" ON "EstimatePayment"("organizationId", "status");

-- CreateIndex
CREATE INDEX "EstimateEmailLog_estimateId_idx" ON "EstimateEmailLog"("estimateId");

-- CreateIndex
CREATE INDEX "message_templates_organizationId_idx" ON "message_templates"("organizationId");

-- CreateIndex
CREATE INDEX "message_templates_organizationId_category_idx" ON "message_templates"("organizationId", "category");

-- CreateIndex
CREATE INDEX "message_templates_organizationId_type_idx" ON "message_templates"("organizationId", "type");

-- CreateIndex
CREATE INDEX "message_templates_organizationId_isActive_idx" ON "message_templates"("organizationId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "message_templates_name_organizationId_key" ON "message_templates"("name", "organizationId");

-- CreateIndex
CREATE INDEX "communication_channels_organizationId_idx" ON "communication_channels"("organizationId");

-- CreateIndex
CREATE INDEX "communication_channels_organizationId_type_idx" ON "communication_channels"("organizationId", "type");

-- CreateIndex
CREATE INDEX "communication_channels_organizationId_isActive_idx" ON "communication_channels"("organizationId", "isActive");

-- CreateIndex
CREATE INDEX "communication_channels_organizationId_isDefault_idx" ON "communication_channels"("organizationId", "isDefault");

-- CreateIndex
CREATE UNIQUE INDEX "communication_channels_name_organizationId_key" ON "communication_channels"("name", "organizationId");

-- CreateIndex
CREATE INDEX "message_history_organizationId_idx" ON "message_history"("organizationId");

-- CreateIndex
CREATE INDEX "message_history_clientId_idx" ON "message_history"("clientId");

-- CreateIndex
CREATE INDEX "message_history_projectId_idx" ON "message_history"("projectId");

-- CreateIndex
CREATE INDEX "message_history_userId_idx" ON "message_history"("userId");

-- CreateIndex
CREATE INDEX "message_history_organizationId_type_idx" ON "message_history"("organizationId", "type");

-- CreateIndex
CREATE INDEX "message_history_organizationId_status_idx" ON "message_history"("organizationId", "status");

-- CreateIndex
CREATE INDEX "message_history_organizationId_createdAt_idx" ON "message_history"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "message_history_clientId_createdAt_idx" ON "message_history"("clientId", "createdAt");

-- CreateIndex
CREATE INDEX "message_history_externalId_idx" ON "message_history"("externalId");

-- CreateIndex
CREATE INDEX "communication_automations_organizationId_idx" ON "communication_automations"("organizationId");

-- CreateIndex
CREATE INDEX "communication_automations_organizationId_isActive_idx" ON "communication_automations"("organizationId", "isActive");

-- CreateIndex
CREATE INDEX "communication_automations_organizationId_triggerType_idx" ON "communication_automations"("organizationId", "triggerType");

-- CreateIndex
CREATE UNIQUE INDEX "communication_automations_name_organizationId_key" ON "communication_automations"("name", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_userId_module_action_key" ON "Permission"("userId", "module", "action");

-- CreateIndex
CREATE UNIQUE INDEX "CustomField_organizationId_entityType_fieldName_key" ON "CustomField"("organizationId", "entityType", "fieldName");

-- CreateIndex
CREATE UNIQUE INDEX "FormLayout_organizationId_entityType_key" ON "FormLayout"("organizationId", "entityType");

-- CreateIndex
CREATE INDEX "report_templates_organizationId_idx" ON "report_templates"("organizationId");

-- CreateIndex
CREATE INDEX "report_templates_organizationId_reportType_idx" ON "report_templates"("organizationId", "reportType");

-- CreateIndex
CREATE INDEX "report_templates_organizationId_isActive_idx" ON "report_templates"("organizationId", "isActive");

-- CreateIndex
CREATE INDEX "analytics_metrics_organizationId_idx" ON "analytics_metrics"("organizationId");

-- CreateIndex
CREATE INDEX "analytics_metrics_organizationId_metricType_idx" ON "analytics_metrics"("organizationId", "metricType");

-- CreateIndex
CREATE INDEX "analytics_metrics_organizationId_periodStart_idx" ON "analytics_metrics"("organizationId", "periodStart");

-- CreateIndex
CREATE UNIQUE INDEX "analytics_metrics_organizationId_metricKey_dimension_period_key" ON "analytics_metrics"("organizationId", "metricKey", "dimension", "periodStart");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "OrganizationSettings" ADD CONSTRAINT "OrganizationSettings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Estimate" ADD CONSTRAINT "Estimate_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Estimate" ADD CONSTRAINT "Estimate_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Estimate" ADD CONSTRAINT "Estimate_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Estimate" ADD CONSTRAINT "Estimate_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Estimate" ADD CONSTRAINT "Estimate_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Estimate" ADD CONSTRAINT "Estimate_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "estimate_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstimateLineItem" ADD CONSTRAINT "EstimateLineItem_estimateId_fkey" FOREIGN KEY ("estimateId") REFERENCES "Estimate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstimateLineItem" ADD CONSTRAINT "EstimateLineItem_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstimateLineItem" ADD CONSTRAINT "EstimateLineItem_catalogItemId_fkey" FOREIGN KEY ("catalogItemId") REFERENCES "CatalogItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogItem" ADD CONSTRAINT "CatalogItem_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogItem" ADD CONSTRAINT "CatalogItem_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstimateApproval" ADD CONSTRAINT "EstimateApproval_estimateId_fkey" FOREIGN KEY ("estimateId") REFERENCES "Estimate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstimateApproval" ADD CONSTRAINT "EstimateApproval_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstimatePayment" ADD CONSTRAINT "EstimatePayment_estimateId_fkey" FOREIGN KEY ("estimateId") REFERENCES "Estimate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstimatePayment" ADD CONSTRAINT "EstimatePayment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstimateEmailLog" ADD CONSTRAINT "EstimateEmailLog_estimateId_fkey" FOREIGN KEY ("estimateId") REFERENCES "Estimate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstimateEmailLog" ADD CONSTRAINT "EstimateEmailLog_sentById_fkey" FOREIGN KEY ("sentById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_estimateId_fkey" FOREIGN KEY ("estimateId") REFERENCES "Estimate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_templates" ADD CONSTRAINT "message_templates_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_templates" ADD CONSTRAINT "message_templates_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communication_channels" ADD CONSTRAINT "communication_channels_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_history" ADD CONSTRAINT "message_history_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "message_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_history" ADD CONSTRAINT "message_history_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "communication_channels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_history" ADD CONSTRAINT "message_history_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_history" ADD CONSTRAINT "message_history_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_history" ADD CONSTRAINT "message_history_leadActivityId_fkey" FOREIGN KEY ("leadActivityId") REFERENCES "lead_activities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_history" ADD CONSTRAINT "message_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_history" ADD CONSTRAINT "message_history_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communication_automations" ADD CONSTRAINT "communication_automations_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "message_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communication_automations" ADD CONSTRAINT "communication_automations_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "communication_channels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communication_automations" ADD CONSTRAINT "communication_automations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communication_automations" ADD CONSTRAINT "communication_automations_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Permission" ADD CONSTRAINT "Permission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomField" ADD CONSTRAINT "CustomField_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormLayout" ADD CONSTRAINT "FormLayout_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowTemplate" ADD CONSTRAINT "WorkflowTemplate_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_templates" ADD CONSTRAINT "report_templates_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_templates" ADD CONSTRAINT "report_templates_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_metrics" ADD CONSTRAINT "analytics_metrics_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
