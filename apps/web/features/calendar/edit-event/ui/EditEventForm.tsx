"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

import { CalendarEvent } from "@/features/calendar/types";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui";
import { repeatOptions, typeMeta } from "@/widgets/calendar/model/constants";
import { EventRepeat, EventType } from "@/widgets/calendar/model/types";

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
  }) => void | Promise<void>;
}

function parseTime(value: string): [number, number] {
  const [hours = 0, minutes = 0] = value.split(":").map(Number);
  return [hours, minutes];
}

function formatTime(date: Date): string {
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

export function EditEventForm({ event, onCancel, onSubmit }: EditEventFormProps) {
  const [title, setTitle] = useState(event.title);
  const [description, setDescription] = useState(event.description ?? "");
  const [type, setType] = useState<EventType>(event.type);

  const initialStart = new Date(event.startAt);
  const initialEnd = event.endAt ? new Date(event.endAt) : null;

  const [allDay, setAllDay] = useState(event.allDay);
  const [startTime, setStartTime] = useState(formatTime(initialStart));
  const [endTime, setEndTime] = useState(initialEnd ? formatTime(initialEnd) : "21:00");
  const [repeat, setRepeat] = useState<EventRepeat>(event.repeat);

  const handleSubmit = (formEvent: React.FormEvent<HTMLFormElement>) => {
    formEvent.preventDefault();

    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    const startAt = new Date(initialStart);

    if (allDay) {
      startAt.setHours(0, 0, 0, 0);
    } else {
      const [hours, minutes] = parseTime(startTime);
      startAt.setHours(hours, minutes, 0, 0);
    }

    let endAt: Date | null = null;
    if (!allDay) {
      endAt = new Date(initialStart);
      const [hours, minutes] = parseTime(endTime);
      endAt.setHours(hours, minutes, 0, 0);
    }

    void onSubmit?.({
      title: trimmedTitle,
      description: description.trim(),
      type,
      startAt,
      endAt,
      allDay,
      repeat,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Название */}
      <div>
        <label className="mb-1.5 block text-sm font-medium">Название</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Например, вечер в кино"
          className="h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary"
          autoFocus
        />
      </div>

      {/* Тип */}
      <div>
        <label className="mb-2 block text-sm font-medium">Тип</label>
        <div className="grid grid-cols-2 gap-2">
          {Object.values(EventType).map((eventType) => {
            const meta = typeMeta[eventType];
            return (
              <button
                key={eventType}
                type="button"
                onClick={() => setType(eventType)}
                className={cn(
                  "rounded-xl border p-3 text-left text-sm transition-all",
                  type === eventType ? "border-primary bg-primary/5" : "hover:bg-muted",
                )}
              >
                <span className={cn("block text-xs font-medium", meta.color)}>{meta.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Дата */}
      <div>
        <label className="mb-1.5 block text-sm font-medium">Дата</label>
        <div className="rounded-xl bg-muted px-3 py-3 text-sm">
          {format(initialStart, "d MMMM yyyy", { locale: ru })}
        </div>
      </div>

      {/* Весь день */}
      <label className="flex items-center justify-between rounded-xl border p-3">
        <span>
          <span className="block text-sm font-medium">Весь день</span>
          <span className="text-xs text-muted-foreground">Без конкретного времени</span>
        </span>
        <input
          type="checkbox"
          checked={allDay}
          onChange={(e) => setAllDay(e.target.checked)}
          className="h-4 w-4"
        />
      </label>

      {/* Время */}
      {!allDay && (
        <div className="grid grid-cols-2 gap-3">
          <label>
            <span className="mb-1.5 block text-xs text-muted-foreground">Начало</span>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="h-11 w-full rounded-xl border px-3"
            />
          </label>
          <label>
            <span className="mb-1.5 block text-xs text-muted-foreground">Конец</span>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="h-11 w-full rounded-xl border px-3"
            />
          </label>
        </div>
      )}

      {/* Повторение */}
      <div>
        <label className="mb-1.5 block text-sm font-medium">Повторение</label>
        <select
          value={repeat}
          onChange={(e) => setRepeat(e.target.value as EventRepeat)}
          className="h-11 w-full rounded-xl border bg-background px-3 text-sm"
        >
          {repeatOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Описание */}
      <div>
        <label className="mb-1.5 block text-sm font-medium">Описание</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Что-нибудь важное..."
          rows={3}
          className="w-full resize-none rounded-xl border bg-background p-3 text-sm outline-none focus:border-primary"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button type="button" variant="ghost" className="flex-1" onClick={onCancel}>
          Отмена
        </Button>
        <Button type="submit" className="flex-1" disabled={!title.trim()}>
          Сохранить
        </Button>
      </div>
    </form>
  );
}
