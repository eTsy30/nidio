-- CreateEnum
CREATE TYPE "InviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED');

-- AlterTable
ALTER TABLE "Invite" ADD COLUMN     "status" "InviteStatus" NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE INDEX "Couple_createdAt_idx" ON "Couple"("createdAt");

-- CreateIndex
CREATE INDEX "Invite_token_idx" ON "Invite"("token");
