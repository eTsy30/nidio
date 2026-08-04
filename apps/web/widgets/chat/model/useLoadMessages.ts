import { Dispatch, SetStateAction, useEffect } from "react";

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
          data.messages.map((message) => ({
            ...message,
            status: message.readAt ? "read" : message.deliveredAt ? "delivered" : "sent",
          })),
        );
      } catch (error) {
        console.error("Failed to load chat messages", error);
      }
    }

    void loadMessages();
  }, [setMessages]);
}
