"use client";

import { format } from "date-fns";
import { ru } from "date-fns/locale";

import { getDateKey } from "@/features/calendar/model/utils";
import { Calendar } from "@/shared/ui/calendar";

import { CalendarEvent } from "../model/types";

import { CalendarDay } from "./CalendarDay";

interface MonthViewProps {
  month: Date;
  eventsByDate: Map<string, CalendarEvent[]>;
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  onMonthChange: (date: Date) => void;
}

export function MonthView({
  month,
  eventsByDate,
  selectedDate,
  onSelectDate,
  onMonthChange,
}: MonthViewProps) {
  return (
    <div className="h-full min-h-0">
      <Calendar
        mode="single"
        month={month}
        onMonthChange={onMonthChange}
        selected={selectedDate ?? undefined}
        onSelect={(date) => {
          if (date) {
            onSelectDate(date);
          }
        }}
        required={false}
        showOutsideDays
        locale={ru}
        className="h-full w-full p-0"
        classNames={{
          months: "flex h-full w-full flex-col",
          month: "flex h-full w-full flex-col",

          month_caption: "hidden",
          nav: "hidden",

          month_grid: "w-full flex-1",

          weekdays: "grid h-8 grid-cols-7",

          weekday: "flex items-center justify-center text-xs font-medium text-muted-foreground",

          week: "grid min-h-0 flex-1 grid-cols-7",

          day: "h-full w-full p-0",
        }}
        components={{
          Day: ({ day }) => {
            const date = day.date;
            const key = getDateKey(date);

            return (
              <CalendarDay
                date={date}
                month={month}
                events={eventsByDate.get(key) ?? []}
                selectedDate={selectedDate}
                onSelect={onSelectDate}
              />
            );
          },
        }}
      />

      <div className="sr-only">
        {format(month, "LLLL yyyy", {
          locale: ru,
        })}
      </div>
    </div>
  );
}
