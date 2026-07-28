/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `CoupleMember` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "CoupleMember_userId_idx";

-- CreateIndex
CREATE UNIQUE INDEX "CoupleMember_userId_key" ON "CoupleMember"("userId");
