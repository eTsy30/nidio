"use client";

import { AlertCircle, Check, CheckCheck, Loader2, Pencil, Trash2 } from "lucide-react";

import { cn } from "@/shared/lib/cn";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar-pair/Avatar";

import type { ChatMessageItem } from "../type/chat";

import { Bubble, BubbleContent, BubbleReactions, BubbleTail } from "./bubble";
import { Message, MessageAvatar, MessageContent, MessageHeader } from "./message";
import { REACTION_COLORS, REACTION_KEYS, ReactionIcon } from "./reaction-icon";

type ChatMessageProps = {
  message: ChatMessageItem;
  currentUserId: string;
  showAvatar?: boolean;
  showName?: boolean;
  isFirstInGroup?: boolean;
  onEdit?: ((message: ChatMessageItem) => void) | undefined;
  onDelete?: ((messageId: string) => void) | undefined;
  onAddReaction?: ((messageId: string, emoji: string) => void) | undefined;
  onRemoveReaction?: ((messageId: string, emoji: string) => void) | undefined;
};

export function ChatMessage({
  message,
  currentUserId,
  showAvatar = true,
  showName = true,
  isFirstInGroup = false,
  onEdit,
  onDelete,
  onAddReaction,
  onRemoveReaction,
}: ChatMessageProps) {
  const isMine = message.sender.id === currentUserId;
  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const isEdited =
    !!message.updatedAt &&
    new Date(message.updatedAt).getTime() !== new Date(message.createdAt).getTime();

  const hasReactions = message.reactions && message.reactions.length > 0;

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
              <span className="wrap-break-word">{message.content}</span>

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

          {hasReactions && (
            <BubbleReactions side="bottom" align={isMine ? "end" : "start"}>
              {message.reactions!.map((reaction) => {
                const isMyReaction = reaction.userId === currentUserId;
                const colors = REACTION_COLORS[reaction.emoji as keyof typeof REACTION_COLORS];
                return (
                  <button
                    key={reaction.emoji}
                    type="button"
                    onClick={() => {
                      if (isMyReaction) {
                        onRemoveReaction?.(message.id, reaction.emoji);
                      } else {
                        onAddReaction?.(message.id, reaction.emoji);
                      }
                    }}
                    className={cn(
                      "flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs transition-colors",
                      isMyReaction
                        ? cn(
                            colors?.active || "bg-primary/20",
                            colors?.activeText || "text-primary",
                          )
                        : cn(
                            colors?.inactive || "bg-muted",
                            colors?.inactiveText || "text-muted-foreground",
                          ),
                    )}
                  >
                    <ReactionIcon name={reaction.emoji} className="size-3.5" />
                  </button>
                );
              })}
            </BubbleReactions>
          )}
        </Bubble>

        <div className="relative z-10 mt-4 flex items-center gap-1 opacity-0 transition-opacity duration-200 group-hover/message:opacity-100">
          {REACTION_KEYS.map((key) => {
            const isActive = message.reactions?.some(
              (r) => r.emoji === key && r.userId === currentUserId,
            );
            const colors = REACTION_COLORS[key];
            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  if (isActive) {
                    onRemoveReaction?.(message.id, key);
                  } else {
                    onAddReaction?.(message.id, key);
                  }
                }}
                className={cn(
                  "flex size-6 items-center justify-center rounded-full transition-all",
                  isActive
                    ? cn(colors.active, colors.activeText)
                    : cn(colors.inactive, colors.inactiveText),
                )}
                title={key}
              >
                <ReactionIcon name={key} className="size-3.5" />
              </button>
            );
          })}

          {isMine && (
            <>
              {onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(message)}
                  className="ml-1 flex size-6 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-muted/80"
                  aria-label="Редактировать"
                >
                  <Pencil className="size-3" />
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(message.id)}
                  className="flex size-6 items-center justify-center rounded-full bg-muted text-destructive transition-colors hover:bg-muted/80"
                  aria-label="Удалить"
                >
                  <Trash2 className="size-3" />
                </button>
              )}
            </>
          )}
        </div>
      </MessageContent>
    </Message>
  );
}
