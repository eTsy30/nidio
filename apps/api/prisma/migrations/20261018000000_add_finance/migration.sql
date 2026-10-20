-- CreateTable
CREATE TABLE "SavingsGoal" (
    "id" TEXT NOT NULL,
    "coupleId" TEXT NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "targetMinor" INTEGER NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "icon" TEXT NOT NULL DEFAULT '🎯',
    "color" TEXT NOT NULL DEFAULT 'primary',
    "targetDate" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavingsGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavingsTransaction" (
    "id" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "amountMinor" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavingsTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoyaltyCard" (
    "id" TEXT NOT NULL,
    "coupleId" TEXT NOT NULL,
    "storeName" VARCHAR(100) NOT NULL,
    "cardNumber" VARCHAR(256) NOT NULL,
    "barcodeFormat" TEXT NOT NULL DEFAULT 'NONE',
    "category" TEXT NOT NULL,
    "comment" TEXT NOT NULL DEFAULT '',
    "color" TEXT NOT NULL DEFAULT 'primary',
    "imageKey" TEXT,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoyaltyCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialTransaction" (
    "id" TEXT NOT NULL,
    "coupleId" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "amountMinor" INTEGER NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "date" VARCHAR(10) NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinancialTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetLimit" (
    "id" TEXT NOT NULL,
    "coupleId" TEXT NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "category" TEXT NOT NULL,
    "month" VARCHAR(7) NOT NULL,
    "amountMinor" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BudgetLimit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SavingsGoal_coupleId_idx" ON "SavingsGoal"("coupleId");

-- CreateIndex
CREATE UNIQUE INDEX "SavingsTransaction_goalId_requestId_key" ON "SavingsTransaction"("goalId", "requestId");

-- CreateIndex
CREATE INDEX "LoyaltyCard_coupleId_idx" ON "LoyaltyCard"("coupleId");

-- CreateIndex
CREATE INDEX "FinancialTransaction_coupleId_date_idx" ON "FinancialTransaction"("coupleId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "FinancialTransaction_coupleId_requestId_key" ON "FinancialTransaction"("coupleId", "requestId");

-- CreateIndex
CREATE UNIQUE INDEX "BudgetLimit_coupleId_currency_category_month_key" ON "BudgetLimit"("coupleId", "currency", "category", "month");

-- AddForeignKey
ALTER TABLE "SavingsGoal" ADD CONSTRAINT "SavingsGoal_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "Couple"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavingsTransaction" ADD CONSTRAINT "SavingsTransaction_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "SavingsGoal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyCard" ADD CONSTRAINT "LoyaltyCard_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "Couple"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialTransaction" ADD CONSTRAINT "FinancialTransaction_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "Couple"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetLimit" ADD CONSTRAINT "BudgetLimit_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "Couple"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Amounts are integer minor units; invalid signs and currencies are rejected at rest.
ALTER TABLE "SavingsGoal" ADD CONSTRAINT "SavingsGoal_amount_check" CHECK ("targetMinor" > 0 AND "targetMinor" <= 2000000000), ADD CONSTRAINT "SavingsGoal_currency_check" CHECK ("currency" IN ('BYN','EUR','USD','RUB'));
ALTER TABLE "SavingsTransaction" ADD CONSTRAINT "SavingsTransaction_amount_check" CHECK ("amountMinor" > 0 AND "amountMinor" <= 2000000000), ADD CONSTRAINT "SavingsTransaction_type_check" CHECK ("type" IN ('DEPOSIT','WITHDRAWAL'));
ALTER TABLE "FinancialTransaction" ADD CONSTRAINT "FinancialTransaction_amount_check" CHECK ("amountMinor" > 0 AND "amountMinor" <= 2000000000), ADD CONSTRAINT "FinancialTransaction_type_check" CHECK ("type" IN ('INCOME','EXPENSE')), ADD CONSTRAINT "FinancialTransaction_currency_check" CHECK ("currency" IN ('BYN','EUR','USD','RUB'));
ALTER TABLE "BudgetLimit" ADD CONSTRAINT "BudgetLimit_amount_check" CHECK ("amountMinor" > 0 AND "amountMinor" <= 2000000000), ADD CONSTRAINT "BudgetLimit_currency_check" CHECK ("currency" IN ('BYN','EUR','USD','RUB'));
