"use client";

import Link from "next/link";

import { useMe } from "@/features/auth";
import { useCurrentCouple } from "@/features/relationship/hook/use-relationship";
import { AvatarPair } from "@/shared/ui/avatar-pair/AvatarPair";

export function HomeHeader() {
  const { data: user } = useMe();
  const { data: couple } = useCurrentCouple();

  return (
    <header className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-3xl font-semibold tracking-tight">День</h1>
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
    </header>
  );
}
