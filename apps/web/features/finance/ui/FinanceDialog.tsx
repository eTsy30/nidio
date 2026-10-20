"use client";
import { type FormEvent, type ReactNode, useRef, useState } from "react";
import { isAxiosError } from "axios";

import { Button } from "@/shared/ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog/dialog";
export function FinanceDialog({
  title,
  description = "Изменения будут видны вам и партнёру.",
  onClose,
  onSubmit,
  children,
  submitLabel = "Сохранить",
  destructive = false,
}: {
  title: string;
  description?: string;
  onClose: () => void;
  onSubmit: () => Promise<unknown>;
  children: ReactNode;
  submitLabel?: string;
  destructive?: boolean;
}) {
  const inFlight = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError("");
    try {
      await onSubmit();
      onClose();
    } catch (e) {
      const message = isAxiosError(e)
        ? e.response?.data?.message
        : e instanceof Error
          ? e.message
          : null;
      setError(
        Array.isArray(message)
          ? message.join(". ")
          : message || "Не удалось сохранить. Проверьте соединение и попробуйте снова.",
      );
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }
  return (
    <Dialog open onOpenChange={(open) => !open && !busy && onClose()}>
      <DialogContent className="sm:max-w-lg" showCloseButton={!busy}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <fieldset disabled={busy} className="min-w-0 space-y-4">
            {children}
          </fieldset>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button variant="secondary" disabled={busy} onClick={onClose}>
              Отмена
            </Button>
            <Button type="submit" loading={busy} variant={destructive ? "destructive" : "primary"}>
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
export function ConfirmDelete({
  title,
  onClose,
  onDelete,
}: {
  title: string;
  onClose: () => void;
  onDelete: () => Promise<unknown>;
}) {
  return (
    <FinanceDialog
      title="Удалить?"
      onClose={onClose}
      onSubmit={onDelete}
      destructive
      submitLabel="Удалить"
    >
      <p className="break-words">{title}</p>
      <p className="text-sm text-muted-foreground">Это действие нельзя отменить.</p>
    </FinanceDialog>
  );
}
