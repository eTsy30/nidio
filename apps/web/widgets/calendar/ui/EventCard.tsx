"use client";

import { cn } from "@/shared/lib/cn";

import { typeIcon, typeMeta } from "../model/constants";
import { type CalendarEvent } from "../model/types";
import { formatEventTime } from "../model/utils";

interface EventCardProps {
  event: CalendarEvent;
  compact?: boolean;
  onClick?: (event: CalendarEvent) => void;
}

export function EventCard({ event, compact = false, onClick }: EventCardProps) {
  const meta = typeMeta[event.type];
  const Icon = typeIcon[event.type];

  const time = formatEventTime(event.startAt, event.endAt);

  return (
    <button
      type="button"
      onClick={() => onClick?.(event)}
      className={cn(
        "w-full text-left transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
        compact ? "flex items-center gap-1 rounded-full px-2 py-1 text-[10px]" : "rounded-2xl p-3",
        meta.bg,
        onClick && "cursor-pointer hover:scale-[0.99] hover:opacity-90",
      )}
    >
      <span
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full",
          compact ? "h-4 w-4" : "h-8 w-8 bg-white/80",
        )}
      >
        <Icon className={cn(compact ? "h-2.5 w-2.5" : "h-4 w-4", meta.color)} />
      </span>

      <span className="min-w-0 flex-1">
        <span
          className={cn(
            "block truncate font-medium",
            compact ? "text-[10px]" : "text-sm",
            meta.color,
          )}
        >
          {event.title}
        </span>

        {!compact && <span className="mt-1 block text-xs text-muted-foreground">{time}</span>}
      </span>
    </button>
  );
}
