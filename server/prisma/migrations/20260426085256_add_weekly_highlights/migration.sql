-- CreateEnum
CREATE TYPE "WeeklyHighlightType" AS ENUM ('COMPLETED', 'PLANNED');

-- CreateTable
CREATE TABLE "weekly_highlights" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "weekDate" TIMESTAMP(3) NOT NULL,
    "type" "WeeklyHighlightType" NOT NULL,
    "description" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "weekly_highlights_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "weekly_highlights" ADD CONSTRAINT "weekly_highlights_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
