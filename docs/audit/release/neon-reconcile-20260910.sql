-- One-time reconciliation of the inspected legacy Neon schema.
-- Rehearse on a backup; do not use on other schema versions.
BEGIN;
SET LOCAL lock_timeout = '10s';
SET LOCAL statement_timeout = '120s';
-- CreateEnum
CREATE TYPE "Repeat" AS ENUM ('NONE', 'DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "AssigneeMode" AS ENUM ('ME', 'PARTNER', 'BOTH', 'ROTATE');

-- CreateEnum
CREATE TYPE "EventRepeat" AS ENUM ('NONE', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('DATE', 'BIRTHDAY', 'ANNIVERSARY', 'OTHER');

-- CreateEnum
CREATE TYPE "EventScope" AS ENUM ('PERSONAL', 'COUPLE');

-- AlterTable
ALTER TABLE "Couple" ADD COLUMN     "notificationDirty" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "relationshipAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "RefreshToken" ADD COLUMN "jti" TEXT;
UPDATE "RefreshToken" SET "jti" = "id" WHERE "jti" IS NULL;
ALTER TABLE "RefreshToken" ALTER COLUMN "jti" SET NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "timeZone" TEXT;

-- CreateTable
CREATE TABLE "Board" (
    "id" TEXT NOT NULL,
    "coupleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Board_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Column" (
    "id" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "icon" TEXT,
    "color" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Column_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Template" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "icon" TEXT,
    "color" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "coupleId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TemplateItem" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "assigneeMode" "AssigneeMode" NOT NULL DEFAULT 'ME',
    "repeat" "Repeat" NOT NULL DEFAULT 'NONE',
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TemplateItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "assigneeId" TEXT,
    "coupleId" TEXT,
    "dueAt" TIMESTAMP(3),
    "repeat" "Repeat" NOT NULL DEFAULT 'NONE',
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "assigneeMode" "AssigneeMode" NOT NULL DEFAULT 'ME',
    "occurrenceIndex" INTEGER NOT NULL DEFAULT 0,
    "recurringGroupId" TEXT,
    "repeatConfig" JSONB,
    "repeatUntil" TIMESTAMP(3),
    "rotationFirstAssigneeId" TEXT,
    "columnId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "priority" BOOLEAN NOT NULL DEFAULT false,
    "overdueNotifiedAt" TIMESTAMP(3),

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskCompletion" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Nudge" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Nudge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3),
    "type" "EventType" NOT NULL DEFAULT 'OTHER',
    "scope" "EventScope" NOT NULL,
    "createdById" TEXT NOT NULL,
    "userId" TEXT,
    "coupleId" TEXT,
    "reminderAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "allDay" BOOLEAN NOT NULL DEFAULT false,
    "repeat" "EventRepeat" NOT NULL DEFAULT 'NONE',
    "excludedDates" TIMESTAMP(3)[],
    "repeatUntil" TIMESTAMP(3),
    "timeZone" TEXT,
    "notificationDirty" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PushDelivery" (
    "subscriptionId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PushDelivery_pkey" PRIMARY KEY ("subscriptionId","messageId")
);

-- CreateTable
CREATE TABLE "ChatPresence" (
    "socketId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatPresence_pkey" PRIMARY KEY ("socketId")
);

-- CreateTable
CREATE TABLE "ScheduledNotification" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "coupleId" TEXT,
    "runAt" TIMESTAMP(3) NOT NULL,
    "occurrenceAt" TIMESTAMP(3),
    "sourceVersion" TIMESTAMP(3),
    "payload" JSONB NOT NULL,
    "leaseUntil" TIMESTAMP(3) NOT NULL DEFAULT '1970-01-01 00:00:00'::timestamp without time zone,
    "leaseToken" TEXT,

    CONSTRAINT "ScheduledNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationAttempt" (
    "subscriptionId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationAttempt_pkey" PRIMARY KEY ("subscriptionId","key")
);

-- CreateIndex
CREATE UNIQUE INDEX "Board_coupleId_key" ON "Board"("coupleId");

-- CreateIndex
CREATE INDEX "Board_coupleId_idx" ON "Board"("coupleId");

-- CreateIndex
CREATE INDEX "Column_boardId_idx" ON "Column"("boardId");

-- CreateIndex
CREATE INDEX "Column_order_idx" ON "Column"("order");

-- CreateIndex
CREATE INDEX "Template_coupleId_idx" ON "Template"("coupleId");

-- CreateIndex
CREATE INDEX "Template_isSystem_idx" ON "Template"("isSystem");

-- CreateIndex
CREATE INDEX "TemplateItem_templateId_idx" ON "TemplateItem"("templateId");

-- CreateIndex
CREATE INDEX "TemplateItem_order_idx" ON "TemplateItem"("order");

-- CreateIndex
CREATE INDEX "Task_completed_overdueNotifiedAt_dueAt_idx" ON "Task"("completed", "overdueNotifiedAt", "dueAt");

-- CreateIndex
CREATE INDEX "Task_columnId_idx" ON "Task"("columnId");

-- CreateIndex
CREATE INDEX "Task_coupleId_idx" ON "Task"("coupleId");

-- CreateIndex
CREATE INDEX "Task_assigneeId_idx" ON "Task"("assigneeId");

-- CreateIndex
CREATE INDEX "Task_dueAt_idx" ON "Task"("dueAt");

-- CreateIndex
CREATE INDEX "Task_completed_idx" ON "Task"("completed");

-- CreateIndex
CREATE INDEX "Task_order_idx" ON "Task"("order");

-- CreateIndex
CREATE INDEX "Task_priority_idx" ON "Task"("priority");

-- CreateIndex
CREATE INDEX "Task_recurringGroupId_idx" ON "Task"("recurringGroupId");

-- CreateIndex
CREATE INDEX "TaskCompletion_taskId_idx" ON "TaskCompletion"("taskId");

-- CreateIndex
CREATE UNIQUE INDEX "TaskCompletion_taskId_userId_key" ON "TaskCompletion"("taskId", "userId");

-- CreateIndex
CREATE INDEX "Nudge_taskId_idx" ON "Nudge"("taskId");

-- CreateIndex
CREATE INDEX "Nudge_recipientId_idx" ON "Nudge"("recipientId");

-- CreateIndex
CREATE INDEX "Nudge_createdAt_idx" ON "Nudge"("createdAt");

-- CreateIndex
CREATE INDEX "Event_notificationDirty_idx" ON "Event"("notificationDirty");

-- CreateIndex
CREATE INDEX "Event_userId_startAt_idx" ON "Event"("userId", "startAt");

-- CreateIndex
CREATE INDEX "Event_coupleId_startAt_idx" ON "Event"("coupleId", "startAt");

-- CreateIndex
CREATE INDEX "Event_createdById_idx" ON "Event"("createdById");

-- CreateIndex
CREATE INDEX "Event_startAt_idx" ON "Event"("startAt");

-- CreateIndex
CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");

-- CreateIndex
CREATE INDEX "PushSubscription_userId_idx" ON "PushSubscription"("userId");

-- CreateIndex
CREATE INDEX "ChatPresence_userId_workspaceId_expiresAt_idx" ON "ChatPresence"("userId", "workspaceId", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "ScheduledNotification_key_key" ON "ScheduledNotification"("key");

-- CreateIndex
CREATE INDEX "ScheduledNotification_runAt_leaseUntil_idx" ON "ScheduledNotification"("runAt", "leaseUntil");

-- CreateIndex
CREATE INDEX "ScheduledNotification_sourceId_idx" ON "ScheduledNotification"("sourceId");

-- CreateIndex
CREATE INDEX "Couple_notificationDirty_idx" ON "Couple"("notificationDirty");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_jti_key" ON "RefreshToken"("jti");

-- AddForeignKey
ALTER TABLE "Board" ADD CONSTRAINT "Board_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "Couple"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Column" ADD CONSTRAINT "Column_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Template" ADD CONSTRAINT "Template_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "Couple"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Template" ADD CONSTRAINT "Template_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplateItem" ADD CONSTRAINT "TemplateItem_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_columnId_fkey" FOREIGN KEY ("columnId") REFERENCES "Column"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskCompletion" ADD CONSTRAINT "TaskCompletion_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Nudge" ADD CONSTRAINT "Nudge_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_coupleId_fkey" FOREIGN KEY ("coupleId") REFERENCES "Couple"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "PushDelivery" ADD CONSTRAINT "PushDelivery_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "PushDelivery" ADD CONSTRAINT "PushDelivery_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "PushSubscription"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ChatPresence" ADD CONSTRAINT "ChatPresence_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ScheduledNotification" ADD CONSTRAINT "ScheduledNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "NotificationAttempt" ADD CONSTRAINT "NotificationAttempt_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "PushSubscription"("id") ON DELETE CASCADE ON UPDATE NO ACTION;


-- Preserve the system templates installed by the historical migration.
INSERT INTO "Template" ("id", "title", "icon", "color", "isSystem", "createdAt", "updatedAt") VALUES
(gen_random_uuid()::text, 'Продукты', 'shopping-cart', '#E8F5E9', true, NOW(), NOW()),
(gen_random_uuid()::text, 'Уборка', 'sparkles', '#FFF3E0', true, NOW(), NOW()),
(gen_random_uuid()::text, 'Путешествие', 'plane', '#E3F2FD', true, NOW(), NOW()),
(gen_random_uuid()::text, 'Дом', 'home', '#F3E5F5', true, NOW(), NOW());


COMMIT;
