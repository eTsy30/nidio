import { Dispatch, SetStateAction, useCallback } from "react";
import type { Socket } from "socket.io-client";

import type { ClientToServerEvents, ServerToClientEvents } from "@/shared/realtime/types/events";

import type { ChatMessageItem } from "../type/chat";

type SendMessagePayload = {
  content: string;
};

type Props = {
  socket: Socket<ServerToClientEvents, ClientToServerEvents> | null;
  currentUser: { id: string; firstName: string; avatarUrl?: string | null } | null;
  setMessages: Dispatch<SetStateAction<ChatMessageItem[]>>;
};

export function useSendMessage({ socket, currentUser, setMessages }: Props) {
  const send = useCallback(
    ({ content }: SendMessagePayload, existing?: ChatMessageItem): void => {
      if (!socket?.connected || !currentUser) {
        throw new Error("Socket is not connected");
      }

      const clientId = existing?.clientId ?? crypto.randomUUID();
      const optimisticId = existing?.id ?? `optimistic:${clientId}`;
      setMessages((messages) => {
        if (existing) {
          return messages.map((message) =>
            message.id === existing.id ? { ...message, status: "sending" } : message,
          );
        }
        return [
          ...messages,
          {
            id: optimisticId,
            clientId,
            content,
            sender: currentUser,
            createdAt: new Date().toISOString(),
            status: "sending",
          },
        ];
      });

      socket
        .timeout(10_000)
        .emit("chat:send", { clientId, type: "TEXT", content }, (error, result) => {
          if (!error && result?.ok) {
            setMessages((messages) =>
              messages.map((message) =>
                message.id === optimisticId ? { ...message, status: "sent" } : message,
              ),
            );
            return;
          }
          setMessages((messages) =>
            messages.map((message) =>
              message.id === optimisticId ? { ...message, status: "error" } : message,
            ),
          );
        });
    },
    [socket, currentUser, setMessages],
  );

  return {
    sendMessage: send,
    retryMessage: (message: ChatMessageItem) => send({ content: message.content ?? "" }, message),
  };
}
