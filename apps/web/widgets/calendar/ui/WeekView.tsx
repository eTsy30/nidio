"use client";

import { format, isSameDay, isToday } from "date-fns";
import { ru } from "date-fns/locale";

import { getDateKey, getDaysForWeek } from "@/features/calendar/model/utils";
import { type CalendarEvent } from "@/features/calendar/types";
import { cn } from "@/shared/lib/cn";

import { EventCard } from "./EventCard";

interface WeekViewProps {
  weekStart: Date;
  eventsByDate: Map<string, CalendarEvent[]>;
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
}

export function WeekView({
  weekStart,
  eventsByDate,
  selectedDate,
  onSelectDate,
  onEventClick,
}: WeekViewProps) {
  const days = getDaysForWeek(weekStart);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-2 grid grid-cols-7 gap-1">
        {days.map((date) => {
          const today = isToday(date);

          return (
            <button
              key={date.toISOString()}
              type="button"
              onClick={() => onSelectDate(date)}
              className={cn(
                "rounded-xl py-2 text-center",
                "text-xs font-medium uppercase",
                today
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              <span>
                {format(date, "EEE", {
                  locale: ru,
                })}
              </span>

              <span className="ml-1">{format(date, "d")}</span>
            </button>
          );
        })}
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-7 gap-1">
        {days.map((date) => {
          const key = getDateKey(date);
          const events = eventsByDate.get(key) ?? [];

          const selected = selectedDate ? isSameDay(date, selectedDate) : false;

          return (
            <div
              key={date.toISOString()}
              className={cn(
                "flex min-h-[180px] flex-col rounded-2xl border p-2 transition-all",
                selected
                  ? "border-primary/20 bg-primary/[0.05]"
                  : "border-transparent hover:bg-muted/50",
              )}
            >
              <button
                type="button"
                onClick={() => onSelectDate(date)}
                className="flex w-full justify-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                aria-label={`Выбрать ${format(date, "d MMMM", {
                  locale: ru,
                })}`}
              >
                <span
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full text-sm",
                    isToday(date) && "bg-primary/10 font-bold text-primary",
                  )}
                >
                  {format(date, "d")}
                </span>
              </button>

              <div className="mt-2 flex min-h-0 flex-col gap-1 overflow-y-auto">
                {events.map((event) => (
                  <EventCard
                    key={`${event.id}-${event.startAt}`}
                    event={event}
                    compact
                    onClick={onEventClick}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
