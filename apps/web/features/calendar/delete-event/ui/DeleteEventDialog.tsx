"use client";

import { useState } from "react";
import { useMutation } from "@apollo/client/react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

import { DELETE_EVENT } from "@/features/calendar/graphql";
import { type CalendarEvent, EventRepeat } from "@/features/calendar/types";
import { Button } from "@/shared/ui/button/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog/dialog";
import { Label } from "@/shared/ui/label";
import { RadioGroup, RadioGroupItem } from "@/shared/ui/radio-group";

type DeleteMode = "THIS" | "FOLLOWING" | "ALL";

interface DeleteEventDialogProps {
  event: CalendarEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}

export function DeleteEventDialog({
  event,
  open,
  onOpenChange,
  onDeleted,
}: DeleteEventDialogProps) {
  const [mode, setMode] = useState<DeleteMode>("ALL");

  const [deleteEvent, { loading }] = useMutation(DELETE_EVENT);

  if (!event) {
    return null;
  }

  const recurring = event.repeat !== EventRepeat.NONE;

  const handleOpenChange = (nextOpen: boolean) => {
    if (loading) {
      return;
    }

    onOpenChange(nextOpen);
  };

  const handleDelete = async () => {
    try {
      await deleteEvent({
        variables: {
          input: {
            id: event.seriesId || event.id,
            mode: recurring ? mode : "ALL",
            occurrenceDate: recurring && mode !== "ALL" ? event.startAt : undefined,
          },
        },
      });

      onOpenChange(false);
      onDeleted?.();
    } catch {
      // !!
    }
  };

  const eventDate = format(new Date(event.startAt), "d MMMM yyyy", {
    locale: ru,
  });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Удалить событие?</DialogTitle>

          <DialogDescription>
            {recurring
              ? `«${event.title}» — повторяющееся событие от ${eventDate}.`
              : `Событие «${event.title}» будет удалено.`}
          </DialogDescription>
        </DialogHeader>

        {recurring ? (
          <RadioGroup
            value={mode}
            onValueChange={(value) => setMode(value as DeleteMode)}
            className="mt-2 gap-3"
          >
            <div className="flex items-start gap-3 rounded-xl border p-3">
              <RadioGroupItem id="delete-this" value="THIS" className="mt-0.5" />

              <Label htmlFor="delete-this" className="cursor-pointer leading-5">
                <span className="block font-medium">Только это событие</span>

                <span className="block text-sm font-normal text-muted-foreground">
                  Удалить только это вхождение
                </span>
              </Label>
            </div>

            <div className="flex items-start gap-3 rounded-xl border p-3">
              <RadioGroupItem id="delete-following" value="FOLLOWING" className="mt-0.5" />

              <Label htmlFor="delete-following" className="cursor-pointer leading-5">
                <span className="block font-medium">Это и все последующие</span>

                <span className="block text-sm font-normal text-muted-foreground">
                  Завершить серию с этой даты
                </span>
              </Label>
            </div>

            <div className="flex items-start gap-3 rounded-xl border p-3">
              <RadioGroupItem id="delete-all" value="ALL" className="mt-0.5" />

              <Label htmlFor="delete-all" className="cursor-pointer leading-5">
                <span className="block font-medium">Все события серии</span>

                <span className="block text-sm font-normal text-muted-foreground">
                  Удалить всю повторяющуюся серию
                </span>
              </Label>
            </div>
          </RadioGroup>
        ) : (
          <div className="rounded-xl bg-muted/50 p-3 text-sm text-muted-foreground">
            Это действие нельзя отменить.
          </div>
        )}

        <DialogFooter>
          <Button
            variant="secondary"
            type="button"
            disabled={loading}
            onClick={() => handleOpenChange(false)}
          >
            Отмена
          </Button>

          <Button
            variant="destructive"
            type="button"
            disabled={loading}
            onClick={() => void handleDelete()}
          >
            {loading ? "Удаляем…" : "Удалить"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
