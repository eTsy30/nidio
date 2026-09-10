import { Dispatch, SetStateAction, useCallback, useEffect } from "react";

import type { ApiError } from "@/shared/api/client/api";
import { http } from "@/shared/api/client/api";

import { ChatMessageItem } from "../type/chat";

import { getMessageStatus, mergeMessages } from "./message-state";

type GetMessagesResponse = {
  messages: Array<
    ChatMessageItem & {
      deliveredAt?: string | null;
      readAt?: string | null;
    }
  >;
};

export function useLoadMessages(setMessages: Dispatch<SetStateAction<ChatMessageItem[]>>) {
  const loadMessages = useCallback(async () => {
    try {
      const data = await http.get<GetMessagesResponse>("/chat/messages");
      const messages = data.messages.map((message) => ({
        ...message,
        status: getMessageStatus(message),
      }));
      setMessages((current) => mergeMessages(current, messages));
    } catch (error) {
      if (error instanceof Error) {
        const apiError = error as ApiError;
        console.error(
          "Failed to load chat messages",
          apiError.response?.data?.message ?? apiError.message,
        );
      }
    }
  }, [setMessages]);

  useEffect(() => {
    void loadMessages();
  }, [loadMessages]);

  return loadMessages;
}
