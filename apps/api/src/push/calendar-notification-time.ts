import type { Event } from '@prisma/client';

import { nextOccurrence } from '../calendar/domain/recurrence';

export function validTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat('en', { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}

export function localDateKey(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  return ['year', 'month', 'day']
    .map((type) => parts.find((part) => part.type === type)!.value)
    .join('-');
}

export function localNoon(dateKey: string, timeZone: string): Date {
  const target = Date.parse(`${dateKey}T12:00:00.000Z`);
  let value = target;
  for (let i = 0; i < 4; i++) {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(new Date(value));
    const get = (type: string) =>
      Number(parts.find((part) => part.type === type)!.value);
    const actual = Date.UTC(
      get('year'),
      get('month') - 1,
      get('day'),
      get('hour'),
      get('minute'),
      get('second'),
    );
    const correction = target - actual;
    value += correction;
    if (!correction) break;
  }
  return new Date(value);
}

export const advanceOccurrence = nextOccurrence;

type EventTiming = Pick<
  Event,
  | 'startAt'
  | 'reminderAt'
  | 'repeat'
  | 'repeatUntil'
  | 'excludedDates'
  | 'timeZone'
>;
export type EventNoticeKind = 'EVENT_REMINDER' | 'EVENT_DAY';
export type NoticeTime = { runAt: Date; occurrenceAt: Date; dateKey: string };

export function nextEventNotice(
  event: EventTiming,
  kind: EventNoticeKind,
  timeZone: string,
  from: Date,
): NoticeTime | null {
  if (kind === 'EVENT_REMINDER' && !event.reminderAt) return null;
  const offset = event.reminderAt
    ? event.reminderAt.getTime() - event.startAt.getTime()
    : 0;
  const threshold =
    kind === 'EVENT_REMINDER'
      ? from.getTime() - offset
      : from.getTime() - 2 * 86_400_000;
  let occurrence: Date | null = new Date(event.startAt);
  if (event.repeat === 'DAILY' || event.repeat === 'WEEKLY') {
    const step = 86_400_000 * (event.repeat === 'WEEKLY' ? 7 : 1);
    const skip = Math.max(
      0,
      Math.floor((threshold - occurrence.getTime()) / step),
    );
    occurrence = new Date(occurrence.getTime() + skip * step);
  }
  const excluded = new Set(event.excludedDates.map((date) => date.getTime()));
  for (let i = 0; occurrence && i < 120_000; i++) {
    if (event.repeatUntil && occurrence > event.repeatUntil) return null;
    const dateKey = localDateKey(occurrence, event.timeZone ?? timeZone);
    const runAt =
      kind === 'EVENT_REMINDER'
        ? new Date(occurrence.getTime() + offset)
        : localNoon(dateKey, timeZone);
    if (runAt >= from && !excluded.has(occurrence.getTime()))
      return { runAt, occurrenceAt: occurrence, dateKey };
    occurrence = advanceOccurrence(occurrence, event.repeat);
  }
  return null;
}

export function nextRelationshipNotice(
  relationshipAt: Date,
  timeZone: string,
  from: Date,
): NoticeTime | null {
  const monthDay = relationshipAt.toISOString().slice(5, 10);
  const firstYear = relationshipAt.getUTCFullYear() + 1;
  const currentYear = Number(localDateKey(from, timeZone).slice(0, 4));
  for (
    let year = Math.max(firstYear, currentYear);
    year < currentYear + 9;
    year++
  ) {
    const dateKey = `${year}-${monthDay}`;
    const occurrenceAt = new Date(`${dateKey}T00:00:00Z`);
    if (occurrenceAt.toISOString().slice(0, 10) !== dateKey) continue;
    const runAt = localNoon(dateKey, timeZone);
    if (runAt >= from) return { runAt, occurrenceAt, dateKey };
  }
  return null;
}
