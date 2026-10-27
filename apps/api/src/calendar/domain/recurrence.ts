import { EventRepeat } from '@prisma/client';

// Seek without replaying years of history. Preserve the established UTC overflow
// rules (e.g. Jan 31 -> Mar 3) before jumping across months/years.
export function occurrenceOnOrAfter(
  start: Date,
  repeat: EventRepeat,
  target: Date,
): Date | null {
  let current = new Date(start);
  if (current >= target) return current;
  if (repeat === EventRepeat.NONE) return null;
  if (repeat === EventRepeat.DAILY || repeat === EventRepeat.WEEKLY) {
    const step = (repeat === EventRepeat.DAILY ? 1 : 7) * 86400000;
    return new Date(
      current.getTime() +
        Math.ceil((target.getTime() - current.getTime()) / step) * step,
    );
  }
  while (
    current < target &&
    (repeat === EventRepeat.MONTHLY
      ? current.getUTCDate() > 28
      : current.getUTCMonth() === 1 && current.getUTCDate() === 29)
  ) {
    const next = nextOccurrence(current, repeat);
    if (!next) return null;
    current = next;
  }
  if (current >= target) return current;
  const years = target.getUTCFullYear() - current.getUTCFullYear();
  if (repeat === EventRepeat.MONTHLY) {
    const months = years * 12 + target.getUTCMonth() - current.getUTCMonth();
    current.setUTCMonth(current.getUTCMonth() + Math.max(0, months - 1));
  } else {
    current.setUTCFullYear(current.getUTCFullYear() + Math.max(0, years - 1));
  }
  while (current < target) {
    const next = nextOccurrence(current, repeat);
    if (!next || next <= current) return null;
    current = next;
  }
  return current;
}

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
