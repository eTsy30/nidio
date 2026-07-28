-- AlterTable
ALTER TABLE "Couple" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Couple_deletedAt_idx" ON "Couple"("deletedAt");
