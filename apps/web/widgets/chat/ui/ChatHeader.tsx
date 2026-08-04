"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, MoreVertical } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar-pair/Avatar";

type Partner = {
  id: string;
  firstName: string;
  avatarUrl: string | null;
};

type ChatHeaderProps = {
  partner: Partner | null;
  isOnline: boolean;
  isTyping: boolean;
};

export function ChatHeader({ partner, isOnline, isTyping }: ChatHeaderProps) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-card/90 backdrop-blur-xl">
      <div className="flex h-18 items-center justify-between px-4 pt-[env(safe-area-inset-top)]">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Назад"
            onClick={() => router.back()}
            className="flex size-10 items-center justify-center rounded-full border border-transparent transition-all duration-200 hover:border-border hover:bg-muted active:scale-95"
          >
            <ChevronLeft className="size-5" />
          </button>

          <div className="relative">
            <Avatar size="default">
              <AvatarImage
                src={partner?.avatarUrl ?? undefined}
                alt={partner?.firstName ?? "Partner"}
              />

              <AvatarFallback>{partner?.firstName?.charAt(0).toUpperCase() ?? "?"}</AvatarFallback>
            </Avatar>

            {isOnline && (
              <span
                className="absolute bottom-0 right-0 size-3 rounded-full border-2 border-card bg-success"
                aria-hidden
              />
            )}
          </div>

          <div className="flex min-w-0 flex-col">
            <h4 className="truncate leading-tight">{partner?.firstName ?? "Неизвестно"}</h4>

            <span
              className={`body-sm transition-colors duration-200 ${
                isTyping ? "text-primary" : isOnline ? "text-success" : "text-muted-foreground"
              }`}
            >
              {isTyping ? "печатает…" : isOnline ? "В сети" : "Не в сети"}
            </span>
          </div>
        </div>

        <button
          type="button"
          aria-label="Меню"
          className="flex size-10 items-center justify-center rounded-full border border-transparent transition-all duration-200 hover:border-border hover:bg-muted active:scale-95"
        >
          <MoreVertical className="size-5" />
        </button>
      </div>
    </header>
  );
}
