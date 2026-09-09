/// <reference types="jest" />
import {
  localDateKey,
  localNoon,
  nextEventNotice,
  nextRelationshipNotice,
  validTimeZone,
} from './calendar-notification-time';

const event = {
  startAt: new Date('2026-09-09T16:00:00Z'),
  reminderAt: new Date('2026-09-09T15:00:00Z'),
  repeat: 'DAILY' as const,
  repeatUntil: null,
  excludedDates: [] as Date[],
  timeZone: 'Europe/Minsk',
};

describe('Calendar notification times', () => {
  it('keeps the selected offset for every repetition', () => {
    const result = nextEventNotice(
      event,
      'EVENT_REMINDER',
      'Europe/Minsk',
      new Date('2026-09-10T00:00:00Z'),
    );
    expect(result?.runAt.toISOString()).toBe('2026-09-10T15:00:00.000Z');
    expect(result?.occurrenceAt.toISOString()).toBe('2026-09-10T16:00:00.000Z');
  });
  it('skips excluded instances and respects the end of a series', () => {
    const result = nextEventNotice(
      { ...event, excludedDates: [event.startAt], repeatUntil: event.startAt },
      'EVENT_REMINDER',
      'UTC',
      new Date('2026-09-09T00:00:00Z'),
    );
    expect(result).toBeNull();
  });
  it('does not invent a reminder for null reminderAt', () => {
    expect(
      nextEventNotice(
        { ...event, reminderAt: null },
        'EVENT_REMINDER',
        'UTC',
        new Date(),
      ),
    ).toBeNull();
  });
  it('finds a current daily instance of a series older than 1000 days', () => {
    const result = nextEventNotice(
      {
        ...event,
        startAt: new Date('2000-01-01T16:00:00Z'),
        reminderAt: new Date('2000-01-01T15:00:00Z'),
      },
      'EVENT_REMINDER',
      'UTC',
      new Date('2026-09-09T00:00:00Z'),
    );
    expect(result?.runAt.toISOString()).toBe('2026-09-09T15:00:00.000Z');
  });
  it('converts noon separately for both recipients', () => {
    expect(localNoon('2026-09-09', 'Europe/Minsk').toISOString()).toBe(
      '2026-09-09T09:00:00.000Z',
    );
    expect(localNoon('2026-09-09', 'America/New_York').toISOString()).toBe(
      '2026-09-09T16:00:00.000Z',
    );
    expect(localNoon('2026-09-09', 'Asia/Kathmandu').toISOString()).toBe(
      '2026-09-09T06:15:00.000Z',
    );
  });
  it('uses the DST offset on the notification date, not the current offset', () => {
    expect(localNoon('2026-03-07', 'America/New_York').toISOString()).toBe(
      '2026-03-07T17:00:00.000Z',
    );
    expect(localNoon('2026-03-08', 'America/New_York').toISOString()).toBe(
      '2026-03-08T16:00:00.000Z',
    );
  });
  it('keeps an all-day birthday on its original calendar date across zones', () => {
    const result = nextEventNotice(
      { ...event, startAt: new Date('2026-09-08T21:00:00Z'), repeat: 'NONE' },
      'EVENT_DAY',
      'America/New_York',
      new Date('2026-09-08T00:00:00Z'),
    );
    expect(result?.dateKey).toBe('2026-09-09');
    expect(result?.runAt.toISOString()).toBe('2026-09-09T16:00:00.000Z');
  });
  it('schedules a relationship anniversary after the first year and preserves the profile date', () => {
    const result = nextRelationshipNotice(
      new Date('2020-09-09T00:00:00Z'),
      'America/Los_Angeles',
      new Date('2026-09-09T00:00:00Z'),
    );
    expect(result?.runAt.toISOString()).toBe('2026-09-09T19:00:00.000Z');
    expect(
      nextRelationshipNotice(
        new Date('2026-09-09T00:00:00Z'),
        'UTC',
        new Date('2026-09-09T00:00:00Z'),
      )?.dateKey,
    ).toBe('2027-09-09');
  });
  it('does not roll February 29 over into March for relationship anniversaries', () => {
    expect(
      nextRelationshipNotice(
        new Date('2024-02-29T00:00:00Z'),
        'UTC',
        new Date('2026-01-01T00:00:00Z'),
      )?.dateKey,
    ).toBe('2028-02-29');
  });
  it('validates zones and formats dates near the UTC date boundary', () => {
    expect(validTimeZone('Europe/Minsk')).toBe(true);
    expect(validTimeZone('Mars/City')).toBe(false);
    expect(localDateKey(new Date('2026-09-08T21:30:00Z'), 'Europe/Minsk')).toBe(
      '2026-09-09',
    );
  });
});
