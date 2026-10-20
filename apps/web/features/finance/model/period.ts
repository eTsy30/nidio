import {
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subMonths,
} from "date-fns";
export const dateKey = (date = new Date()) => format(date, "yyyy-MM-dd");
export function periodRange(period: string, today = new Date()) {
  const start =
    period === "week"
      ? startOfWeek(today, { weekStartsOn: 1 })
      : period === "year"
        ? startOfYear(today)
        : startOfMonth(today);
  const end =
    period === "week"
      ? endOfWeek(today, { weekStartsOn: 1 })
      : period === "year"
        ? endOfYear(today)
        : endOfMonth(today);
  return { start: dateKey(start), end: dateKey(end) };
}
export const previousMonth = (today = new Date()) => periodRange("month", subMonths(today, 1));
