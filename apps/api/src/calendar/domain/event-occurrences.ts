import { EventRepeat } from '@prisma/client';

import { CalendarEvent } from '../calendar-event.mapper';

import { nextOccurrence, occurrenceOnOrAfter } from './recurrence';

export function expandRecurringEvent(
  event: CalendarEvent,
  rangeStart: Date,
  rangeEnd: Date,
): CalendarEvent[] {
  const occurrences: CalendarEvent[] = [];

  const duration = event.endAt
    ? event.endAt.getTime() - event.startAt.getTime()
    : 0;

  const first = occurrenceOnOrAfter(
    event.startAt,
    event.repeat,
    new Date(rangeStart.getTime() - Math.max(0, duration)),
  );
  if (!first) return occurrences;
  let occurrenceStart = first;

  let safetyCounter = 0;

  const MAX_OCCURRENCES = 1000;

  while (occurrenceStart <= rangeEnd && safetyCounter < MAX_OCCURRENCES) {
    safetyCounter++;
    if (event.repeatUntil && occurrenceStart > event.repeatUntil) {
      break;
    }

    const occurrenceEnd = event.endAt
      ? new Date(occurrenceStart.getTime() + duration)
      : null;
    // Include events that began earlier but are still running in this range.
    // An end exactly at rangeStart does not overlap the requested range.
    const insideRange =
      occurrenceStart <= rangeEnd &&
      (occurrenceStart >= rangeStart ||
        (occurrenceEnd !== null && occurrenceEnd > rangeStart));
    const isExcluded = event.excludedDates.some(
      (excludedDate) => excludedDate.getTime() === occurrenceStart.getTime(),
    );

    if (insideRange && !isExcluded) {
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

  return (
    occurrenceOnOrAfter(
      event.startAt,
      event.repeat,
      occurrenceDate,
    )?.getTime() === occurrenceDate.getTime()
  );
}
