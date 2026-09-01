"use client";

import { Button } from "@/shared/ui";

interface DeleteEventButtonProps {
  onDelete?: () => void;
}

export function DeleteEventButton({ onDelete }: DeleteEventButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      onClick={onDelete}
      className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
    >
      Удалить событие
    </Button>
  );
}
