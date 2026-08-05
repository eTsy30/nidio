export type ChatMessageStatus = "sending" | "sent" | "delivered" | "read" | "error";

export type ChatReaction = {
  emoji: string;
  userId: string;
};

export type ChatMessageItem = {
  id: string;
  content: string | null;
  sender: {
    id: string;
    firstName: string;
    avatarUrl?: string | null;
  };
  createdAt: string;
  updatedAt?: string | null;
  reactions?: ChatReaction[];
  clientId?: string;
  status?: ChatMessageStatus;
};

export interface ServerToClientEvents {
  "chat.message.created": (message: ChatMessageItem) => void;
  "chat.message.edited": (message: ChatMessageItem) => void;
  "chat.message.deleted": (data: { messageId: string }) => void;
  "chat.reaction.added": (reaction: { messageId: string; emoji: string; userId: string }) => void;
  "chat.reaction.removed": (data: { messageId: string; emoji: string }) => void;
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
  "chat:edit": (payload: { messageId: string; dto: { content: string } }) => void;
  "chat:delete": (payload: { messageId: string }) => void;
  "chat:reaction:add": (payload: { messageId: string; dto: { emoji: string } }) => void;
  "chat:reaction:remove": (payload: { messageId: string; emoji: string }) => void;
  "chat:typing:start": () => void;
  "chat:typing:stop": () => void;
  "chat:read": (data: { messageId: string }) => void;
  "chat:delivered": (data: { messageId: string }) => void;
  "user:status:sync": () => void;
}
