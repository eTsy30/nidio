"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

import { Button } from "@/shared/ui";
import { repeatOptions, typeMeta } from "@/widgets/calendar/model/constants";
import { EventRepeat, EventScope, EventType } from "@/widgets/calendar/model/types";

interface CreateEventFormProps {
  scope: EventScope;
  date: Date;
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

export function CreateEventForm({ scope, date, onCancel, onSubmit }: CreateEventFormProps) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [reminder, setReminder] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [type, setType] = useState<EventType>(EventType.DATE);

  const [allDay, setAllDay] = useState(true);

  const [startTime, setStartTime] = useState("19:00");
  const [endTime, setEndTime] = useState("21:00");

  const [repeat, setRepeat] = useState<EventRepeat>(EventRepeat.NONE);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (step === 0) {
      setStep(1);
      return;
    }
    if (saving) return;
    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      return;
    }

    const startAt = new Date(date);

    if (allDay) {
      startAt.setHours(0, 0, 0, 0);
    } else {
      const [hours, minutes] = parseTime(startTime);

      startAt.setHours(hours, minutes, 0, 0);
    }

    let endAt: Date | null = null;

    if (!allDay) {
      endAt = new Date(date);

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
        title: trimmedTitle,
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

  const inputClass =
    "h-11 min-w-0 w-full rounded-xl border bg-background px-3 text-base outline-none focus:border-primary";
  return (
    <form onSubmit={handleSubmit} className="flex min-h-0 flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        {format(date, "d MMMM yyyy", { locale: ru })} ·{" "}
        {scope === EventScope.PERSONAL ? "Мой" : "Наш"} · Шаг {step + 1} из 2
      </p>
      <div className="min-h-0 overflow-y-auto overscroll-contain space-y-3">
        {step === 0 ? (
          <>
            <label className="block space-y-1 text-sm font-medium">
              <span>Название</span>
              <input
                required
                maxLength={200}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Например, вечер в кино"
                className={inputClass}
              />
            </label>
            <label className="block space-y-1 text-sm font-medium">
              <span>Тип события</span>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as EventType)}
                className={inputClass}
              >
                {Object.values(EventType).map((value) => (
                  <option key={value} value={value}>
                    {typeMeta[value].label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex min-h-11 items-center justify-between gap-3 rounded-xl border px-3 text-sm">
              Весь день
              <input
                type="checkbox"
                checked={allDay}
                onChange={(e) => setAllDay(e.target.checked)}
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
                    onChange={(e) => setStartTime(e.target.value)}
                    className={inputClass}
                  />
                </label>
                <label className="min-w-0 space-y-1 text-sm">
                  <span>Конец</span>
                  <input
                    required
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
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
                onChange={(e) => setRepeat(e.target.value as EventRepeat)}
                className={inputClass}
              >
                {repeatOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block min-w-0 space-y-1 text-sm font-medium">
              <span>Напоминание · необязательно</span>
              <input
                type="datetime-local"
                value={reminder}
                onChange={(e) => setReminder(e.target.value)}
                className={inputClass}
              />
              <span className="block text-xs font-normal text-muted-foreground">
                В вашем часовом поясе
              </span>
            </label>
            <label className="block space-y-1 text-sm font-medium">
              <span>Описание · необязательно</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
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
