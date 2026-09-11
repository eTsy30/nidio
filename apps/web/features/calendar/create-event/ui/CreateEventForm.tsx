"use client";

import { format } from "date-fns";
import { ru } from "date-fns/locale";

import { useEventForm } from "@/features/calendar/model/use-event-form";
import {
  type CalendarEventFormValues,
  EventRepeat,
  EventScope,
  EventType,
} from "@/features/calendar/types";
import { EventFormFields } from "@/features/calendar/ui/EventFormFields";
import { Button } from "@/shared/ui";

interface CreateEventFormProps {
  scope: EventScope;
  date: Date;
  onCancel: () => void;
  onSubmit?: (values: CalendarEventFormValues) => void | Promise<void>;
}

export function CreateEventForm({ scope, date, onCancel, onSubmit }: CreateEventFormProps) {
  const form = useEventForm(
    date,
    {
      title: "",
      description: "",
      type: EventType.DATE,
      allDay: true,
      startTime: "19:00",
      endTime: "21:00",
      repeat: EventRepeat.NONE,
      reminder: "",
    },
    onSubmit,
  );
  const { step, setStep, saving, error, title, handleSubmit } = form;
  return (
    <form onSubmit={handleSubmit} className="flex min-h-0 flex-col gap-3 px-1 pb-1">
      <p className="text-sm text-muted-foreground">
        {format(date, "d MMMM yyyy", { locale: ru })} ·{" "}
        {scope === EventScope.PERSONAL ? "Мой" : "Наш"} · Шаг {step + 1} из 2
      </p>
      <div className="min-h-0 space-y-3 overflow-y-auto overscroll-contain px-1">
        <EventFormFields form={form} mode="create" />
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
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
          {saving ? "Сохраняем…" : step === 0 ? "Далее" : "Создать"}
        </Button>
      </div>
    </form>
  );
}
