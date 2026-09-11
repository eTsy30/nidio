import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from "date-fns";

import { ViewMode } from "@/features/calendar/types";

export function getCalendarRange(date: Date, viewMode: ViewMode) {
  if (viewMode === "week") {
    return {
      start: startOfWeek(date, {
        weekStartsOn: 1,
      }),
      end: endOfWeek(date, {
        weekStartsOn: 1,
      }),
    };
  }

  if (viewMode === "year") {
    return {
      start: startOfYear(date),
      end: endOfYear(date),
    };
  }

  // Include outside days displayed in the month grid.
  return {
    start: startOfWeek(startOfMonth(date), {
      weekStartsOn: 1,
    }),
    end: endOfWeek(endOfMonth(date), {
      weekStartsOn: 1,
    }),
  };
}

export function getDateKey(date: Date) {
  return format(date, "yyyy-MM-dd");
}

export function getDaysForWeek(date: Date) {
  const start = startOfWeek(date, {
    weekStartsOn: 1,
  });

  const end = endOfWeek(date, {
    weekStartsOn: 1,
  });

  return eachDayOfInterval({
    start,
    end,
  });
}

export function formatEventTime(startAt: string, endAt?: string | null) {
  const start = new Date(startAt);

  if (!endAt) {
    return "Весь день";
  }

  const end = new Date(endAt);

  return `${format(start, "HH:mm")} — ${format(end, "HH:mm")}`;
}
