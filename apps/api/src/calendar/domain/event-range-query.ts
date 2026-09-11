import { EventRepeat, Prisma } from '@prisma/client';

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
