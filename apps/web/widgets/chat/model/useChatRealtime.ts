import { Dispatch, SetStateAction, useEffect } from "react";
import type { Socket } from "socket.io-client";

import type { ClientToServerEvents, ServerToClientEvents } from "@/shared/realtime/types/events";

import type { ChatMessageItem } from "../type/chat";

type Props = {
  socket: Socket<ServerToClientEvents, ClientToServerEvents> | null;
  currentUserId: string;
  setMessages: Dispatch<SetStateAction<ChatMessageItem[]>>;
  setIsTyping: Dispatch<SetStateAction<boolean>>;
  setIsOnline: Dispatch<SetStateAction<boolean>>;
};

export function useChatRealtime({
  socket,
  currentUserId,
  setMessages,
  setIsTyping,
  setIsOnline,
}: Props) {
  useEffect(() => {
    if (!socket) return;

    function handleMessage(message: import("@/shared/realtime/types/events").ChatMessageItem) {
      if (message.sender?.id !== currentUserId) {
        socket?.emit("chat:delivered", { messageId: message.id });
      }

      setMessages((prev) => {
        const exists = prev.some((item) => item.id === message.id);
        if (exists) return prev;

        const next: ChatMessageItem = { ...message, status: message.status ?? "sent" };
        return [...prev, next];
      });
    }

    function handleDelivered(data: { messageId: string }) {
      updateStatus(data.messageId, "delivered");
    }

    function handleRead(data: { messageId: string }) {
      updateStatus(data.messageId, "read");
    }

    function updateStatus(messageId: string, status: ChatMessageItem["status"]) {
      setMessages((prev) =>
        prev.map((message) => (message.id === messageId ? { ...message, status } : message)),
      );
    }

    function handleTypingStart(data: { userId: string }) {
      if (data.userId !== currentUserId) setIsTyping(true);
    }

    function handleTypingStop(data: { userId: string }) {
      if (data.userId !== currentUserId) setIsTyping(false);
    }

    function handleUserOnline(data: { userId: string }) {
      if (data.userId !== currentUserId) setIsOnline(true);
    }

    function handleUserOffline(data: { userId: string }) {
      if (data.userId !== currentUserId) setIsOnline(false);
    }

    function handleEdited(message: import("@/shared/realtime/types/events").ChatMessageItem) {
      setMessages((prev) =>
        prev.map((item) => {
          if (item.id !== message.id) return item;

          const updated: ChatMessageItem = {
            ...item,
            content: message.content ?? item.content,
          };

          if (message.updatedAt !== undefined) {
            updated.updatedAt = message.updatedAt;
          }

          return updated;
        }),
      );
    }

    function handleDeleted(data: { messageId: string }) {
      setMessages((prev) => prev.filter((item) => item.id !== data.messageId));
    }

    function handleReactionAdded(reaction: { messageId: string; emoji: string; userId: string }) {
      setMessages((prev) =>
        prev.map((item) => {
          if (item.id !== reaction.messageId) return item;
          const exists = item.reactions?.some(
            (r) => r.emoji === reaction.emoji && r.userId === reaction.userId,
          );
          if (exists) return item;

          const nextReactions = (item.reactions || []).concat({
            emoji: reaction.emoji,
            userId: reaction.userId,
          });

          return { ...item, reactions: nextReactions };
        }),
      );
    }

    function handleReactionRemoved(data: { messageId: string; emoji: string }) {
      setMessages((prev) =>
        prev.map((item) => {
          if (item.id !== data.messageId) return item;

          const nextReactions = item.reactions?.filter((r) => r.emoji !== data.emoji);

          if (!nextReactions || nextReactions.length === 0) {
            const { reactions: _, ...rest } = item;
            return rest as ChatMessageItem;
          }

          return { ...item, reactions: nextReactions };
        }),
      );
    }

    socket.on("chat.message.created", handleMessage);
    socket.on("chat.message.edited", handleEdited);
    socket.on("chat.message.deleted", handleDeleted);
    socket.on("chat.reaction.added", handleReactionAdded);
    socket.on("chat.reaction.removed", handleReactionRemoved);
    socket.on("chat.message.delivered", handleDelivered);
    socket.on("chat.message.read", handleRead);
    socket.on("chat.typing.start", handleTypingStart);
    socket.on("chat.typing.stop", handleTypingStop);
    socket.on("user.online", handleUserOnline);
    socket.on("user.offline", handleUserOffline);
    socket.emit("user:status:sync");

    return () => {
      socket.off("chat.message.created", handleMessage);
      socket.off("chat.message.edited", handleEdited);
      socket.off("chat.message.deleted", handleDeleted);
      socket.off("chat.reaction.added", handleReactionAdded);
      socket.off("chat.reaction.removed", handleReactionRemoved);
      socket.off("chat.message.delivered", handleDelivered);
      socket.off("chat.message.read", handleRead);
      socket.off("chat.typing.start", handleTypingStart);
      socket.off("chat.typing.stop", handleTypingStop);
      socket.off("user.online", handleUserOnline);
      socket.off("user.offline", handleUserOffline);
    };
  }, [socket, currentUserId, setMessages, setIsTyping, setIsOnline]);
}
