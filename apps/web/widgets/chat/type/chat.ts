import type {
  ChatMessageItem as ServerChatMessageItem,
  ChatMessageStatus,
} from "@/shared/realtime/types/events";

export type { ChatMessageStatus };

export type ChatMessageItem = ServerChatMessageItem & {
  status: ChatMessageStatus;
  updatedAt?: string | null;
};
