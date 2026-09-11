import { EventRepeat } from '@prisma/client';

export function nextOccurrence(date: Date, repeat: EventRepeat): Date | null {
  const next = new Date(date);

  switch (repeat) {
    case EventRepeat.DAILY:
      next.setUTCDate(next.getUTCDate() + 1);
      return next;
    case EventRepeat.WEEKLY:
      next.setUTCDate(next.getUTCDate() + 7);
      return next;
    case EventRepeat.MONTHLY:
      next.setUTCMonth(next.getUTCMonth() + 1);
      return next;
    case EventRepeat.YEARLY:
      next.setUTCFullYear(next.getUTCFullYear() + 1);
      return next;
    case EventRepeat.NONE:
      return null;
  }
}

export function previousOccurrence(
  date: Date,
  repeat: EventRepeat,
): Date | null {
  const previous = new Date(date);

  switch (repeat) {
    case EventRepeat.DAILY:
      previous.setUTCDate(previous.getUTCDate() - 1);
      return previous;
    case EventRepeat.WEEKLY:
      previous.setUTCDate(previous.getUTCDate() - 7);
      return previous;
    case EventRepeat.MONTHLY:
      previous.setUTCMonth(previous.getUTCMonth() - 1);
      return previous;
    case EventRepeat.YEARLY:
      previous.setUTCFullYear(previous.getUTCFullYear() - 1);
      return previous;
    case EventRepeat.NONE:
      return null;
  }
}
