-- AlterTable
ALTER TABLE "meeting_minutes" ADD COLUMN     "language" TEXT NOT NULL DEFAULT 'AR';

-- AlterTable
ALTER TABLE "raid_items" ADD COLUMN     "linkedTaskId" TEXT;

-- AddForeignKey
ALTER TABLE "raid_items" ADD CONSTRAINT "raid_items_linkedTaskId_fkey" FOREIGN KEY ("linkedTaskId") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
