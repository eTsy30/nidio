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

import { ViewMode } from "./types";

export function getCalendarRange(date: Date, viewMode: ViewMode) {
  /**
   * WEEK
   *
   * Берём понедельник и воскресенье
   * отображаемой недели.
   */
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

  /**
   * YEAR
   *
   * Для годового представления загружаем
   * все события с 1 января по 31 декабря.
   */
  if (viewMode === "year") {
    return {
      start: startOfYear(date),
      end: endOfYear(date),
    };
  }

  /**
   * MONTH
   *
   * Берём не просто первый и последний день месяца,
   * а реальную отображаемую сетку календаря
   * вместе с outside days.
   */
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

export function getDaysForMonth(date: Date) {
  const start = startOfWeek(startOfMonth(date), {
    weekStartsOn: 1,
  });

  const end = endOfWeek(endOfMonth(date), {
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

export function getRussianEventCount(count: number) {
  if (count === 1) {
    return "событие";
  }

  if (count >= 2 && count <= 4) {
    return "события";
  }

  return "событий";
}
