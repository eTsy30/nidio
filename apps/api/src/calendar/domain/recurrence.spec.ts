import { EventRepeat } from '@prisma/client';

import { nextOccurrence, previousOccurrence } from './recurrence';

describe('calendar recurrence', () => {
  it.each([
    [EventRepeat.DAILY, '2026-03-08T01:30:00.000Z'],
    [EventRepeat.WEEKLY, '2026-03-14T01:30:00.000Z'],
  ])(
    'preserves the UTC instant for %s across a DST boundary',
    (repeat, expected) => {
      expect(
        nextOccurrence(
          new Date('2026-03-07T01:30:00.000Z'),
          repeat,
        )?.toISOString(),
      ).toBe(expected);
    },
  );

  it('keeps the established JavaScript month-overflow behavior', () => {
    expect(
      nextOccurrence(
        new Date('2026-01-31T10:00:00.000Z'),
        EventRepeat.MONTHLY,
      )?.toISOString(),
    ).toBe('2026-03-03T10:00:00.000Z');
  });

  it('keeps the established leap-day yearly behavior', () => {
    expect(
      nextOccurrence(
        new Date('2024-02-29T10:00:00.000Z'),
        EventRepeat.YEARLY,
      )?.toISOString(),
    ).toBe('2025-03-01T10:00:00.000Z');
  });

  it('moves backwards with the same UTC rules', () => {
    expect(
      previousOccurrence(
        new Date('2026-03-03T10:00:00.000Z'),
        EventRepeat.MONTHLY,
      )?.toISOString(),
    ).toBe('2026-02-03T10:00:00.000Z');
  });

  it('does not create an occurrence for NONE', () => {
    expect(nextOccurrence(new Date(), EventRepeat.NONE)).toBeNull();
    expect(previousOccurrence(new Date(), EventRepeat.NONE)).toBeNull();
  });
});
