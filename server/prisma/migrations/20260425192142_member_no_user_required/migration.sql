-- DropForeignKey
ALTER TABLE "project_members" DROP CONSTRAINT "project_members_userId_fkey";

-- DropIndex
DROP INDEX "project_members_projectId_userId_key";

-- AlterTable
ALTER TABLE "project_members" ADD COLUMN     "memberEmail" TEXT,
ADD COLUMN     "memberName" TEXT,
ALTER COLUMN "userId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
