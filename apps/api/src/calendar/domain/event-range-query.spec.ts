import { EventRepeat } from '@prisma/client';

import { eventRangeWhere } from './event-range-query';

describe('eventRangeWhere', () => {
  it('filters one-off events in SQL and retains only active recurring series', () => {
    const startFrom = new Date('2026-09-01T00:00:00.000Z');
    const startTo = new Date('2026-09-30T23:59:59.999Z');

    expect(eventRangeWhere(startFrom, startTo)).toEqual({
      OR: [
        {
          repeat: EventRepeat.NONE,
          startAt: { gte: startFrom, lte: startTo },
        },
        {
          repeat: { not: EventRepeat.NONE },
          startAt: { lte: startTo },
          OR: [{ repeatUntil: null }, { repeatUntil: { gte: startFrom } }],
        },
      ],
    });
  });
});
