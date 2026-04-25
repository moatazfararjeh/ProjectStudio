/*
  Warnings:

  - You are about to drop the column `phaseId` on the `tasks` table. All the data in the column will be lost.
  - You are about to drop the `phases` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'AT_RISK', 'CHURNED', 'DORMANT');

-- AlterEnum
ALTER TYPE "ReportType" ADD VALUE 'ANNUAL_REVIEW';

-- DropForeignKey
ALTER TABLE "phases" DROP CONSTRAINT "phases_projectId_fkey";

-- DropForeignKey
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_phaseId_fkey";

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "accountId" TEXT,
ADD COLUMN     "pptTemplateUrl" TEXT;

-- AlterTable
ALTER TABLE "raid_items" ADD COLUMN     "comments" TEXT,
ADD COLUMN     "impactDescription" TEXT,
ADD COLUMN     "mitigationOwnerId" TEXT,
ADD COLUMN     "revisedTargetDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "tasks" DROP COLUMN "phaseId",
ADD COLUMN     "actualFinish" TIMESTAMP(3),
ADD COLUMN     "actualStart" TIMESTAMP(3),
ADD COLUMN     "baselineFinish" TIMESTAMP(3),
ADD COLUMN     "baselineStart" TIMESTAMP(3);

-- DropTable
DROP TABLE "phases";

-- DropEnum
DROP TYPE "PhaseStatus";

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "industry" TEXT,
    "size" TEXT,
    "primaryContact" TEXT,
    "primaryContactEmail" TEXT,
    "primaryContactPhone" TEXT,
    "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "healthScore" DOUBLE PRECISION,
    "renewalProbability" DOUBLE PRECISION,
    "annualValue" DOUBLE PRECISION,
    "lifetimeValue" DOUBLE PRECISION,
    "contractStartDate" TIMESTAMP(3),
    "contractEndDate" TIMESTAMP(3),
    "nextReviewDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account_reviews" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "reviewYear" INTEGER NOT NULL,
    "reviewQuarter" INTEGER,
    "totalProjects" INTEGER NOT NULL,
    "totalRevenue" DOUBLE PRECISION NOT NULL,
    "projectsSummary" JSONB NOT NULL,
    "previousYearRevenue" DOUBLE PRECISION,
    "growthPercentage" DOUBLE PRECISION,
    "renewalLikelihood" DOUBLE PRECISION,
    "recommendedAction" TEXT,
    "executiveSummary" TEXT,
    "keyAchievements" JSONB,
    "challenges" JSONB,
    "nextYearPlan" TEXT,
    "reviewDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT,
    "description" TEXT,
    "category" TEXT,
    "unit" TEXT NOT NULL DEFAULT 'Unit',
    "unitPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cost" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_products" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "labelEn" TEXT NOT NULL,
    "labelAr" TEXT NOT NULL,
    "color" TEXT,
    "icon" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "accounts_code_key" ON "accounts"("code");

-- CreateIndex
CREATE UNIQUE INDEX "account_reviews_accountId_reviewYear_reviewQuarter_key" ON "account_reviews"("accountId", "reviewYear", "reviewQuarter");

-- CreateIndex
CREATE UNIQUE INDEX "products_code_key" ON "products"("code");

-- CreateIndex
CREATE UNIQUE INDEX "project_products_projectId_productId_key" ON "project_products"("projectId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_category_key_key" ON "system_settings"("category", "key");

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raid_items" ADD CONSTRAINT "raid_items_mitigationOwnerId_fkey" FOREIGN KEY ("mitigationOwnerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_reviews" ADD CONSTRAINT "account_reviews_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_products" ADD CONSTRAINT "project_products_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_products" ADD CONSTRAINT "project_products_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
