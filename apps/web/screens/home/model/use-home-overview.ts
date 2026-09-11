"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery as useApolloQuery } from "@apollo/client/react";
import { useQuery } from "@tanstack/react-query";
import { addDays, startOfDay } from "date-fns";

import { GET_EVENTS } from "@/features/calendar/graphql";
import { type CalendarEvent, EventScope } from "@/features/calendar/types";
import { togetherKeys } from "@/features/together/api/query-keys";
import { tasksApi } from "@/features/together/api/tasks.api";

export function useHomeOverview() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  const day = startOfDay(now).getTime();
  const variables = useMemo(
    () => ({
      filter: {
        scope: EventScope.COUPLE,
        startFrom: new Date(day).toISOString(),
        startTo: addDays(new Date(day), 7).toISOString(),
      },
    }),
    [day],
  );
  const tasks = useQuery({
    queryKey: togetherKeys.today(),
    queryFn: tasksApi.getToday,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
  const calendar = useApolloQuery<{ events: CalendarEvent[] }>(GET_EVENTS, {
    variables,
    fetchPolicy: "cache-and-network",
  });
  const upcoming = (calendar.data?.events ?? [])
    .filter(
      (event) =>
        new Date(event.endAt ?? event.startAt).getTime() >= (event.allDay ? day : now.getTime()),
    )
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

  return { now, tasks, calendar, upcoming };
}
