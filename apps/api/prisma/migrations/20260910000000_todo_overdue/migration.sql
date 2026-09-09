ALTER TABLE "Task" ADD COLUMN "overdueNotifiedAt" TIMESTAMP(3);
CREATE INDEX "Task_completed_overdueNotifiedAt_dueAt_idx" ON "Task"("completed", "overdueNotifiedAt", "dueAt");
