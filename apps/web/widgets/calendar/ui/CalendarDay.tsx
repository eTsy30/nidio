"use client";

import { format, isSameDay, isSameMonth, isToday } from "date-fns";

import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button/Button";

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

  const visibleEvents = events.slice(0, 2);
  const hiddenCount = Math.max(events.length - 2, 0);

  return (
    <td className="border border-border align-top">
      <Button
        variant="plain"
        size="none"
        type="button"
        aria-pressed={selected}
        aria-current={today ? "date" : undefined}
        aria-label={`${date.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}, событий: ${events.length}`}
        onClick={() => onSelect(date)}
        className={cn(
          "group relative flex min-h-[64px] w-full min-w-0 flex-col items-stretch",
          "rounded-none border-0 p-1 transition-colors",
          "sm:min-h-[112px] sm:p-2",
          selected ? "bg-primary/10 ring-2 ring-inset ring-primary" : "hover:bg-muted/50",
          !currentMonth && "text-muted-foreground bg-muted/30",
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

        <div className="mt-1 min-w-0 space-y-1">
          {visibleEvents.map((event) => (
            <div key={event.id}>
              <div className="hidden sm:block">
                <span
                  className={cn(
                    "flex items-center gap-1 rounded-sm px-1 py-1",
                    "truncate text-xs font-medium",
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
      </Button>
    </td>
  );
}
