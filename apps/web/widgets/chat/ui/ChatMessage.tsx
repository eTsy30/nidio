"use client";

import { AlertCircle, Check, CheckCheck, Loader2, Pencil, Trash2 } from "lucide-react";

import { cn } from "@/shared/lib/cn";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar-pair/Avatar";

import type { ChatMessageItem } from "../type/chat";

import { Bubble, BubbleContent, BubbleTail } from "./bubble";
import { Message, MessageAvatar, MessageContent, MessageHeader } from "./message";

type ChatMessageProps = {
  message: ChatMessageItem;
  currentUserId: string;
  showAvatar?: boolean;
  showName?: boolean;
  isFirstInGroup?: boolean;
  onEdit?: ((message: ChatMessageItem) => void) | undefined;
  onDelete?: ((messageId: string) => void) | undefined;
};

export function ChatMessage({
  message,
  currentUserId,
  showAvatar = true,
  showName = true,
  isFirstInGroup = false,
  onEdit,
  onDelete,
}: ChatMessageProps) {
  const isMine = message.sender.id === currentUserId;
  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const isEdited =
    !!message.updatedAt &&
    new Date(message.updatedAt).getTime() !== new Date(message.createdAt).getTime();

  return (
    <Message align={isMine ? "end" : "start"}>
      {!isMine && (
        <MessageAvatar className={!showAvatar ? "opacity-0" : ""}>
          {showAvatar && (
            <Avatar>
              {message.sender.avatarUrl && <AvatarImage src={message.sender.avatarUrl} />}
              <AvatarFallback>{message.sender.firstName.slice(0, 1)}</AvatarFallback>
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

              {isEdited && (
                <span
                  className={cn(
                    "text-[10px] opacity-60",
                    isMine ? "text-primary-foreground/60" : "text-muted-foreground/60",
                  )}
                >
                  изм.
                </span>
              )}

              <span
                className={cn(
                  "ml-auto shrink-0 translate-y-0.5 text-[11px] leading-none",
                  isMine ? "text-primary-foreground/70" : "text-muted-foreground/70",
                )}
              >
                {time}
                {isMine && (
                  <span className="ml-1 inline-flex items-center">
                    {message.status === "sending" && (
                      <Loader2 className="size-3 animate-spin opacity-60" />
                    )}
                    {message.status === "sent" && <Check className="size-3" strokeWidth={3} />}
                    {message.status === "delivered" && (
                      <CheckCheck className="size-3" strokeWidth={3} />
                    )}
                    {message.status === "read" && <CheckCheck className="size-3" strokeWidth={3} />}
                    {message.status === "error" && (
                      <AlertCircle className="size-3 text-destructive" />
                    )}
                  </span>
                )}
              </span>
            </div>
          </BubbleContent>
        </Bubble>

        {isMine && (onEdit || onDelete) && (
          <div className="mt-0.5 flex gap-1.5 self-end opacity-0 transition-opacity duration-200 group-hover/message:opacity-50 hover:!opacity-100">
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(message)}
                className="transition-opacity hover:opacity-100"
                aria-label="Редактировать"
              >
                <Pencil className="size-3" />
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(message.id)}
                className="text-destructive transition-opacity hover:opacity-100"
                aria-label="Удалить"
              >
                <Trash2 className="size-3" />
              </button>
            )}
          </div>
        )}
      </MessageContent>
    </Message>
  );
}
