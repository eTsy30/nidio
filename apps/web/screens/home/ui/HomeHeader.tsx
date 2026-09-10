"use client";

import { useMe } from "@/features/auth";
import { useCurrentCouple } from "@/features/relationship/hook/use-relationship";
import { AvatarPair } from "@/shared/ui/avatar-pair/AvatarPair";

export function HomeHeader() {
  const { data: user } = useMe();

  const { data: couple, isPending, isError } = useCurrentCouple();
  const partner = couple?.partnerId
    ? {
        firstName: couple.partnerFirstName || "Партнёр",
        avatarUrl: couple.partnerAvatarUrl,
      }
    : null;

  const hour = new Date().getHours();

  const greeting = hour < 12 ? "Доброе утро ☀️" : hour < 18 ? "Добрый день 🌤️" : "Добрый вечер 🌙";

  const subtitle = partner
    ? "Дом там, где вы вдвоём ❤️"
    : isPending
      ? "Загружаем ваше пространство…"
      : isError
        ? "Ваше пространство ❤️"
        : "Пригласите любимого человека ❤️";

  const currentFallback = user?.firstName?.charAt(0).toUpperCase() ?? "?";
  const partnerFallback = partner?.firstName?.charAt(0).toUpperCase() ?? "?";

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{greeting}</p>
          <h1 className="mt-1 text-base sm:text-xl font-semibold tracking-tight">{subtitle}</h1>
        </div>

        <AvatarPair
          leftAvatar={user?.avatarUrl ?? undefined}
          rightAvatar={partner?.avatarUrl ?? undefined}
          leftAlt={user?.firstName ?? undefined}
          rightAlt={partner?.firstName ?? undefined}
          leftFallback={currentFallback}
          rightFallback={partner ? partnerFallback : undefined}
          size="default"
          className="shrink-0"
        />
      </div>
    </header>
  );
}
