import { format } from "date-fns";
import { ru } from "date-fns/locale";

import type { CalendarEvent } from "@/features/calendar/types";
import { Button } from "@/shared/ui";

import { DayEventCard } from "./DayEventCard";

interface Props {
  date: Date;
  events: CalendarEvent[];
  currentUserId: string | undefined;
  onAdd: () => void;
  onEdit: (event: CalendarEvent) => void;
  onDelete: (event: CalendarEvent) => void;
}

export function DayEvents({ date, events, currentUserId, onAdd, onEdit, onDelete }: Props) {
  return (
    <section aria-labelledby="day-events-title" className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 id="day-events-title" className="text-base font-semibold">
            События дня
          </h2>
          <p className="text-sm text-muted-foreground">{format(date, "d MMMM", { locale: ru })}</p>
        </div>
        <Button variant="ghost" className="text-primary" data-calendar-add onClick={onAdd}>
          Добавить
        </Button>
      </div>
      <div aria-live="polite" className="space-y-3">
        {!events.length && (
          <p className="py-6 text-center text-sm leading-relaxed text-muted-foreground">
            На этот день пока нет событий.
            <br />
            Добавьте первое — оно появится здесь.
          </p>
        )}
        {events.map((event) => (
          <DayEventCard
            key={`${event.id}-${event.startAt}`}
            event={event}
            editable={event.createdById === currentUserId}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </section>
  );
}
