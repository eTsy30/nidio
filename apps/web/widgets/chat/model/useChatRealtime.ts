import { Dispatch, SetStateAction, useEffect } from "react";
import type { Socket } from "socket.io-client";

import { REALTIME_EVENTS } from "@/shared/realtime/lib/events";

import { ChatMessageItem } from "../type/chat";

type Props = {
  socket: Socket | null;
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
    if (!socket) {
      return;
    }

    function handleMessage(message: ChatMessageItem) {
      if (message.sender.id !== currentUserId) {
        socket?.emit(REALTIME_EVENTS.CHAT_DELIVERED, {
          messageId: message.id,
        });
      }

      setMessages((prev) => {
        const exists = prev.some((item) => item.id === message.id);

        if (exists) {
          return prev;
        }

        return [
          ...prev,
          {
            ...message,
            status: "sent",
          },
        ];
      });
    }

    function handleDelivered(data: { messageId: string }) {
      setMessages((prev) =>
        prev.map((message) =>
          message.id === data.messageId ? { ...message, status: "delivered" } : message,
        ),
      );
    }

    function handleRead(data: { messageId: string }) {
      setMessages((prev) =>
        prev.map((message) =>
          message.id === data.messageId ? { ...message, status: "read" } : message,
        ),
      );
    }

    function handleTypingStart(data: { userId: string }) {
      if (data.userId !== currentUserId) {
        setIsTyping(true);
      }
    }

    function handleTypingStop(data: { userId: string }) {
      if (data.userId !== currentUserId) {
        setIsTyping(false);
      }
    }

    function handleUserOnline(data: { userId: string }) {
      if (data.userId !== currentUserId) {
        setIsOnline(true);
      }
    }

    function handleUserOffline(data: { userId: string }) {
      if (data.userId !== currentUserId) {
        setIsOnline(false);
      }
    }

    socket.on(REALTIME_EVENTS.CHAT_MESSAGE_CREATED, handleMessage);
    socket.on(REALTIME_EVENTS.CHAT_DELIVERED, handleDelivered);
    socket.on(REALTIME_EVENTS.CHAT_READ, handleRead);
    socket.on(REALTIME_EVENTS.CHAT_TYPING_START, handleTypingStart);
    socket.on(REALTIME_EVENTS.CHAT_TYPING_STOP, handleTypingStop);
    socket.on(REALTIME_EVENTS.USER_ONLINE, handleUserOnline);
    socket.on(REALTIME_EVENTS.USER_OFFLINE, handleUserOffline);

    return () => {
      socket.off(REALTIME_EVENTS.CHAT_MESSAGE_CREATED, handleMessage);
      socket.off(REALTIME_EVENTS.CHAT_DELIVERED, handleDelivered);
      socket.off(REALTIME_EVENTS.CHAT_READ, handleRead);
      socket.off(REALTIME_EVENTS.CHAT_TYPING_START, handleTypingStart);
      socket.off(REALTIME_EVENTS.CHAT_TYPING_STOP, handleTypingStop);
      socket.off(REALTIME_EVENTS.USER_ONLINE, handleUserOnline);
      socket.off(REALTIME_EVENTS.USER_OFFLINE, handleUserOffline);
    };
  }, [socket, currentUserId, setMessages, setIsTyping, setIsOnline]);
}
