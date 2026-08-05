"use client";

import { useCallback, useState } from "react";

import { useAuth } from "@/shared/api/provider/auth-provider";
import { useRealtime } from "@/shared/realtime";

import { useChatRealtime } from "../model/useChatRealtime";
import { useEditMessage } from "../model/useEditMessage";
import { useLoadMessages } from "../model/useLoadMessages";
import { useMarkMessagesRead } from "../model/useMarkMessagesRead";
import { useSendMessage } from "../model/useSendMessage";
import { ChatMessageItem } from "../type/chat";

import { ChatHeader } from "./ChatHeader";
import { ChatInput } from "./ChatInput";
import { ChatMessages } from "./ChatMessages";

export function Chat() {
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [editingMessage, setEditingMessage] = useState<{ id: string; content: string } | null>(
    null,
  );

  const socket = useRealtime();
  const { user } = useAuth();

  const currentUserId = user?.id ?? "";
  const partner = user?.relationship?.partner ?? null;

  const [isTyping, setIsTyping] = useState(false);
  const [isOnline, setIsOnline] = useState(false);

  useLoadMessages(setMessages);

  useChatRealtime({
    socket,
    currentUserId,
    setMessages,
    setIsTyping,
    setIsOnline,
  });

  const sendMessage = useSendMessage(socket);
  const editMessage = useEditMessage(socket);
  const markMessagesRead = useMarkMessagesRead(socket);

  const handleEdit = useCallback((message: ChatMessageItem) => {
    setEditingMessage({ id: message.id, content: message.content ?? "" });
  }, []);

  const handleEditSubmit = useCallback(
    ({ messageId, content }: { messageId: string; content: string }) => {
      editMessage({ messageId, dto: { content } });
    },
    [editMessage],
  );

  const handleCancelEdit = useCallback(() => {
    setEditingMessage(null);
  }, []);

  return (
    <section className="flex h-[calc(100dvh-60px-env(safe-area-inset-bottom))] flex-col overflow-hidden bg-background">
      <div className="shrink-0 border-b border-border/50 bg-background/90 backdrop-blur-xl">
        <ChatHeader partner={partner} isOnline={isOnline} isTyping={isTyping} />
      </div>

      <ChatMessages
        messages={messages}
        currentUserId={currentUserId}
        onMessagesViewed={markMessagesRead}
        onEdit={handleEdit}
      />

      <div className="shrink-0 border-t border-border/50 bg-background/90 px-4 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-4 backdrop-blur-xl">
        <ChatInput
          socket={socket}
          onMessageSent={sendMessage}
          onMessageEdit={handleEditSubmit}
          editingMessage={editingMessage}
          onCancelEdit={handleCancelEdit}
        />
      </div>
    </section>
  );
}
