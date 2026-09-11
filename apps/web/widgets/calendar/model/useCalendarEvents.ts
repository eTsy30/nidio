"use client";

import { useMemo } from "react";
import { useMutation, useQuery } from "@apollo/client/react";

import { CREATE_EVENT, GET_EVENTS, UPDATE_EVENT } from "@/features/calendar/graphql";
import { getCalendarRange } from "@/features/calendar/model/utils";
import {
  type CalendarEvent,
  type CalendarEventFormValues,
  EventScope,
  type ViewMode,
} from "@/features/calendar/types";

export function useCalendarEvents({
  currentDate,
  scope,
  viewMode,
}: {
  currentDate: Date;
  scope: EventScope;
  viewMode: ViewMode;
}) {
  const range = useMemo(() => getCalendarRange(currentDate, viewMode), [currentDate, viewMode]);
  const variables = useMemo(
    () => ({
      filter: {
        scope,
        startFrom: range.start.toISOString(),
        startTo: range.end.toISOString(),
      },
    }),
    [scope, range.start, range.end],
  );
  const { data, error, loading, refetch } = useQuery<{ events: CalendarEvent[] }>(GET_EVENTS, {
    variables,
    fetchPolicy: "cache-and-network",
    nextFetchPolicy: "cache-first",
    notifyOnNetworkStatusChange: true,
  });
  const [createEvent] = useMutation(CREATE_EVENT);
  const [updateEvent, { loading: updating }] = useMutation(UPDATE_EVENT);
  const events = useMemo<CalendarEvent[]>(() => data?.events ?? [], [data?.events]);

  const create = async (values: CalendarEventFormValues) => {
    await createEvent({
      variables: {
        input: {
          title: values.title,
          description: values.description || undefined,
          type: values.type,
          scope,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          startAt: values.startAt.toISOString(),
          endAt: values.endAt?.toISOString() ?? null,
          allDay: values.allDay,
          repeat: values.repeat,
          reminderAt: values.reminderAt?.toISOString() ?? null,
        },
      },
    });
    await refetch();
  };

  const update = async (event: CalendarEvent, values: CalendarEventFormValues) => {
    await updateEvent({
      variables: {
        id: event.seriesId || event.id,
        input: {
          occurrenceDate: event.startAt,
          ...(values.startAt.getTime() !== new Date(event.startAt).getTime()
            ? { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }
            : {}),
          title: values.title,
          description: values.description || undefined,
          type: values.type,
          startAt: values.startAt.toISOString(),
          endAt: values.endAt?.toISOString() ?? null,
          allDay: values.allDay,
          repeat: values.repeat,
          reminderAt: values.reminderAt?.toISOString() ?? null,
        },
      },
    });
    await refetch();
  };

  return { create, data, error, events, loading, refetch, update, updating };
}
