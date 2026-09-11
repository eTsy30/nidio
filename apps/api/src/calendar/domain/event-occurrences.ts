import { EventRepeat } from '@prisma/client';

import { CalendarEvent } from '../calendar-event.mapper';

import { nextOccurrence } from './recurrence';

export function expandRecurringEvent(
  event: CalendarEvent,
  rangeStart: Date,
  rangeEnd: Date,
): CalendarEvent[] {
  const occurrences: CalendarEvent[] = [];

  let occurrenceStart = new Date(event.startAt);

  const duration = event.endAt
    ? event.endAt.getTime() - event.startAt.getTime()
    : 0;

  let safetyCounter = 0;

  const MAX_OCCURRENCES = 1000;

  while (occurrenceStart <= rangeEnd && safetyCounter < MAX_OCCURRENCES) {
    safetyCounter++;
    if (event.repeatUntil && occurrenceStart > event.repeatUntil) {
      break;
    }

    const insideRange =
      occurrenceStart >= rangeStart && occurrenceStart <= rangeEnd;
    const isExcluded = event.excludedDates.some(
      (excludedDate) => excludedDate.getTime() === occurrenceStart.getTime(),
    );

    if (insideRange && !isExcluded) {
      const occurrenceEnd = event.endAt
        ? new Date(occurrenceStart.getTime() + duration)
        : null;

      const occurrenceId = `${event.id}-${occurrenceStart.toISOString()}`;

      occurrences.push({
        ...event,
        id: occurrenceId,
        seriesId: event.id,
        startAt: new Date(occurrenceStart),
        reminderAt: event.reminderAt
          ? new Date(
              event.reminderAt.getTime() +
                occurrenceStart.getTime() -
                event.startAt.getTime(),
            )
          : null,
        endAt: occurrenceEnd,
      });
    }

    const next = nextOccurrence(occurrenceStart, event.repeat);

    if (!next || next.getTime() <= occurrenceStart.getTime()) {
      break;
    }

    occurrenceStart = next;
  }

  return occurrences;
}

export function isRecurringOccurrence(
  event: CalendarEvent,
  occurrenceDate: Date,
): boolean {
  if (event.repeat === EventRepeat.NONE) {
    return false;
  }

  if (occurrenceDate < event.startAt) {
    return false;
  }

  if (event.repeatUntil && occurrenceDate > event.repeatUntil) {
    return false;
  }

  let current = new Date(event.startAt);

  for (let i = 0; i < 1000; i++) {
    if (current.getTime() === occurrenceDate.getTime()) {
      return true;
    }

    if (current > occurrenceDate) {
      return false;
    }

    const next = nextOccurrence(current, event.repeat);

    if (!next || next.getTime() <= current.getTime()) {
      return false;
    }

    current = next;
  }

  return false;
}
