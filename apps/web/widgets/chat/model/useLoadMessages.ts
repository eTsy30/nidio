import { Dispatch, SetStateAction, useEffect } from "react";

import type { ApiError } from "@/shared/api/client/api";
import { http } from "@/shared/api/client/api";

import { ChatMessageItem } from "../type/chat";

type GetMessagesResponse = {
  messages: Array<
    ChatMessageItem & {
      deliveredAt?: string | null;
      readAt?: string | null;
    }
  >;
};

export function useLoadMessages(setMessages: Dispatch<SetStateAction<ChatMessageItem[]>>) {
  useEffect(() => {
    async function loadMessages() {
      try {
        const data = await http.get<GetMessagesResponse>("/chat/messages");

        setMessages(
          data.messages
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
            .map((message) => ({
              ...message,
              status: message.readAt ? "read" : message.deliveredAt ? "delivered" : "sent",
            })),
        );
      } catch (error) {
        if (error instanceof Error) {
          const apiError = error as ApiError;
          console.error(
            "Failed to load chat messages",
            apiError.response?.data?.message ?? apiError.message,
          );
        }
      }
    }

    void loadMessages();
  }, [setMessages]);
}
