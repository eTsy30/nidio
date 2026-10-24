import { Suspense } from "react";

import { CalendarWidget } from "@/widgets/calendar";
import { CalendarLoading } from "@/widgets/calendar/ui/CalendarLoading";

export function CalendarPageLoading() {
  return <CalendarLoading />;
}

export function CalendarPage() {
  return (
    <Suspense fallback={<CalendarPageLoading />}>
      <CalendarWidget />
    </Suspense>
  );
}
