"use client";

import { Pencil } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar-pair/Avatar";
import { Button } from "@/shared/ui/button/Button";

interface ProfileHeaderProps {
  firstName: string | null;
  email: string;
  avatarUrl: string | null;
  onEdit?: () => void;
}

export function ProfileHeader({ firstName, email, avatarUrl, onEdit }: ProfileHeaderProps) {
  const displayName = firstName?.trim() || "Пользователь";
  const fallback = displayName.charAt(0).toUpperCase();

  return (
    <section className="flex items-center gap-4">
      <Avatar size="lg" className="size-16 shrink-0">
        <AvatarImage src={avatarUrl ?? undefined} alt={displayName} />
        <AvatarFallback>{fallback}</AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <h1 className="truncate text-xl font-semibold tracking-tight">{displayName}</h1>

        <p className="mt-1 truncate text-sm text-muted-foreground">{email}</p>
      </div>

      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={onEdit}
        disabled={!onEdit}
        className="shrink-0"
      >
        <Pencil className="size-4" />
        <span className="hidden sm:inline">Редактировать</span>
      </Button>
    </section>
  );
}
