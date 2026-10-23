ALTER TABLE "SavingsGoal"
  ADD COLUMN "strategy" TEXT NOT NULL DEFAULT 'FREE',
  ADD COLUMN "gridOrder" TEXT NOT NULL DEFAULT 'ASC',
  ADD COLUMN "scheduleEvery" TEXT,
  ADD COLUMN "scheduleAmountMinor" INTEGER,
  ADD COLUMN "scheduleStartDate" TEXT;

UPDATE "SavingsGoal" SET "strategy" = 'GRID'
WHERE jsonb_array_length("plan") > 0;
