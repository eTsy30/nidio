-- Removes chat history and chat-only delivery/presence records.
-- Back up chat data before deploying this migration; historical migrations stay intact.
DROP TABLE "PushDelivery";
DROP TABLE "MessageAttachment";
DROP TABLE "MessageReaction";
DROP TABLE "ChatPresence";
DROP TABLE "Message";
DROP TYPE "MessageType";
DROP TYPE "AttachmentType";
