"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import {
  addMonths,
  addWeeks,
  addYears,
  startOfWeek,
  subMonths,
  subWeeks,
  subYears,
} from "date-fns";

import { CreateEventForm } from "@/features/calendar/create-event/ui/CreateEventForm";
import { CREATE_EVENT, GET_EVENTS } from "@/features/calendar/graphql";
import {
  type CalendarEvent,
  EventRepeat,
  EventScope,
  EventType,
  type ViewMode,
} from "@/features/calendar/types";
import { SelectedDayDrawer } from "@/features/calendar/ui/SelectedDayDrawer";
import { cn } from "@/shared/lib/cn";

import { getCalendarRange, getDateKey } from "../model/utils";

import { CalendarHeader } from "./CalendarHeader";
import { CalendarYear } from "./CalendarYear";
import { MonthView } from "./MonthView";
import { WeekView } from "./WeekView";

interface CreateEventValues {
  title: string;
  description: string;
  type: EventType;
  startAt: Date;
  endAt: Date | null;
  allDay: boolean;
  repeat: EventRepeat;
}

export default function CalendarWidget() {
  const [scope, setScope] = useState<EventScope>(EventScope.PERSONAL);

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const [month, setMonth] = useState(new Date());

  const [weekStart, setWeekStart] = useState(
    startOfWeek(new Date(), {
      weekStartsOn: 1,
    }),
  );

  const [viewMode, setViewMode] = useState<ViewMode>("month");

  const [filter, setFilter] = useState<EventType | "ALL">("ALL");

  const [createEventOpen, setCreateEventOpen] = useState(false);

  const currentDate = viewMode === "week" ? weekStart : month;

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

  const { data, loading, error, refetch } = useQuery<{
    events: CalendarEvent[];
  }>(GET_EVENTS, {
    variables,
    fetchPolicy: "cache-and-network",
    nextFetchPolicy: "cache-first",
    notifyOnNetworkStatusChange: true,
  });

  const [createEvent, { loading: creating }] = useMutation(CREATE_EVENT);

  const events = useMemo<CalendarEvent[]>(() => data?.events ?? [], [data?.events]);

  const filteredEvents = useMemo(() => {
    if (filter === "ALL") {
      return events;
    }

    return events.filter((event) => event.type === filter);
  }, [events, filter]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();

    for (const event of filteredEvents) {
      const date = new Date(event.startAt);
      const key = getDateKey(date);

      const current = map.get(key);

      if (!current) {
        map.set(key, [event]);
        continue;
      }

      // Защита от одинаковых occurrence,
      // пришедших с backend.
      const alreadyExists = current.some(
        (existingEvent) => existingEvent.id === event.id && existingEvent.startAt === event.startAt,
      );

      if (!alreadyExists) {
        current.push(event);
      }
    }

    return map;
  }, [filteredEvents]);

  const selectedEvents = useMemo(() => {
    if (!selectedDate) {
      return [];
    }

    return eventsByDate.get(getDateKey(selectedDate)) ?? [];
  }, [selectedDate, eventsByDate]);

  const goToday = () => {
    const today = new Date();

    setMonth(today);

    setWeekStart(
      startOfWeek(today, {
        weekStartsOn: 1,
      }),
    );

    setSelectedDate(today);
  };

  const goPrev = () => {
    if (viewMode === "month") {
      setMonth((current) => subMonths(current, 1));
      return;
    }

    if (viewMode === "week") {
      setWeekStart((current) => subWeeks(current, 1));
      return;
    }

    setMonth((current) => subYears(current, 1));
  };

  const goNext = () => {
    if (viewMode === "month") {
      setMonth((current) => addMonths(current, 1));
      return;
    }

    if (viewMode === "week") {
      setWeekStart((current) => addWeeks(current, 1));
      return;
    }

    setMonth((current) => addYears(current, 1));
  };

  const handleViewChange = (view: ViewMode) => {
    const baseDate = selectedDate ?? new Date();

    setViewMode(view);

    if (view === "week") {
      setWeekStart(
        startOfWeek(baseDate, {
          weekStartsOn: 1,
        }),
      );
    }

    if (view === "year") {
      setMonth(new Date(baseDate.getFullYear(), baseDate.getMonth(), 1));
    }

    if (view === "month") {
      setMonth(new Date(baseDate.getFullYear(), baseDate.getMonth(), 1));
    }
  };

  const handleSelectDate = (date: Date) => {
    setSelectedDate(date);

    if (
      viewMode === "month" &&
      (date.getMonth() !== month.getMonth() || date.getFullYear() !== month.getFullYear())
    ) {
      setMonth(date);
    }
  };

  const handleYearMonthClick = (date: Date) => {
    setMonth(date);
    setViewMode("month");
  };

  const handleYearDayClick = (date: Date) => {
    setSelectedDate(date);
  };

  const handleScopeChange = (nextScope: EventScope) => {
    setScope(nextScope);
    setSelectedDate(null);
    setCreateEventOpen(false);
  };

  const handleCreateEvent = async (values: CreateEventValues) => {
    try {
      await createEvent({
        variables: {
          input: {
            title: values.title,
            description: values.description || undefined,
            startAt: values.startAt.toISOString(),
            endAt: values.endAt?.toISOString() ?? undefined,
            type: values.type,
            scope,
          },
        },
      });

      setCreateEventOpen(false);

      await refetch();
    } catch (createError) {
      console.error("Не удалось создать событие:", createError);
    }
  };

  if (loading && !data) {
    return (
      <main className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">Загрузка календаря…</p>
      </main>
    );
  }

  if (error && !data) {
    return (
      <main className="flex h-full items-center justify-center p-6">
        <div className="text-center">
          <p className="text-sm font-medium">Не удалось загрузить календарь</p>

          <p className="mt-1 text-xs text-muted-foreground">{error.message}</p>

          <button
            type="button"
            className="mt-4 rounded-xl border px-4 py-2 text-sm"
            onClick={() => void refetch()}
          >
            Повторить
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="relative flex h-full min-h-0 overflow-hidden bg-background">
      <div
        className={cn(
          "flex min-w-0 flex-1 flex-col",
          selectedDate && "lg:w-[calc(100%-380px)] lg:flex-none",
        )}
      >
        <CalendarHeader
          month={month}
          scope={scope}
          viewMode={viewMode}
          filter={filter}
          onScopeChange={handleScopeChange}
          onViewModeChange={handleViewChange}
          onPrev={goPrev}
          onNext={goNext}
          onToday={goToday}
          onMonthChange={setMonth}
          onFilterChange={setFilter}
        />

        <div className="relative min-h-0 flex-1 overflow-auto p-2 sm:p-4">
          {loading && (
            <div className="pointer-events-none absolute right-4 top-4 z-10 rounded-full bg-background/90 px-3 py-1.5 text-xs text-muted-foreground shadow-sm">
              Обновление…
            </div>
          )}

          {viewMode === "month" && (
            <MonthView
              month={month}
              eventsByDate={eventsByDate}
              selectedDate={selectedDate}
              onSelectDate={handleSelectDate}
              onMonthChange={setMonth}
            />
          )}

          {viewMode === "week" && (
            <WeekView
              weekStart={weekStart}
              eventsByDate={eventsByDate}
              selectedDate={selectedDate}
              onSelectDate={handleSelectDate}
              onEventClick={(event: CalendarEvent) => {
                setSelectedDate(new Date(event.startAt));
              }}
            />
          )}

          {viewMode === "year" && (
            <CalendarYear
              year={month}
              events={filteredEvents}
              onMonthClick={handleYearMonthClick}
              onDayClick={handleYearDayClick}
            />
          )}
        </div>
      </div>

      {selectedDate && (
        <SelectedDayDrawer
          date={selectedDate}
          events={selectedEvents}
          scope={scope}
          onClose={() => {
            setSelectedDate(null);
          }}
          onAddEvent={() => {
            setCreateEventOpen(true);
          }}
          onEventClick={() => {}}
        />
      )}

      {createEventOpen && selectedDate && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/30 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="max-h-[90dvh] w-full max-w-lg overflow-auto rounded-t-3xl bg-background p-5 shadow-2xl sm:rounded-3xl">
            <div className="mb-5">
              <h2 className="text-xl font-bold">Новое событие</h2>

              <p className="mt-1 text-sm text-muted-foreground">Добавьте момент в календарь</p>
            </div>

            <CreateEventForm
              scope={scope}
              date={selectedDate}
              onCancel={() => setCreateEventOpen(false)}
              onSubmit={async (values) => {
                try {
                  await createEvent({
                    variables: {
                      input: {
                        title: values.title,
                        description: values.description || undefined,
                        type: values.type,
                        scope,
                        startAt: values.startAt.toISOString(),
                        endAt: values.endAt?.toISOString(),
                        allDay: values.allDay,
                        repeat: values.repeat,
                      },
                    },
                  });

                  setCreateEventOpen(false);
                  await refetch();
                } catch (error) {
                  console.error("Не удалось создать событие:", error);
                }
              }}
            />

            {creating && (
              <p className="mt-3 text-center text-xs text-muted-foreground">Сохраняем событие…</p>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
