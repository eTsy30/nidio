"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
import { DeleteEventDialog } from "@/features/calendar/delete-event/ui/DeleteEventDialog";
import { EditEventForm } from "@/features/calendar/edit-event/ui/EditEventForm";
import {
  type CalendarEvent,
  EventScope,
  EventType,
  type ViewMode,
} from "@/features/calendar/types";
import { SelectedDayDrawer } from "@/features/calendar/ui/SelectedDayDrawer";
import { useAuth } from "@/shared/api/provider/auth-provider";
import { cn } from "@/shared/lib/cn";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/shared/ui/dialog/dialog";

import { type CalendarEventFormValues, useCalendarEvents } from "../model/useCalendarEvents";
import { useCalendarModal } from "../model/useCalendarModal";
import { getDateKey } from "../model/utils";

import { CalendarHeader } from "./CalendarHeader";
import { CalendarYear } from "./CalendarYear";
import { MonthView } from "./MonthView";
import { WeekView } from "./WeekView";

function toCalendarDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function parseCalendarDate(value: string | null): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export default function CalendarWidget() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const scope = searchParams.get("scope") === "couple" ? EventScope.COUPLE : EventScope.PERSONAL;
  const calendarDateValue = searchParams.get("date");
  const initialDate = parseCalendarDate(calendarDateValue) ?? new Date();

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const { closeModal, modal, openCreate, openDelete, openEdit } = useCalendarModal();

  const [month, setMonth] = useState<Date>(initialDate);

  const [weekStart, setWeekStart] = useState<Date>(
    startOfWeek(initialDate, {
      weekStartsOn: 1,
    }),
  );

  const viewParam = searchParams.get("view");
  const viewMode: ViewMode = viewParam === "week" || viewParam === "year" ? viewParam : "month";

  const [filter, setFilter] = useState<EventType | "ALL">("ALL");

  const updateCalendarParams = (next: { scope?: EventScope; view?: ViewMode; date?: Date }) => {
    const params = new URLSearchParams(searchParams.toString());
    const nextScope = next.scope ?? scope;
    const nextView = next.view ?? viewMode;
    if (nextScope === EventScope.PERSONAL) params.delete("scope");
    else params.set("scope", "couple");
    if (nextView === "month") params.delete("view");
    else params.set("view", nextView);
    if (next.date) params.set("date", toCalendarDate(next.date));
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const currentDate = viewMode === "week" ? weekStart : month;

  const { create, data, error, events, loading, refetch, update, updating } = useCalendarEvents({
    currentDate,
    scope,
    viewMode,
  });

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

      const currentEvents = map.get(key);

      if (!currentEvents) {
        map.set(key, [event]);
        continue;
      }

      const alreadyExists = currentEvents.some(
        (existingEvent) => existingEvent.id === event.id && existingEvent.startAt === event.startAt,
      );

      if (!alreadyExists) {
        currentEvents.push(event);
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
    updateCalendarParams({ date: today });
  };

  const goPrev = () => {
    if (viewMode === "month") {
      const next = subMonths(month, 1);
      setMonth(next);
      updateCalendarParams({ date: next });
      return;
    }

    if (viewMode === "week") {
      const next = subWeeks(weekStart, 1);
      setWeekStart(next);
      updateCalendarParams({ date: next });
      return;
    }

    const next = subYears(month, 1);
    setMonth(next);
    updateCalendarParams({ date: next });
  };

  const goNext = () => {
    if (viewMode === "month") {
      const next = addMonths(month, 1);
      setMonth(next);
      updateCalendarParams({ date: next });
      return;
    }

    if (viewMode === "week") {
      const next = addWeeks(weekStart, 1);
      setWeekStart(next);
      updateCalendarParams({ date: next });
      return;
    }

    const next = addYears(month, 1);
    setMonth(next);
    updateCalendarParams({ date: next });
  };

  const handleViewChange = (view: ViewMode) => {
    const baseDate = selectedDate ?? new Date();

    updateCalendarParams({ view, date: baseDate });

    if (view === "week") {
      setWeekStart(
        startOfWeek(baseDate, {
          weekStartsOn: 1,
        }),
      );

      return;
    }

    setMonth(new Date(baseDate.getFullYear(), baseDate.getMonth(), 1));
  };

  const handleSelectDate = (date: Date) => {
    setSelectedDate(date);
    updateCalendarParams({ date });

    if (
      viewMode === "month" &&
      (date.getMonth() !== month.getMonth() || date.getFullYear() !== month.getFullYear())
    ) {
      setMonth(date);
    }
  };

  const handleYearMonthClick = (date: Date) => {
    setMonth(new Date(date.getFullYear(), date.getMonth(), 1));

    setSelectedDate(null);
    updateCalendarParams({ view: "month" });
  };

  const handleYearDayClick = (date: Date) => {
    setSelectedDate(date);

    setMonth(new Date(date.getFullYear(), date.getMonth(), 1));
  };

  const handleScopeChange = (nextScope: EventScope) => {
    updateCalendarParams({ scope: nextScope });
    setSelectedDate(null);
    closeModal();
  };

  const handleDeleteEvent = (event: CalendarEvent) => {
    openDelete(event);
  };

  const handleEventDeleted = async () => {
    closeModal();
    setSelectedDate(null);
    await refetch();
  };

  const handleEditEvent = (event: CalendarEvent) => {
    openEdit(event);
  };

  const handleEventUpdated = async (values: CalendarEventFormValues) => {
    if (modal.kind !== "edit") return;

    const selectedEditEvent = modal.event;

    try {
      await update(selectedEditEvent, values);
      closeModal();
    } catch (error) {
      console.error("Не удалось обновить событие:", error);
    }
  };

  const handleCreateEvent = async (values: CalendarEventFormValues) => {
    await create(values);
    closeModal();
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
              onEventClick={(event) => {
                handleSelectDate(new Date(event.startAt));
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
          currentUserId={user?.id}
          date={selectedDate}
          events={selectedEvents}
          scope={scope}
          onClose={() => {
            setSelectedDate(null);
            closeModal();
          }}
          onAddEvent={() => {
            openCreate();
          }}
          onDeleteEvent={handleDeleteEvent}
          onEditEvent={handleEditEvent}
        />
      )}

      {modal.kind === "delete" && (
        <DeleteEventDialog
          key={modal.event.id}
          event={modal.event}
          open
          onOpenChange={(open) => {
            if (!open) closeModal();
          }}
          onDeleted={() => {
            void handleEventDeleted();
          }}
        />
      )}

      {modal.kind === "create" && selectedDate && (
        <Dialog open onOpenChange={(open) => !open && closeModal()}>
          <DialogContent className="z-[60] flex max-h-[calc(100dvh-32px-env(safe-area-inset-bottom))] flex-col gap-3 overflow-hidden rounded-2xl p-5 sm:max-w-lg">
            <div className="shrink-0 pr-8">
              <DialogTitle>Новое событие</DialogTitle>
              <DialogDescription>Добавьте момент в календарь</DialogDescription>
            </div>
            <CreateEventForm
              scope={scope}
              date={selectedDate}
              onCancel={closeModal}
              onSubmit={handleCreateEvent}
            />
          </DialogContent>
        </Dialog>
      )}

      {modal.kind === "edit" && (
        <Dialog open onOpenChange={(open) => !open && closeModal()}>
          <DialogContent className="z-[60] max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-2xl p-5">
            <div className="pr-8">
              <DialogTitle>Редактировать событие</DialogTitle>
              <DialogDescription>Измените детали события</DialogDescription>
            </div>

            <EditEventForm
              event={modal.event}
              onCancel={closeModal}
              onSubmit={handleEventUpdated}
            />

            {updating && (
              <p className="mt-3 text-center text-xs text-muted-foreground">Сохраняем изменения…</p>
            )}
          </DialogContent>
        </Dialog>
      )}
    </main>
  );
}
