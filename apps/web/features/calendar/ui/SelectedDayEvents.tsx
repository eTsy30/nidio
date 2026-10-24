"use client";

import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Pencil, Plus, Trash2 } from "lucide-react";

import { Button, Card } from "@/shared/ui";

import { typeMeta } from "../model/constants";
import { type CalendarEvent, EventRepeat } from "../types";

const repeatLabels: Record<EventRepeat, string> = {
  NONE: "",
  DAILY: "Каждый день",
  WEEKLY: "Каждую неделю",
  MONTHLY: "Каждый месяц",
  YEARLY: "Каждый год",
};

export function SelectedDayEvents({
  date,
  events,
  currentUserId,
  onAddEvent,
  onEditEvent,
  onDeleteEvent,
}: {
  date: Date;
  events: CalendarEvent[];
  currentUserId: string | undefined;
  onAddEvent: () => void;
  onEditEvent: (event: CalendarEvent) => void;
  onDeleteEvent: (event: CalendarEvent) => void;
}) {
  const sorted = [...events].sort(
    (a, b) => Number(b.allDay) - Number(a.allDay) || Date.parse(a.startAt) - Date.parse(b.startAt),
  );
  return (
    <section className="space-y-3" aria-label="События выбранного дня">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0" aria-live="polite">
          <h2 className="text-lg font-semibold">{format(date, "d MMMM", { locale: ru })}</h2>
          <p className="text-xs capitalize text-muted-foreground">
            {format(date, "EEEE", { locale: ru })}
          </p>
        </div>
        <Button variant="ghost" leftIcon={<Plus />} onClick={onAddEvent}>
          Добавить
        </Button>
      </div>
      {sorted.length === 0 ? (
        <p className="py-4 text-sm text-muted-foreground">На этот день событий нет.</p>
      ) : (
        <ul className="space-y-3">
          {sorted.map((event) => (
            <li key={`${event.id}:${event.startAt}`}>
              <Card
                variant="outline"
                className="flex items-start gap-3 rounded-[var(--radius-md)] border-border p-4"
              >
                <div className="w-12 shrink-0 text-center">
                  <p className="text-lg font-semibold tabular-nums">{format(date, "d")}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(date, "MMM", { locale: ru })}
                  </p>
                </div>
                <div
                  className={`min-w-0 flex-1 border-l-4 border-current pl-3 ${typeMeta[event.type].color}`}
                >
                  <h3 className="break-words text-base font-semibold text-foreground">
                    {event.title}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {event.allDay
                      ? "Весь день"
                      : `${format(new Date(event.startAt), "HH:mm")}${event.endAt ? `–${format(new Date(event.endAt), "HH:mm")}` : ""}`}
                  </p>
                  {event.description && (
                    <p className="mt-2 whitespace-pre-wrap break-words text-sm text-muted-foreground">
                      {event.description}
                    </p>
                  )}
                  {repeatLabels[event.repeat] && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {repeatLabels[event.repeat]}
                    </p>
                  )}
                </div>
                {event.createdById === currentUserId && (
                  <div className="flex shrink-0 flex-col gap-1 min-[375px]:flex-row">
                    <Button
                      variant="ghost"
                      iconOnly
                      aria-label={`Изменить: ${event.title}`}
                      onClick={() => onEditEvent(event)}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      variant="ghost"
                      iconOnly
                      aria-label={`Удалить: ${event.title}`}
                      onClick={() => onDeleteEvent(event)}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                )}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
