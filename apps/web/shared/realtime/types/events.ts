export type ChatMessageStatus = "sending" | "sent" | "delivered" | "read" | "error";

export type ChatMessageItem = {
  id: string;
  content: string | null;
  sender: {
    id: string;
    firstName: string;
    avatarUrl?: string | null;
  };
  createdAt: string;
  clientId?: string;
  status?: ChatMessageStatus; // ← опциональный, сервер может не слать
};

export interface ServerToClientEvents {
  "chat.message.created": (message: ChatMessageItem) => void;
  "chat.message.delivered": (data: { messageId: string }) => void;
  "chat.message.read": (data: { messageId: string }) => void;
  "chat.typing.start": (data: { userId: string }) => void;
  "chat.typing.stop": (data: { userId: string }) => void;
  "user.online": (data: { userId: string }) => void;
  "user.offline": (data: { userId: string }) => void;
  "relationship.connected": (data: { userId: string; online: boolean }) => void;
}

export interface ClientToServerEvents {
  "chat:send": (message: { content: string }) => void;
  "chat:typing:start": () => void;
  "chat:typing:stop": () => void;
  "chat:read": (data: { messageId: string }) => void;
  "chat:delivered": (data: { messageId: string }) => void;
}
