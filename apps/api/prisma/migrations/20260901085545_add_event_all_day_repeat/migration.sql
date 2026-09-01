-- CreateEnum
CREATE TYPE "EventRepeat" AS ENUM ('NONE', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY');

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "allDay" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "repeat" "EventRepeat" NOT NULL DEFAULT 'NONE';

-- CreateIndex
CREATE INDEX "Event_repeat_idx" ON "Event"("repeat");
