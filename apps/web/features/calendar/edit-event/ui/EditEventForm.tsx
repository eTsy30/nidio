"use client";

import { useState } from "react";
import { format } from "date-fns";

import { repeatOptions, typeMeta } from "@/features/calendar/model/constants";
import { type CalendarEvent, EventRepeat, EventType } from "@/features/calendar/types";
import { Button } from "@/shared/ui";

interface EditEventFormProps {
  event: CalendarEvent;
  onCancel: () => void;
  onSubmit?: (values: {
    title: string;
    description: string;
    type: EventType;
    startAt: Date;
    endAt: Date | null;
    allDay: boolean;
    repeat: EventRepeat;
    reminderAt: Date | null;
  }) => void | Promise<void>;
}

function parseTime(value: string): [number, number] {
  const [hours = 0, minutes = 0] = value.split(":").map(Number);
  return [hours, minutes];
}

function formatTime(date: Date): string {
  return format(date, "HH:mm");
}

export function EditEventForm({ event, onCancel, onSubmit }: EditEventFormProps) {
  const initialStart = new Date(event.startAt);
  const initialEnd = event.endAt ? new Date(event.endAt) : null;
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [eventDate, setEventDate] = useState(format(initialStart, "yyyy-MM-dd"));
  const [title, setTitle] = useState(event.title);
  const [description, setDescription] = useState(event.description ?? "");
  const [type, setType] = useState<EventType>(event.type);
  const [allDay, setAllDay] = useState(event.allDay);
  const [startTime, setStartTime] = useState(formatTime(initialStart));
  const [endTime, setEndTime] = useState(initialEnd ? formatTime(initialEnd) : "21:00");
  const [repeat, setRepeat] = useState<EventRepeat>(event.repeat);
  const [reminder, setReminder] = useState(
    event.reminderAt ? format(new Date(event.reminderAt), "yyyy-MM-dd'T'HH:mm") : "",
  );

  const inputClass =
    "h-11 min-w-0 w-full rounded-xl border bg-background px-3 text-base outline-none focus:border-primary";

  const handleSubmit = async (formEvent: React.FormEvent<HTMLFormElement>) => {
    formEvent.preventDefault();
    if (step === 0) {
      setStep(1);
      return;
    }
    if (saving || !title.trim()) return;

    const startAt = new Date(`${eventDate}T00:00:00`);
    if (allDay) startAt.setHours(0, 0, 0, 0);
    else {
      const [hours, minutes] = parseTime(startTime);
      startAt.setHours(hours, minutes, 0, 0);
    }

    let endAt: Date | null = null;
    if (!allDay) {
      endAt = new Date(`${eventDate}T00:00:00`);
      const [hours, minutes] = parseTime(endTime);
      endAt.setHours(hours, minutes, 0, 0);
    }
    if (endAt && endAt <= startAt) {
      setError("Конец должен быть позже начала");
      setStep(0);
      return;
    }

    setSaving(true);
    setError("");
    try {
      await onSubmit?.({
        title: title.trim(),
        description: description.trim(),
        type,
        startAt,
        endAt,
        allDay,
        repeat,
        reminderAt: reminder ? new Date(reminder) : null,
      });
    } catch {
      setError("Не удалось сохранить событие. Попробуйте ещё раз.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex min-h-0 flex-col gap-3 px-1 pb-1">
      <p className="text-sm text-muted-foreground">Шаг {step + 1} из 2</p>

      <div className="min-h-0 space-y-3 overflow-y-auto overscroll-contain px-1">
        {step === 0 ? (
          <>
            <label className="block space-y-1 text-sm font-medium">
              <span>Название</span>
              <input
                required
                maxLength={200}
                autoFocus
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className={inputClass}
              />
            </label>
            <label className="block space-y-1 text-sm font-medium">
              <span>Тип события</span>
              <select
                value={type}
                onChange={(event) => setType(event.target.value as EventType)}
                className={inputClass}
              >
                {Object.values(EventType).map((value) => (
                  <option key={value} value={value}>
                    {typeMeta[value].label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1 text-sm font-medium">
              <span>Дата</span>
              <input
                required
                type="date"
                value={eventDate}
                onChange={(event) => setEventDate(event.target.value)}
                className={inputClass}
              />
            </label>
            <label className="flex min-h-11 items-center justify-between gap-3 rounded-xl border px-3 text-sm">
              Весь день
              <input
                type="checkbox"
                checked={allDay}
                onChange={(event) => setAllDay(event.target.checked)}
                className="size-5"
              />
            </label>
            {!allDay && (
              <div className="grid grid-cols-2 gap-3">
                <label className="min-w-0 space-y-1 text-sm">
                  <span>Начало</span>
                  <input
                    required
                    type="time"
                    value={startTime}
                    onChange={(event) => setStartTime(event.target.value)}
                    className={inputClass}
                  />
                </label>
                <label className="min-w-0 space-y-1 text-sm">
                  <span>Конец</span>
                  <input
                    required
                    type="time"
                    value={endTime}
                    onChange={(event) => setEndTime(event.target.value)}
                    className={inputClass}
                  />
                </label>
              </div>
            )}
          </>
        ) : (
          <>
            <label className="block space-y-1 text-sm font-medium">
              <span>Повторение</span>
              <select
                value={repeat}
                onChange={(event) => setRepeat(event.target.value as EventRepeat)}
                className={inputClass}
              >
                {repeatOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            {event.repeat !== EventRepeat.NONE && (
              <p className="rounded-xl bg-muted px-3 py-2 text-xs text-muted-foreground">
                Изменения применяются ко всей серии повторений.
              </p>
            )}
            <label className="block space-y-1 text-sm font-medium">
              <span>Напоминание · необязательно</span>
              <input
                type="datetime-local"
                value={reminder}
                onChange={(event) => setReminder(event.target.value)}
                className={inputClass}
              />
              <span className="block text-xs font-normal text-muted-foreground">
                Время в вашем часовом поясе.
              </span>
            </label>
            <label className="block space-y-1 text-sm font-medium">
              <span>Описание · необязательно</span>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={3}
                className="w-full resize-none rounded-xl border bg-background p-3 text-base"
              />
            </label>
            {(type === EventType.BIRTHDAY || type === EventType.ANNIVERSARY) && (
              <p className="text-xs text-muted-foreground">
                В день события также придёт push в 12:00 по часовому поясу получателя.
              </p>
            )}
          </>
        )}
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
