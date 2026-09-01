"use client";

import { format, isSameDay, isSameMonth, isToday } from "date-fns";

import { cn } from "@/shared/lib/cn";

import { typeMeta } from "../model/constants";
import { CalendarEvent } from "../model/types";

interface CalendarDayProps {
  date: Date;
  month: Date;
  events: CalendarEvent[];
  selectedDate: Date | null;
  onSelect: (date: Date) => void;
}

export function CalendarDay({ date, month, events, selectedDate, onSelect }: CalendarDayProps) {
  const selected = selectedDate ? isSameDay(date, selectedDate) : false;

  const today = isToday(date);
  const currentMonth = isSameMonth(date, month);

  const firstEvent = events[0];
  const visibleEvents = events.slice(0, 1);
  const hiddenCount = Math.max(events.length - 1, 0);

  return (
    <td>
      <button
        type="button"
        onClick={() => onSelect(date)}
        className={cn(
          "group relative flex  min-h-[78px] w-full flex-col",
          "rounded-2xl border p-1.5 transition-all",
          "sm:min-h-[110px] sm:p-2.5",
          selected
            ? "border-primary/20 bg-primary/[0.06] shadow-sm"
            : "border-transparent hover:bg-muted/50",
          !currentMonth && "opacity-35",
        )}
      >
        <span
          className={cn(
            "mx-auto flex h-7 w-7 items-center justify-center rounded-full",
            "text-sm font-medium transition-all",
            today && !selected && "bg-primary/10 text-primary",
            selected && "bg-primary text-primary-foreground font-bold",
          )}
        >
          {format(date, "d")}
        </span>

        <div className="mt-2 min-w-0 flex-1">
          {visibleEvents.map((event) => (
            <div key={event.id}>
              <div className="hidden sm:block">
                <span
                  className={cn(
                    "flex items-center gap-1 rounded-full px-2 py-1",
                    "truncate text-[10px] font-medium",
                    typeMeta[event.type].bg,
                    typeMeta[event.type].color,
                  )}
                >
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" />

                  <span className="truncate">{event.title}</span>
                </span>
              </div>

              <div className="flex justify-center sm:hidden">
                <span
                  className="mt-1 h-1.5 w-1.5 rounded-full"
                  style={{
                    backgroundColor: typeMeta[event.type].border,
                  }}
                />
              </div>
            </div>
          ))}

          {hiddenCount > 0 && (
            <span className="mt-1 block text-center text-[9px] text-muted-foreground">
              +{hiddenCount}
            </span>
          )}
        </div>

        {firstEvent && (
          <div className="absolute bottom-2 left-1/2 hidden -translate-x-1/2 sm:block">
            <span
              className="block h-1.5 w-1.5 rounded-full"
              style={{
                backgroundColor: typeMeta[firstEvent.type].border,
              }}
            />
          </div>
        )}
      </button>
    </td>
  );
}
