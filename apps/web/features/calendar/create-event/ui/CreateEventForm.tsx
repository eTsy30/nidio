"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

import { cn } from "@/shared/lib/cn";
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
  }) => void | Promise<void>;
}

function parseTime(value: string): [number, number] {
  const [hours = 0, minutes = 0] = value.split(":").map(Number);

  return [hours, minutes];
}

export function CreateEventForm({ scope, date, onCancel, onSubmit }: CreateEventFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [type, setType] = useState<EventType>(EventType.DATE);

  const [allDay, setAllDay] = useState(true);

  const [startTime, setStartTime] = useState("19:00");
  const [endTime, setEndTime] = useState("21:00");

  const [repeat, setRepeat] = useState<EventRepeat>(EventRepeat.NONE);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

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
          onChange={(event) => setTitle(event.target.value)}
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
          {format(date, "d MMMM yyyy", {
            locale: ru,
          })}
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
          onChange={(event) => setAllDay(event.target.checked)}
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
              onChange={(event) => setStartTime(event.target.value)}
              className="h-11 w-full rounded-xl border px-3"
            />
          </label>

          <label>
            <span className="mb-1.5 block text-xs text-muted-foreground">Конец</span>

            <input
              type="time"
              value={endTime}
              onChange={(event) => setEndTime(event.target.value)}
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
          onChange={(event) => setRepeat(event.target.value as EventRepeat)}
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
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Что-нибудь важное..."
          rows={3}
          className="w-full resize-none rounded-xl border bg-background p-3 text-sm outline-none focus:border-primary"
        />
      </div>

      {/* Scope */}
      <div className="rounded-xl bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
        Календарь:{" "}
        <span className="font-medium">{scope === EventScope.PERSONAL ? "Мой" : "Наш"}</span>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button type="button" variant="ghost" className="flex-1" onClick={onCancel}>
          Отмена
        </Button>

        <Button type="submit" className="flex-1" disabled={!title.trim()}>
          Создать
        </Button>
      </div>
    </form>
  );
}
