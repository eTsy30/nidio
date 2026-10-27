import { EventRepeat } from '@prisma/client';

import {
  nextOccurrence,
  occurrenceOnOrAfter,
  previousOccurrence,
} from './recurrence';

describe('calendar recurrence', () => {
  it.each([
    EventRepeat.DAILY,
    EventRepeat.WEEKLY,
    EventRepeat.MONTHLY,
    EventRepeat.YEARLY,
  ])(
    'seeking %s matches sequential recurrence including overflow',
    (repeat) => {
      const start = new Date('2024-01-31T10:00:00Z');
      let expected = start;
      for (let i = 0; i < 1500; i++)
        expected = nextOccurrence(expected, repeat)!;
      expect(occurrenceOnOrAfter(start, repeat, expected)).toEqual(expected);
      expect(
        occurrenceOnOrAfter(start, repeat, new Date(expected.getTime() - 1)),
      ).toEqual(expected);
      expect(
        occurrenceOnOrAfter(start, repeat, new Date(expected.getTime() + 1)),
      ).toEqual(nextOccurrence(expected, repeat));
    },
  );
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
