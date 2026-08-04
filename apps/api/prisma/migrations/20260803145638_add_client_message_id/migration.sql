/*
  Warnings:

  - You are about to drop the column `clientId` on the `Message` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Message_clientId_idx";

-- AlterTable
ALTER TABLE "Message" DROP COLUMN "clientId",
ADD COLUMN     "clientId" TEXT;

-- CreateIndex
CREATE INDEX "Message_clientId_idx" ON "Message"("clientId");
