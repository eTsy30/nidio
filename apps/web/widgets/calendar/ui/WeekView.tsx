"use client";

import { format, isSameDay, isToday } from "date-fns";
import { ru } from "date-fns/locale";

import { cn } from "@/shared/lib/cn";

import { CalendarEvent } from "../model/types";
import { getDateKey, getDaysForWeek } from "../model/utils";

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
            <button
              key={date.toISOString()}
              type="button"
              onClick={() => onSelectDate(date)}
              className={cn(
                "flex min-h-[180px] flex-col rounded-2xl border p-2 text-left transition-all",
                selected
                  ? "border-primary/20 bg-primary/[0.05]"
                  : "border-transparent hover:bg-muted/50",
              )}
            >
              <div className="flex justify-center">
                <span
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full text-sm",
                    isToday(date) && "bg-primary/10 font-bold text-primary",
                  )}
                >
                  {format(date, "d")}
                </span>
              </div>

              <div className="mt-2 flex flex-col gap-1">
                {events.map((event, index) => (
                  <EventCard
                    key={`${event.id}-${getDateKey(new Date(event.startAt))}-${index}`}
                    event={event}
                    compact
                    onClick={onEventClick}
                  />
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
