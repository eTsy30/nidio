"use client";

import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ru } from "date-fns/locale";

import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button/Button";
import { Card } from "@/shared/ui/card/Card";

import { CalendarEvent } from "../model/types";

interface CalendarYearProps {
  year: Date;
  events: CalendarEvent[];
  onMonthClick?: (month: Date) => void;
  onDayClick?: (day: Date) => void;
}

export function CalendarYear({ year, events, onMonthClick, onDayClick }: CalendarYearProps) {
  const currentYear = year.getFullYear();

  const months = Array.from({ length: 12 }, (_, index) => new Date(currentYear, index, 1));

  const getMonthDays = (month: Date) => {
    return eachDayOfInterval({
      start: startOfWeek(startOfMonth(month), {
        weekStartsOn: 1,
      }),
      end: endOfWeek(endOfMonth(month), {
        weekStartsOn: 1,
      }),
    });
  };

  const getDayEvents = (day: Date) => {
    return events.filter((event) => isSameDay(new Date(event.startAt), day));
  };

  return (
    <div className="p-1 sm:p-3 lg:p-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {months.map((month) => {
          const days = getMonthDays(month);

          return (
            <Card
              padding="sm"
              key={month.getMonth()}
              className={cn(
                "group rounded-2xl border bg-background p-3 text-left",
                "transition-all hover:border-primary/30 hover:shadow-sm",
              )}
            >
              <Button
                variant="ghost"
                className="mb-3 w-full justify-between capitalize"
                onClick={() => onMonthClick?.(month)}
              >
                <span className="text-sm font-semibold capitalize">
                  {format(month, "LLLL", {
                    locale: ru,
                  })}
                </span>

                <span className="text-xs text-muted-foreground">{format(month, "yyyy")}</span>
              </Button>

              <div className="mb-1 grid grid-cols-7">
                {["пн", "вт", "ср", "чт", "пт", "сб", "вс"].map((day) => (
                  <span
                    key={day}
                    className="text-center text-[10px] font-medium uppercase text-muted-foreground"
                  >
                    {day}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-y-1">
                {days.map((day) => {
                  const dayEvents = getDayEvents(day);
                  const currentMonth = isSameMonth(day, month);

                  return (
                    <Button
                      variant="plain"
                      size="none"
                      key={day.toISOString()}
                      aria-label={format(day, "d MMMM yyyy", { locale: ru })}
                      disabled={!currentMonth}
                      tabIndex={currentMonth ? 0 : -1}
                      onClick={(event) => {
                        event.stopPropagation();

                        if (currentMonth) {
                          onDayClick?.(day);
                        }
                      }}
                      className={cn(
                        "relative flex min-h-11 items-center justify-center rounded-lg",
                        "text-[11px] transition-colors",
                        currentMonth
                          ? "text-foreground hover:bg-muted"
                          : "text-muted-foreground/30",
                        isToday(day) &&
                          currentMonth &&
                          "bg-primary text-primary-foreground font-semibold",
                      )}
                    >
                      {format(day, "d")}

                      {dayEvents.length > 0 && !isToday(day) && (
                        <span
                          className="absolute bottom-0.5 h-1 w-1 rounded-full bg-primary"
                          aria-hidden="true"
                        />
                      )}

                      {dayEvents.length > 0 && isToday(day) && (
                        <span
                          className="absolute bottom-0.5 h-1 w-1 rounded-full bg-primary-foreground"
                          aria-hidden="true"
                        />
                      )}
                    </Button>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
