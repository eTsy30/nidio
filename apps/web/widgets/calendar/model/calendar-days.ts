import { addDays, startOfDay } from "date-fns";

import { getDateKey } from "@/features/calendar/model/utils";
import type { CalendarEvent } from "@/features/calendar/types";

export function groupCalendarDays(events: CalendarEvent[], from: Date, to: Date) {
  const result = new Map<string, CalendarEvent[]>();
  const sorted = [...events].sort(
    (a, b) => Number(b.allDay) - Number(a.allDay) || Date.parse(a.startAt) - Date.parse(b.startAt),
  );
  for (const event of sorted) {
    const start = new Date(event.startAt);
    const end = event.endAt
      ? new Date(Math.max(start.getTime(), Date.parse(event.endAt) - 1))
      : start;
    for (
      let day = startOfDay(new Date(Math.max(start.getTime(), from.getTime())));
      day <= end && day <= to;
      day = addDays(day, 1)
    ) {
      const key = getDateKey(day);
      const entries = result.get(key) ?? [];
      if (!entries.some((item) => item.id === event.id && item.startAt === event.startAt))
        entries.push(event);
      result.set(key, entries);
    }
  }
  return result;
}
