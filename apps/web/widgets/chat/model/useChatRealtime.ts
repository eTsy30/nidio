import { Dispatch, SetStateAction, useEffect, useRef } from "react";
import type { Socket } from "socket.io-client";

import type {
  ChatMessageItem,
  ClientToServerEvents,
  ServerToClientEvents,
} from "@/shared/realtime/types/events";

import { mergeMessages } from "./message-state";

type Props = {
  socket: Socket<ServerToClientEvents, ClientToServerEvents> | null;
  currentUserId: string;
  setMessages: Dispatch<SetStateAction<ChatMessageItem[]>>;
  setIsTyping: Dispatch<SetStateAction<boolean>>;
  setIsOnline: Dispatch<SetStateAction<boolean>>;
  reloadMessages: () => Promise<void>;
};

export function useChatRealtime({
  socket,
  currentUserId,
  setMessages,
  setIsTyping,
  setIsOnline,
  reloadMessages,
}: Props) {
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!socket) return;

    function handleMessage(message: ChatMessageItem) {
      if (message.sender.id !== currentUserId) {
        socket?.emit("chat:delivered", {
          messageId: message.id,
        });
      }

      setMessages((prev) =>
        mergeMessages(prev, [{ ...message, status: message.status ?? "sent" }]),
      );
    }

    function handleDelivered(data: { messageId: string }) {
      updateStatus(data.messageId, "delivered");
    }

    function handleRead(data: { messageId: string }) {
      updateStatus(data.messageId, "read");
    }

    function updateStatus(messageId: string, status: ChatMessageItem["status"]) {
      const rank = { error: 0, sending: 1, sent: 2, delivered: 3, read: 4 } as const;
      setMessages((prev) =>
        prev.map((message) =>
          message.id === messageId && rank[status] > rank[message.status]
            ? { ...message, status }
            : message,
        ),
      );
    }

    function handleTypingStart(data: { userId: string }) {
      if (data.userId !== currentUserId) {
        setIsTyping(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
          setIsTyping(false);
          typingTimeoutRef.current = null;
        }, 4_000);
      }
    }

    function handleTypingStop(data: { userId: string }) {
      if (data.userId !== currentUserId) {
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
        setIsTyping(false);
      }
    }

    function handleUserOnline(data: { userId: string }) {
      if (data.userId !== currentUserId) setIsOnline(true);
    }

    function handleUserOffline(data: { userId: string }) {
      if (data.userId !== currentUserId) setIsOnline(false);
    }

    function handleEdited(message: ChatMessageItem) {
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

    function handleReactionRemoved(data: { messageId: string; emoji: string; userId: string }) {
      setMessages((prev) =>
        prev.map((item) => {
          if (item.id !== data.messageId) return item;

          const nextReactions = item.reactions?.filter(
            (reaction) => reaction.emoji !== data.emoji || reaction.userId !== data.userId,
          );

          if (!nextReactions || nextReactions.length === 0) {
            const rest = { ...item };
            delete rest.reactions;

            return {
              ...rest,

              status: item.status,
            };
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
    socket.on("connect", reloadMessages);
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
      socket.off("connect", reloadMessages);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [socket, currentUserId, setMessages, setIsTyping, setIsOnline, reloadMessages]);
}
