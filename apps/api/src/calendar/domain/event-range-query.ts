import { EventRepeat, Prisma } from '@prisma/client';

/**
 * SQL pre-filter for events that can produce an instance in the requested range.
 * The recurrence expansion in event-occurrences remains the source of truth for
 * exclusions and exact occurrences.
 */
export function eventRangeWhere(
  startFrom: Date,
  startTo: Date,
): Prisma.EventWhereInput {
  return {
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
  };
}
