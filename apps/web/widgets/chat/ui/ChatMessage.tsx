"use client";

import { cn } from "@/shared/lib/cn";
import { Avatar, AvatarBadge, AvatarFallback, AvatarImage } from "@/shared/ui/avatar-pair/Avatar";

import { Bubble, BubbleContent, BubbleTail } from "./bubble";
import { Message, MessageAvatar, MessageContent, MessageHeader } from "./message";

type ChatMessageData = {
  id: string;
  content: string | null;
  sender: {
    id: string;
    firstName: string;
    avatarUrl?: string | null;
  };
  createdAt: string;
  status?: "sending" | "sent" | "delivered" | "read" | "error";
};

export function ChatMessage({
  message,
  currentUserId,
  showAvatar = true,
  showName = true,
  isFirstInGroup = false,
}: {
  message: ChatMessageData;
  currentUserId: string;
  showAvatar?: boolean;
  showName?: boolean;
  isFirstInGroup?: boolean;
}) {
  const isMine = message.sender.id === currentUserId;
  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Message align={isMine ? "end" : "start"}>
      {!isMine && (
        <MessageAvatar className={!showAvatar ? "opacity-0" : ""}>
          {showAvatar && (
            <Avatar>
              {message.sender.avatarUrl && <AvatarImage src={message.sender.avatarUrl} />}
              <AvatarFallback>{message.sender.firstName.slice(0, 1)}</AvatarFallback>
              <AvatarBadge />
            </Avatar>
          )}
        </MessageAvatar>
      )}

      <MessageContent>
        {!isMine && showName && <MessageHeader>{message.sender.firstName}</MessageHeader>}

        <Bubble variant={isMine ? "default" : "secondary"} align={isMine ? "end" : "start"}>
          {isFirstInGroup && (
            <BubbleTail
              align={isMine ? "end" : "start"}
              className={isMine ? "fill-primary" : "fill-card stroke-border"}
            />
          )}
          <BubbleContent>
            <div className="flex flex-wrap items-end gap-x-2 gap-y-1">
              <span className="break-words">{message.content}</span>
              <span
                className={cn(
                  "ml-auto shrink-0 translate-y-0.5 text-[11px] leading-none",
                  isMine ? "text-primary-foreground/70" : "text-muted-foreground/70",
                )}
              >
                {time}
                {isMine && message.status && (
                  <span className="ml-1 inline-flex items-center">
                    {message.status === "sending" && (
                      <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent opacity-60" />
                    )}
                    {message.status === "sent" && (
                      <svg
                        className="h-3 w-3"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                    {message.status === "delivered" && (
                      <span className="flex">
                        <svg
                          className="h-3 w-3"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <svg
                          className="-ml-1.5 h-3 w-3"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </span>
                    )}
                    {message.status === "read" && (
                      <span className="flex">
                        <svg
                          className="h-3 w-3"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <svg
                          className="-ml-1.5 h-3 w-3"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </span>
                    )}
                    {message.status === "error" && (
                      <span className="font-bold text-destructive">!</span>
                    )}
                  </span>
                )}
              </span>
            </div>
          </BubbleContent>
        </Bubble>
      </MessageContent>
    </Message>
  );
}
