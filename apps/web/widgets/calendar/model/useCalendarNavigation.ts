import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { addMonths, addWeeks, addYears, format, isValid, parseISO, startOfWeek } from "date-fns";

import { EventScope, type ViewMode } from "@/features/calendar/types";

export function useCalendarNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const raw = params.get("date");
  const parsed = raw && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? parseISO(raw) : null;
  const date = parsed && isValid(parsed) ? parsed : new Date();
  const scope = params.get("scope") === "couple" ? EventScope.COUPLE : EventScope.PERSONAL;
  const view = params.get("view");
  const viewMode: ViewMode = view === "week" || view === "year" ? view : "month";
  const navigate = (next: { date?: Date; scope?: EventScope; view?: ViewMode }) => {
    const query = new URLSearchParams(params.toString());
    if (next.date) query.set("date", format(next.date, "yyyy-MM-dd"));
    if (next.scope) query.set("scope", next.scope === EventScope.COUPLE ? "couple" : "personal");
    if (next.view) query.set("view", next.view);
    router.replace(`${pathname}?${query}`, { scroll: false });
  };
  const move = (amount: number) =>
    navigate({
      date: (viewMode === "week" ? addWeeks : viewMode === "year" ? addYears : addMonths)(
        date,
        amount,
      ),
    });
  return {
    date,
    scope,
    viewMode,
    navigate,
    move,
    weekStart: startOfWeek(date, { weekStartsOn: 1 }),
  };
}
