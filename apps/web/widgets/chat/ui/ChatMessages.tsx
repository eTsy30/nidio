"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";

import type { ChatMessageItem } from "../type/chat";

import { ChatMessage } from "./ChatMessage";
import { MessageGroup } from "./message";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "./message-scroller";

export type ChatMessagesProps = {
  currentUserId: string;
  onMessagesViewed?: (messageIds: string[]) => void;
  messages: ChatMessageItem[];
  onEdit?: ((message: ChatMessageItem) => void) | undefined;
  onDelete?: ((messageId: string) => void) | undefined;
  onAddReaction?: ((messageId: string, emoji: string) => void) | undefined;
  onRemoveReaction?: ((messageId: string, emoji: string) => void) | undefined;
};

type MessageGroupItem = {
  id: string;
  senderId: string;
  messages: ChatMessageItem[];
};

type ChatListItem = { type: "date"; label: string } | { type: "group"; group: MessageGroupItem };

function isSameDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function formatMessageDate(date: Date) {
  const today = new Date();
  if (isSameDay(date, today)) return "Сегодня";
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (isSameDay(date, yesterday)) return "Вчера";
  return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long" }).format(date);
}

export function ChatMessages({
  messages,
  currentUserId,
  onMessagesViewed,
  onEdit,
  onDelete,
  onAddReaction,
  onRemoveReaction,
}: ChatMessagesProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const shouldScrollRef = useRef(true);

  const groupedMessages = useMemo<MessageGroupItem[]>(() => {
    return messages.reduce<MessageGroupItem[]>((groups, message) => {
      const lastGroup = groups.at(-1);
      if (lastGroup?.senderId === message.sender.id) {
        lastGroup.messages.push(message);
        return groups;
      }
      groups.push({ id: message.id, senderId: message.sender.id, messages: [message] });
      return groups;
    }, []);
  }, [messages]);

  const items = useMemo<ChatListItem[]>(() => {
    const result: ChatListItem[] = [];
    let previousDate: Date | null = null;
    for (const group of groupedMessages) {
      const firstMessage = group.messages[0];
      if (!firstMessage) continue;
      const currentDate = new Date(firstMessage.createdAt);
      if (!previousDate || !isSameDay(previousDate, currentDate)) {
        result.push({ type: "date", label: formatMessageDate(currentDate) });
        previousDate = currentDate;
      }
      result.push({ type: "group", group });
    }
    return result;
  }, [groupedMessages]);

  useEffect(() => {
    if (!shouldScrollRef.current) return;
    const viewport = viewportRef.current;
    if (!viewport) return;
    requestAnimationFrame(() => {
      viewport.scrollTo({ top: viewport.scrollHeight, behavior: "smooth" });
    });
  }, [messages.length]);

  const handleScroll = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const isNearBottom = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight < 120;
    shouldScrollRef.current = isNearBottom;
  }, []);

  const handleMessagesViewed = useCallback(() => {
    if (!onMessagesViewed) return;
    onMessagesViewed(messages.map((message) => message.id));
  }, [messages, onMessagesViewed]);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <MessageScrollerProvider>
        <MessageScroller className="h-full">
          <MessageScrollerViewport
            ref={viewportRef}
            onScroll={handleScroll}
            onMouseEnter={handleMessagesViewed}
          >
            <MessageScrollerContent className="mx-auto w-full max-w-8xl px-4 py-2">
              {items.map((item, index) => {
                if (item.type === "date") {
                  return (
                    <MessageScrollerItem key={`date-${index}`} className="py-4">
                      <div className="flex justify-center">
                        <div className="rounded-full border border-border/60 bg-card/90 px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-soft backdrop-blur-md">
                          {item.label}
                        </div>
                      </div>
                    </MessageScrollerItem>
                  );
                }
                return (
                  <MessageScrollerItem key={item.group.id} className="py-1">
                    <MessageGroup>
                      {item.group.messages.map((message, messageIndex) => (
                        <ChatMessage
                          key={message.id}
                          message={message}
                          currentUserId={currentUserId}
                          showAvatar={message.sender.id !== currentUserId && messageIndex === 0}
                          showName={false}
                          isFirstInGroup={messageIndex === 0}
                          onEdit={onEdit}
                          onDelete={onDelete}
                          onAddReaction={onAddReaction}
                          onRemoveReaction={onRemoveReaction}
                        />
                      ))}
                    </MessageGroup>
                  </MessageScrollerItem>
                );
              })}
              <div className="h-4 shrink-0" />
            </MessageScrollerContent>
          </MessageScrollerViewport>
          <MessageScrollerButton direction="end" />
        </MessageScroller>
      </MessageScrollerProvider>
    </div>
  );
}
