"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpIcon } from "lucide-react";

import { cn } from "@/shared/lib/cn";
import type { ClientToServerEvents, ServerToClientEvents } from "@/shared/realtime/types/events";
import { Button } from "@/shared/ui/button";

type ChatInputProps = {
  onMessageSent?: (message: { content: string }) => void;
  onMessageEdit?: (payload: { messageId: string; content: string }) => void;
  editingMessage?: { id: string; content: string } | null;
  onCancelEdit?: () => void;
  socket?: import("socket.io-client").Socket<ServerToClientEvents, ClientToServerEvents> | null;
};

export function ChatInput({
  onMessageSent,
  onMessageEdit,
  editingMessage,
  onCancelEdit,
  socket,
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!editingMessage) return;
    const id = requestAnimationFrame(() => {
      setMessage(editingMessage.content);
      textareaRef.current?.focus();
    });
    return () => cancelAnimationFrame(id);
  }, [editingMessage]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [message]);

  function emitTypingStart() {
    socket?.emit("chat:typing:start");
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket?.emit("chat:typing:stop");
    }, 1000);
  }

  function emitTypingStop() {
    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
      typingTimeout.current = null;
    }
    socket?.emit("chat:typing:stop");
  }

  useEffect(() => {
    return () => {
      emitTypingStop();
    };
  }, []);

  function handleSubmit(event?: React.FormEvent) {
    event?.preventDefault();
    if (!message.trim()) return;

    emitTypingStop();

    if (editingMessage && onMessageEdit) {
      onMessageEdit({ messageId: editingMessage.id, content: message.trim() });
      onCancelEdit?.();
    } else {
      onMessageSent?.({ content: message.trim() });
    }

    setMessage("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      {editingMessage && (
        <div className="mb-1 flex items-center justify-between px-1 text-xs text-muted-foreground">
          <span>Редактирование сообщения</span>
          <button
            type="button"
            onClick={() => {
              onCancelEdit?.();
              setMessage("");
            }}
            className="hover:text-foreground transition-colors"
          >
            Отмена
          </button>
        </div>
      )}

      <div
        className={cn(
          "flex items-end gap-2",
          "rounded-[var(--radius-lg)]",
          "border border-border",
          "bg-card",
          "p-2",
          "shadow-soft",
          "transition-all duration-200",
          "focus-within:shadow-floating focus-within:ring-1 focus-within:ring-primary/20",
        )}
      >
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(event) => {
            const value = event.target.value;
            setMessage(value);
            if (value.trim()) emitTypingStart();
            else emitTypingStop();
          }}
          onKeyDown={handleKeyDown}
          placeholder={editingMessage ? "Изменить сообщение..." : "Написать сообщение..."}
          rows={1}
          className={cn(
            "ml-5",
            "min-h-[48px] max-h-[200px] w-full resize-none",
            "bg-transparent",
            "px-3 py-3",
            "text-[15px] leading-6",
            "border-0 outline-none",
            "focus:border-0 focus:outline-none focus:ring-0",
            "focus-visible:border-0 focus-visible:outline-none focus-visible:ring-0",
            "placeholder:text-muted-foreground/60",
          )}
        />

        <Button
          type="submit"
          size="icon"
          className={cn(
            "shrink-0 rounded-full transition-all duration-200",
            message.trim()
              ? "bg-primary text-primary-foreground shadow-soft hover:bg-primary/90 hover:shadow-floating hover:-translate-y-0.5"
              : "bg-muted text-muted-foreground",
          )}
          disabled={!message.trim()}
          aria-label={editingMessage ? "Сохранить" : "Отправить"}
        >
          <ArrowUpIcon className="size-5" />
        </Button>
      </div>
    </form>
  );
}
