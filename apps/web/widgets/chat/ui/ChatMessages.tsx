import { useCallback, useMemo } from "react";

import { ChatMessage } from "./ChatMessage";
import { MessageGroup } from "./message";

export type ChatMessagesProps = {
  currentUserId: string;
  onMessagesViewed?: (messageIds: string[]) => void;
  messages: Array<{
    id: string;
    content: string | null;
    sender: {
      id: string;
      firstName: string;
      avatarUrl?: string | null;
    };
    createdAt: string;
  }>;
};

type MessageGroupItem = {
  id: string;
  senderId: string;
  messages: ChatMessagesProps["messages"];
};

type ChatListItem =
  | {
      type: "date";
      label: string;
    }
  | {
      type: "group";
      group: MessageGroupItem;
    };

function isSameDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function formatMessageDate(date: Date) {
  const today = new Date();

  if (isSameDay(date, today)) {
    return "Сегодня";
  }

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (isSameDay(date, yesterday)) {
    return "Вчера";
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
  }).format(date);
}

export function ChatMessages({ messages, currentUserId, onMessagesViewed }: ChatMessagesProps) {
  const groupedMessages = useMemo<MessageGroupItem[]>(() => {
    return messages.reduce<MessageGroupItem[]>((groups, message) => {
      const lastGroup = groups.at(-1);

      if (lastGroup?.senderId === message.sender.id) {
        lastGroup.messages.push(message);
        return groups;
      }

      groups.push({
        id: message.id,
        senderId: message.sender.id,
        messages: [message],
      });

      return groups;
    }, []);
  }, [messages]);

  const items = useMemo<ChatListItem[]>(() => {
    const result: ChatListItem[] = [];

    let previousDate: Date | null = null;

    for (const group of groupedMessages) {
      const firstMessage = group.messages[0];

      if (!firstMessage) {
        continue;
      }

      const currentDate = new Date(firstMessage.createdAt);

      if (!previousDate || !isSameDay(previousDate, currentDate)) {
        result.push({
          type: "date",
          label: formatMessageDate(currentDate),
        });

        previousDate = currentDate;
      }

      result.push({
        type: "group",
        group,
      });
    }

    return result;
  }, [groupedMessages]);

  const handleMessagesViewed = useCallback(() => {
    if (!onMessagesViewed) {
      return;
    }

    onMessagesViewed(messages.map((message) => message.id));
  }, [messages, onMessagesViewed]);

  return (
    <section className="flex flex-1 overflow-y-auto" onMouseEnter={handleMessagesViewed}>
      <div className="mx-auto flex w-full max-w-8xl  flex-col px-5 py-6">
        {items.map((item, index) => {
          if (item.type === "date") {
            return (
              <div key={`date-${index}`} className="sticky top-4 z-10 my-6 flex justify-center">
                <div className="rounded-full border border-border/50 bg-card/80 px-4 py-1 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur-xl">
                  {item.label}
                </div>
              </div>
            );
          }

          return (
            <div key={item.group.id} className="mb-5 flex flex-col" data-message-group>
              <MessageGroup>
                {item.group.messages.map((message, messageIndex) => (
                  <div key={message.id} data-message>
                    <ChatMessage
                      message={message}
                      currentUserId={currentUserId}
                      showAvatar={message.sender.id !== currentUserId && messageIndex === 0}
                      showName={false}
                    />
                  </div>
                ))}
              </MessageGroup>
            </div>
          );
        })}

        <div className="h-24 shrink-0" />
      </div>
    </section>
  );
}
