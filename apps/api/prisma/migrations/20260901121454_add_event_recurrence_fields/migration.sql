-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "excludedDates" TIMESTAMP(3)[],
ADD COLUMN     "repeatUntil" TIMESTAMP(3);
