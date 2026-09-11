"use client";

import { useState } from "react";
import { format } from "date-fns";

import { useEventForm } from "@/features/calendar/model/use-event-form";
import {
  type CalendarEvent,
  type CalendarEventFormValues,
  EventRepeat,
} from "@/features/calendar/types";
import { EventFormFields } from "@/features/calendar/ui/EventFormFields";
import { Button } from "@/shared/ui";

interface EditEventFormProps {
  event: CalendarEvent;
  onCancel: () => void;
  onSubmit?: (values: CalendarEventFormValues) => void | Promise<void>;
}

export function EditEventForm({ event, onCancel, onSubmit }: EditEventFormProps) {
  const initialStart = new Date(event.startAt);
  const initialEnd = event.endAt ? new Date(event.endAt) : null;
  const [eventDate, setEventDate] = useState(format(initialStart, "yyyy-MM-dd"));
  const form = useEventForm(
    new Date(`${eventDate}T00:00:00`),
    {
      title: event.title,
      description: event.description ?? "",
      type: event.type,
      allDay: event.allDay,
      startTime: format(initialStart, "HH:mm"),
      endTime: initialEnd ? format(initialEnd, "HH:mm") : "21:00",
      repeat: event.repeat,
      reminder: event.reminderAt ? format(new Date(event.reminderAt), "yyyy-MM-dd'T'HH:mm") : "",
    },
    onSubmit,
  );
  const { step, setStep, saving, error, title, handleSubmit } = form;
  return (
    <form onSubmit={handleSubmit} className="flex min-h-0 flex-col gap-3 px-1 pb-1">
      <p className="text-sm text-muted-foreground">Шаг {step + 1} из 2</p>

      <div className="min-h-0 space-y-3 overflow-y-auto overscroll-contain px-1">
        <EventFormFields
          form={form}
          mode="edit"
          date={{ value: eventDate, onChange: setEventDate }}
          recurring={event.repeat !== EventRepeat.NONE}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      <div className="flex shrink-0 gap-2 border-t pt-3">
        <Button
          type="button"
          variant="ghost"
          disabled={saving}
          className="flex-1"
          onClick={() => (step === 0 ? onCancel() : setStep(0))}
        >
          {step === 0 ? "Отмена" : "Назад"}
        </Button>
        <Button type="submit" disabled={!title.trim() || saving} className="flex-1">
          {saving ? "Сохраняем…" : step === 0 ? "Далее" : "Сохранить"}
        </Button>
      </div>
    </form>
  );
}
