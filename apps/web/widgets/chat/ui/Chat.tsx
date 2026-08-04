"use client";

import { useState } from "react";

import { useAuth } from "@/shared/api/provider/auth-provider";
import { useRealtime } from "@/shared/realtime";

import { useChatRealtime } from "../model/useChatRealtime";
import { useLoadMessages } from "../model/useLoadMessages";
import { useMarkMessagesRead } from "../model/useMarkMessagesRead";
import { useSendMessage } from "../model/useSendMessage";
import { ChatMessageItem } from "../type/chat";

import { ChatHeader } from "./ChatHeader";
import { ChatInput } from "./ChatInput";
import { ChatMessages } from "./ChatMessages";

export function Chat() {
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);

  const socket = useRealtime();
  const { user } = useAuth();

  const currentUserId = user?.id ?? "";
  const partner = user?.relationship?.partner ?? null;
  const isOnline = user?.relationship?.connected ?? false;

  useLoadMessages(setMessages);

  useChatRealtime({
    socket,
    currentUserId,
    setMessages,
  });

  const sendMessage = useSendMessage(socket);
  const markMessagesRead = useMarkMessagesRead(socket);

  return (
    <section className="flex h-full min-h-0 flex-1 flex-col  bg-background">
      <div className="shrink-0 border-b border-border/50 bg-background/90 backdrop-blur-xl">
        <ChatHeader partner={partner} isOnline={isOnline} isTyping={false} />
      </div>

      <main className="min-h-0 flex-1 ">
        <ChatMessages
          messages={messages}
          currentUserId={currentUserId}
          onMessagesViewed={markMessagesRead}
        />
      </main>

      <div className="shrink-0 border-t border-border/50 bg-background/90 px-4 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-4 backdrop-blur-xl">
        <ChatInput onMessageSent={sendMessage} />
      </div>
    </section>
  );
}
