import {
  addMonths,
  addWeeks,
  differenceInCalendarDays,
  differenceInCalendarMonths,
  format,
  parseISO,
} from "date-fns";

import { createAmounts } from "./savings-plan";
import type { Goal, SavingsPeriod } from "./types";

export const strategyLabels = { GRID: "С клеточками", SCHEDULE: "По расписанию", FREE: "Свободно" };
export const strategyOf = (goal: Goal) => goal.strategy ?? (goal.plan?.length ? "GRID" : "FREE");
export const todayDate = () => format(new Date(), "yyyy-MM-dd");
export const amountLabel = (minor: number) =>
  new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 }).format(minor / 100);

export function automaticGrid(
  target: number,
  count = 24,
  equal = false,
  shuffled = false,
): number[] {
  if (!Number.isSafeInteger(target) || target < 1) return [];
  let seed = target % 2147483647 || 1;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  const amounts = createAmounts(
    target,
    equal ? "equal" : "random",
    Math.min(count, target),
    [],
    random,
  ).sort((a, b) => a - b);
  if (shuffled)
    for (let i = amounts.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [amounts[i], amounts[j]] = [amounts[j]!, amounts[i]!];
    }
  return amounts;
}

// Always calculate monthly dates from the original anchor (31 Jan -> 28 Feb -> 31 Mar).
export function scheduleDate(start: string, period: SavingsPeriod, index: number) {
  const anchor = parseISO(start);
  return format(
    period === "WEEK" ? addWeeks(anchor, index) : addMonths(anchor, index),
    "yyyy-MM-dd",
  );
}
function periodIndex(start: string, period: SavingsPeriod, now: string) {
  if (now <= start) return 0;
  let index =
    period === "WEEK"
      ? Math.floor(differenceInCalendarDays(parseISO(now), parseISO(start)) / 7)
      : differenceInCalendarMonths(parseISO(now), parseISO(start));
  if (scheduleDate(start, period, index) > now) index--;
  return Math.max(0, index);
}
export function scheduledContribution(goal: Goal, now = todayDate()) {
  const period = goal.scheduleEvery ?? "MONTH";
  const start = goal.scheduleStartDate ?? goal.createdAt?.slice(0, 10) ?? now;
  const index = periodIndex(start, period, now);
  const from = scheduleDate(start, period, index);
  const next = scheduleDate(start, period, index + 1);
  const contributed = goal.transactions
    .filter(
      (entry) =>
        !entry.cancelledAt &&
        format(parseISO(entry.createdAt), "yyyy-MM-dd") >= from &&
        format(parseISO(entry.createdAt), "yyyy-MM-dd") < next,
    )
    .reduce(
      (sum, entry) => sum + (entry.type === "DEPOSIT" ? entry.amountMinor : -entry.amountMinor),
      0,
    );
  const remaining = Math.max(0, goal.targetMinor - goal.currentMinor);
  const periods = goal.targetDate
    ? Math.max(1, periodIndex(start, period, goal.targetDate) - index + 1)
    : 1;
  const planned = goal.targetDate
    ? Math.ceil(Math.max(0, remaining + contributed) / periods)
    : (goal.scheduleAmountMinor ?? 0);
  return {
    amountMinor: Math.min(remaining, Math.max(0, planned - contributed)),
    planned,
    contributed,
    next,
    from,
    remaining,
  };
}
