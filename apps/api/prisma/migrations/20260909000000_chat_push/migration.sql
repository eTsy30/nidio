CREATE TABLE "PushSubscription" (
 "id" TEXT PRIMARY KEY, "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
 "endpoint" TEXT NOT NULL, "p256dh" TEXT NOT NULL, "auth" TEXT NOT NULL,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");
CREATE INDEX "PushSubscription_userId_idx" ON "PushSubscription"("userId");
CREATE TABLE "PushDelivery" (
 "subscriptionId" TEXT NOT NULL REFERENCES "PushSubscription"("id") ON DELETE CASCADE,
 "messageId" TEXT NOT NULL REFERENCES "Message"("id") ON DELETE CASCADE,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY ("subscriptionId", "messageId")
);
CREATE TABLE "ChatPresence" (
 "socketId" TEXT PRIMARY KEY, "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
 "workspaceId" TEXT NOT NULL, "expiresAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "ChatPresence_userId_workspaceId_expiresAt_idx" ON "ChatPresence"("userId", "workspaceId", "expiresAt");
