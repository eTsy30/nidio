"use client";

import Link from "next/link";
import { Heart } from "lucide-react";

import { useMe } from "@/features/auth";
import { useCurrentCouple } from "@/features/relationship/hook/use-relationship";
import { AvatarPair } from "@/shared/ui/avatar-pair/AvatarPair";

export function HomeHeader() {
  const { data: user } = useMe();
  const { data: couple } = useCurrentCouple();

  return (
    <header className="shrink-0 border-b border-border/70 bg-background/90 px-5 py-4 backdrop-blur-xl sm:px-8">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span className="hidden size-10 shrink-0 sm:flex items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Heart className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-base sm:text-lg font-semibold tracking-tight">
              Ваше пространство
            </p>
            <p className="hidden text-xs text-muted-foreground sm:block">
              Маленькие моменты. Общая история.
            </p>
          </div>
        </div>
        <Link
          href="/profile"
          aria-label="Открыть профиль и настройки пары"
          className="shrink-0 rounded-full hover:no-underline"
        >
          <AvatarPair
            leftAvatar={user?.avatarUrl}
            rightAvatar={couple?.partnerAvatarUrl}
            leftAlt={user?.firstName ?? "Вы"}
            rightAlt={couple?.partnerFirstName ?? "Партнёр"}
            leftFallback={user?.firstName?.charAt(0).toUpperCase() ?? "?"}
            rightFallback={couple?.partnerFirstName?.charAt(0).toUpperCase() ?? "?"}
            size="default"
            className="[&>svg]:hidden sm:[&>svg]:block"
          />
        </Link>
      </div>
    </header>
  );
}
