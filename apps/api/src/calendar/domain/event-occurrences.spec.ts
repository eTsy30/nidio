import { EventRepeat, EventScope } from '@prisma/client';

import type { CalendarEvent } from '../calendar-event.mapper';

import { expandRecurringEvent } from './event-occurrences';

const event: CalendarEvent = {
  id: 'night',
  title: 'Night',
  description: null,
  type: 'OTHER',
  scope: EventScope.PERSONAL,
  createdById: 'user',
  userId: 'user',
  coupleId: null,
  allDay: false,
  startAt: new Date('2026-10-31T23:00:00Z'),
  endAt: new Date('2026-11-01T02:00:00Z'),
  repeat: EventRepeat.DAILY,
  reminderAt: null,
  repeatUntil: new Date('2026-10-31T23:00:00Z'),
  excludedDates: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('calendar overlap', () => {
  const start = new Date('2026-11-01T00:00:00Z');
  const end = new Date('2026-11-01T23:59:59Z');
  it('includes a previous-day occurrence still running after the range starts', () => {
    const result = expandRecurringEvent(event, start, end);
    expect(result).toHaveLength(1);
    expect(result[0]?.endAt).toEqual(event.endAt);
  });
  it('does not include an occurrence ending exactly at the range start', () => {
    expect(
      expandRecurringEvent({ ...event, endAt: start }, start, end),
    ).toHaveLength(0);
  });
  it('respects exclusions for overlapping occurrences', () => {
    expect(
      expandRecurringEvent(
        { ...event, excludedDates: [event.startAt] },
        start,
        end,
      ),
    ).toHaveLength(0);
  });
  it('does not include an earlier event without an end time', () => {
    expect(
      expandRecurringEvent({ ...event, endAt: null }, start, end),
    ).toHaveLength(0);
  });
  it('includes an occurrence starting exactly at the range start', () => {
    const result = expandRecurringEvent(
      { ...event, startAt: start, repeatUntil: start },
      start,
      end,
    );
    expect(result).toHaveLength(1);
    expect(result[0]?.startAt).toEqual(start);
  });
});
