"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Cake, CalendarDays, ChevronLeft, Heart, Plus, Sparkles } from "lucide-react";

import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { typeMeta } from "@/widgets/calendar/model/constants";
import { EmptyDayMessage } from "@/widgets/calendar/ui/EmptyDayMessage";
import { EventCard } from "@/widgets/calendar/ui/EventCard";

import { CalendarEvent, EventRepeat, EventScope, EventType } from "../types";

interface SelectedDayDrawerProps {
  date: Date | null;
  events: CalendarEvent[];
  scope: EventScope;
  currentUserId?: string;

  onClose: () => void;
  onAddEvent: () => void;
  onEventClick: (event: CalendarEvent) => void;
  onEditEvent?: (event: CalendarEvent) => void;
  onDeleteEvent?: (event: CalendarEvent) => void;
}

function DayIllustration({ type }: { type: EventType }) {
  switch (type) {
    case EventType.BIRTHDAY:
      return <Cake className="h-10 w-10 text-pink-400" />;

    case EventType.ANNIVERSARY:
      return <Sparkles className="h-10 w-10 text-amber-400" />;

    case EventType.OTHER:
      return <CalendarDays className="h-10 w-10 text-sky-400" />;

    case EventType.DATE:
    default:
      return <Heart className="h-10 w-10 fill-rose-400 text-rose-400" />;
  }
}

function getRepeatLabel(repeat: EventRepeat): string | null {
  switch (repeat) {
    case EventRepeat.DAILY:
      return "Каждый день";

    case EventRepeat.WEEKLY:
      return "Каждую неделю";

    case EventRepeat.MONTHLY:
      return "Каждый месяц";

    case EventRepeat.YEARLY:
      return "Каждый год";

    case EventRepeat.NONE:
    default:
      return null;
  }
}

function getEventTimeLabel(event: CalendarEvent): string {
  if (event.allDay) {
    return "Весь день";
  }

  const start = format(new Date(event.startAt), "HH:mm");

  if (!event.endAt) {
    return start;
  }

  const end = format(new Date(event.endAt), "HH:mm");

  return `${start} — ${end}`;
}

export function SelectedDayDrawer({
  date,
  events,
  scope,
  currentUserId,
  onClose,
  onAddEvent,
  onEventClick,
  onEditEvent,
  onDeleteEvent,
}: SelectedDayDrawerProps) {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  if (!date) {
    return null;
  }

  const selectedMeta = selectedEvent ? typeMeta[selectedEvent.type] : undefined;

  const isEventOwner =
    selectedEvent !== null &&
    currentUserId !== undefined &&
    selectedEvent.createdById === currentUserId;

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    onEventClick(event);
  };

  const handleBack = () => {
    setSelectedEvent(null);
  };

  const handleClose = () => {
    setSelectedEvent(null);
    onClose();
  };

  const firstEventType = events[0]?.type;

  const repeatLabel = selectedEvent ? getRepeatLabel(selectedEvent.repeat) : null;

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
        onClick={handleClose}
        aria-hidden="true"
      />

      <aside
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 flex h-[88dvh]",
          "flex-col rounded-t-3xl bg-background shadow-2xl",
          "transition-transform duration-300",
          "lg:static lg:h-full lg:w-[380px]",
          "lg:rounded-none lg:border-l lg:shadow-none",
        )}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between px-5 pt-5">
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<ChevronLeft className="h-5 w-5" />}
            onClick={selectedEvent ? handleBack : handleClose}
            className="h-9 w-9 rounded-full"
            aria-label={selectedEvent ? "Назад" : "Закрыть"}
          />
        </div>

        {/* EVENT DETAILS */}
        {selectedEvent ? (
          <>
            <div
              className={cn(
                "mx-5 mt-2 flex h-32 items-center justify-center rounded-2xl",
                selectedMeta?.bg,
              )}
            >
              <DayIllustration type={selectedEvent.type} />
            </div>

            <ScrollArea className="flex-1">
              <div className="px-5 pt-5">
                <p className={cn("text-xs font-medium", selectedMeta?.color)}>
                  {selectedMeta?.label}
                </p>

                <h2 className="mt-1 text-2xl font-bold tracking-tight">{selectedEvent.title}</h2>

                {selectedEvent.description && (
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {selectedEvent.description}
                  </p>
                )}

                {/* EVENT META */}
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-muted px-3 py-1 text-xs">
                    {scope === EventScope.PERSONAL ? "Мой" : "Наш"}
                  </span>

                  <span className="rounded-full bg-muted px-3 py-1 text-xs">
                    {getEventTimeLabel(selectedEvent)}
                  </span>

                  {repeatLabel && (
                    <span className="rounded-full bg-muted px-3 py-1 text-xs">{repeatLabel}</span>
                  )}
                </div>

                {/* CREATOR */}
                {selectedEvent.creator && (
                  <div className="mt-5 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-muted text-xs font-medium">
                      {selectedEvent.creator.avatarUrl ? (
                        <img
                          src={selectedEvent.creator.avatarUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        (selectedEvent.creator.name?.charAt(0).toUpperCase() ?? "?")
                      )}
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">Создал</p>

                      <p className="text-sm font-medium">
                        {selectedEvent.creator.name ?? "Участник"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* ACTIONS */}
            {isEventOwner && (
              <div className="mt-auto space-y-2 border-t bg-background p-5">
                {onEditEvent && (
                  <Button className="w-full" onClick={() => onEditEvent(selectedEvent)}>
                    Редактировать
                  </Button>
                )}

                {onDeleteEvent && (
                  <Button
                    variant="ghost"
                    className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => onDeleteEvent(selectedEvent)}
                  >
                    Удалить
                  </Button>
                )}
              </div>
            )}
          </>
        ) : (
          <>
            {/* DAY ILLUSTRATION */}
            <div
              className={cn(
                "mx-5 mt-2 flex h-28 items-center justify-center rounded-2xl",
                firstEventType ? typeMeta[firstEventType].bg : "bg-muted/40",
              )}
            >
              {firstEventType ? (
                <DayIllustration type={firstEventType} />
              ) : (
                <CalendarDays className="h-10 w-10 text-muted-foreground/40" />
              )}
            </div>

            {/* DATE */}
            <div className="px-5 pt-4">
              <h2 className="text-2xl font-bold tracking-tight">
                {format(date, "d MMMM", {
                  locale: ru,
                })}
              </h2>

              <p className="text-sm capitalize text-muted-foreground">
                {format(date, "EEEE", {
                  locale: ru,
                })}
              </p>

              {events.length > 0 && (
                <p className="mt-3 text-sm text-muted-foreground">
                  {events.length}{" "}
                  {events.length === 1 ? "событие" : events.length < 5 ? "события" : "событий"}
                </p>
              )}
            </div>

            {/* EVENTS */}
            <ScrollArea className="flex-1 px-5 py-3">
              {events.length === 0 ? (
                <EmptyDayMessage date={date} />
              ) : (
                <div className="space-y-3">
                  {events.map((event) => (
                    <EventCard
                      key={`${event.id}-${event.startAt}`}
                      event={event}
                      onClick={handleEventClick}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* ADD */}
            <div className="border-t bg-background p-5">
              <Button className="h-12 w-full gap-2 rounded-xl" onClick={onAddEvent}>
                <Plus className="h-5 w-5" />
                Добавить событие
              </Button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
