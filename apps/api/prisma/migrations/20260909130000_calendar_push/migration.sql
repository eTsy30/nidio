ALTER TABLE "User" ADD COLUMN "timeZone" TEXT;
ALTER TABLE "Event" ADD COLUMN "timeZone" TEXT, ADD COLUMN "notificationDirty" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Couple" ADD COLUMN "notificationDirty" BOOLEAN NOT NULL DEFAULT true;
CREATE INDEX "Event_notificationDirty_idx" ON "Event"("notificationDirty");
CREATE INDEX "Couple_notificationDirty_idx" ON "Couple"("notificationDirty");
CREATE TABLE "ScheduledNotification" (
 "id" TEXT PRIMARY KEY, "key" TEXT NOT NULL, "kind" TEXT NOT NULL, "sourceId" TEXT NOT NULL,
 "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE, "coupleId" TEXT,
 "runAt" TIMESTAMP(3) NOT NULL, "occurrenceAt" TIMESTAMP(3), "sourceVersion" TIMESTAMP(3),
 "payload" JSONB NOT NULL, "leaseUntil" TIMESTAMP(3) NOT NULL DEFAULT '1970-01-01 00:00:00', "leaseToken" TEXT
);
CREATE UNIQUE INDEX "ScheduledNotification_key_key" ON "ScheduledNotification"("key");
CREATE INDEX "ScheduledNotification_runAt_leaseUntil_idx" ON "ScheduledNotification"("runAt", "leaseUntil");
CREATE INDEX "ScheduledNotification_sourceId_idx" ON "ScheduledNotification"("sourceId");
CREATE TABLE "NotificationAttempt" (
 "subscriptionId" TEXT NOT NULL REFERENCES "PushSubscription"("id") ON DELETE CASCADE,
 "key" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY ("subscriptionId", "key")
);
