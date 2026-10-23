"use client";
import { type FormEvent, type ReactNode, useRef, useState } from "react";
import { isAxiosError } from "axios";
import { ArrowLeft, X } from "lucide-react";

import { Button } from "@/shared/ui";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/shared/ui/dialog/dialog";

import styles from "@/shared/ui/dialog/dialog-layout.module.css";

export function savingsError(error: unknown) {
  const message: unknown = isAxiosError(error)
    ? error.response?.data?.message
    : error instanceof Error
      ? error.message
      : null;
  return Array.isArray(message)
    ? message.join(". ")
    : typeof message === "string"
      ? message
      : "Не удалось сохранить. Попробуйте ещё раз.";
}
export function SavingsDialog({
  title,
  description,
  children,
  onClose,
  onBack,
  onSubmit,
  submitLabel,
  disabled = false,
  closeOnSubmit = true,
}: {
  title: string;
  description: string;
  children: ReactNode;
  onClose: () => void;
  onBack?: (() => void) | undefined;
  onSubmit: () => Promise<unknown>;
  submitLabel: string;
  disabled?: boolean;
  closeOnSubmit?: boolean;
}) {
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (lock.current || disabled) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      await onSubmit();
      if (closeOnSubmit) onClose();
    } catch (error) {
      setError(savingsError(error));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !lock.current) onClose();
      }}
    >
      <DialogContent
        layout="custom"
        className={`${styles.dialog} translate-x-0 translate-y-0`}
        showCloseButton={false}
      >
        <header className={styles.header}>
          {onBack && (
            <Button
              variant="icon"
              iconOnly
              aria-label="Назад к копилке"
              onClick={onBack}
              disabled={busy}
            >
              <ArrowLeft />
            </Button>
          )}
          <DialogTitle className="flex-1 text-xl font-semibold leading-tight">{title}</DialogTitle>
          <Button variant="icon" iconOnly aria-label="Закрыть" onClick={onClose} disabled={busy}>
            <X />
          </Button>
        </header>
        <DialogDescription className="sr-only">{description}</DialogDescription>
        <form onSubmit={submit} className={styles.form}>
          <div className={styles.body}>
            <fieldset className={styles.fields} disabled={busy}>
              {children}
            </fieldset>
            {error && (
              <p role="alert" className="mt-4 text-sm text-destructive">
                {error}
              </p>
            )}
          </div>
          <footer className={styles.footer}>
            <Button
              type="submit"
              fullWidth
              loading={busy}
              disabled={disabled}
              className="shadow-none"
            >
              {submitLabel}
            </Button>
          </footer>
        </form>
      </DialogContent>
    </Dialog>
  );
}
