ALTER TABLE "SavingsGoal" ADD COLUMN "ownerId" TEXT,
ADD COLUMN "scope" TEXT NOT NULL DEFAULT 'COUPLE',
ADD COLUMN "plan" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN "achievements" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN "archived" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "SavingsTransaction" ADD COLUMN "stepId" TEXT,
ADD COLUMN "cancelledAt" TIMESTAMP(3);
CREATE UNIQUE INDEX "SavingsTransaction_active_step" ON "SavingsTransaction"("goalId", "stepId") WHERE "stepId" IS NOT NULL AND "cancelledAt" IS NULL;
