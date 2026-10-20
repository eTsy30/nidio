"use client";

import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ru } from "date-fns/locale";

import { getDateKey } from "@/features/calendar/model/utils";

import { CalendarEvent } from "../model/types";

import { CalendarDay } from "./CalendarDay";

interface MonthViewProps {
  month: Date;
  eventsByDate: Map<string, CalendarEvent[]>;
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  onMonthChange: (date: Date) => void;
}

export function MonthView({ month, eventsByDate, selectedDate, onSelectDate }: MonthViewProps) {
  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(month), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }),
  });
  return (
    <table
      className="w-full table-fixed border-collapse"
      aria-label={format(month, "LLLL yyyy", { locale: ru })}
    >
      <thead>
        <tr>
          {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((day) => (
            <th
              key={day}
              scope="col"
              className="h-10 text-center text-xs font-medium text-muted-foreground"
            >
              {day}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: days.length / 7 }, (_, week) => (
          <tr key={week}>
            {days.slice(week * 7, week * 7 + 7).map((date) => (
              <CalendarDay
                key={getDateKey(date)}
                date={date}
                month={month}
                events={eventsByDate.get(getDateKey(date)) ?? []}
                selectedDate={selectedDate}
                onSelect={onSelectDate}
              />
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
