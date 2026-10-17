import { format, isSameDay } from "date-fns";
import { ru } from "date-fns/locale";
import { Pencil, Trash2 } from "lucide-react";

import { typeMeta } from "@/features/calendar/model/constants";
import type { CalendarEvent } from "@/features/calendar/types";
import { Button } from "@/shared/ui";
import { Card } from "@/shared/ui/card/Card";

type Props = {
  event: CalendarEvent;
  editable: boolean;
  onEdit: (event: CalendarEvent) => void;
  onDelete: (event: CalendarEvent) => void;
};
export function DayEventCard({ event, editable, onEdit, onDelete }: Props) {
  const start = new Date(event.startAt);
  const end = event.endAt ? new Date(event.endAt) : null;
  const time = event.allDay
    ? "Весь день"
    : `${format(start, "HH:mm")}${end ? ` — ${format(end, isSameDay(start, end) ? "HH:mm" : "d MMM, HH:mm", { locale: ru })}` : ""}`;
  return (
    <Card padding="sm" variant="outline" className="flex items-start gap-2 rounded-2xl sm:gap-4">
      <div
        className="min-w-0 flex-1 border-l-2 pl-3"
        style={{ borderColor: typeMeta[event.type].border }}
      >
        <p className="text-xs font-medium text-muted-foreground">{time}</p>
        <h3 className="mt-1 break-words text-base font-semibold">{event.title}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{typeMeta[event.type].label}</p>
        {event.description && (
          <p className="mt-2 whitespace-pre-wrap break-words text-sm text-muted-foreground">
            {event.description}
          </p>
        )}
      </div>
      {editable && (
        <div className="flex shrink-0 gap-1">
          <Button
            variant="ghost"
            iconOnly
            className="size-11 text-muted-foreground"
            aria-label={`Изменить событие «${event.title}»`}
            title="Изменить"
            onClick={() => onEdit(event)}
            leftIcon={<Pencil />}
          />
          <Button
            variant="ghost"
            iconOnly
            className="size-11 text-muted-foreground hover:text-destructive"
            aria-label={`Удалить событие «${event.title}»`}
            title="Удалить"
            onClick={() => onDelete(event)}
            leftIcon={<Trash2 />}
          />
        </div>
      )}
    </Card>
  );
}
