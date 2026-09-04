-- CreateEnum
CREATE TYPE "AssigneeMode" AS ENUM ('ME', 'PARTNER', 'BOTH', 'ROTATE');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Repeat" ADD VALUE 'DAILY';
ALTER TYPE "Repeat" ADD VALUE 'WEEKLY';
ALTER TYPE "Repeat" ADD VALUE 'MONTHLY';
ALTER TYPE "Repeat" ADD VALUE 'CUSTOM';

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "assigneeMode" "AssigneeMode" NOT NULL DEFAULT 'ME',
ADD COLUMN     "occurrenceIndex" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "recurringGroupId" TEXT,
ADD COLUMN     "repeatConfig" JSONB,
ADD COLUMN     "repeatUntil" TIMESTAMP(3),
ADD COLUMN     "rotationFirstAssigneeId" TEXT;

-- CreateIndex
CREATE INDEX "Task_recurringGroupId_idx" ON "Task"("recurringGroupId");
