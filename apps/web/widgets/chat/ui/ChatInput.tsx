"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpIcon } from "lucide-react";

import { cn } from "@/shared/lib/cn";
import { useRealtime } from "@/shared/realtime/hooks/useRealtime";
import { Button } from "@/shared/ui/button";

export function ChatInput({
  onMessageSent,
}: {
  onMessageSent?: (message: { content: string }) => void;
}) {
  const [message, setMessage] = useState("");

  const socket = useRealtime();

  const typingTimeout = useRef<NodeJS.Timeout | null>(null);

  function emitTypingStart() {
    socket?.emit("chat:typing:start");

    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
    }

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

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!message.trim()) {
      return;
    }

    emitTypingStop();

    onMessageSent?.({
      content: message.trim(),
    });

    setMessage("");
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div
        className={cn(
          "flex flex-col gap-2",
          "rounded-[var(--radius-lg)]",
          "border border-border",
          "bg-background",
          "p-2",
          "shadow-soft",
          "transition-all",
          "focus-within:border-primary",
        )}
      >
        <textarea
          value={message}
          onChange={(event) => {
            const value = event.target.value;

            setMessage(value);

            if (value.trim()) {
              emitTypingStart();
            } else {
              emitTypingStop();
            }
          }}
          placeholder="Написать сообщение..."
          rows={1}
          className={cn(
            "min-h-12 w-full resize-none",
            "bg-transparent",
            "px-3 py-2",
            "text-sm",
            "outline-none",
            "placeholder:text-muted-foreground",
          )}
        />

        <div className="flex items-center gap-2">
          <Button
            type="submit"
            size="icon-sm"
            className="ml-auto"
            disabled={!message.trim()}
            aria-label="Отправить"
          >
            <ArrowUpIcon />
          </Button>
        </div>
      </div>
    </form>
  );
}
