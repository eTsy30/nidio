"use client";

import { cn } from "@/shared/lib/cn";
import { typeMeta } from "@/widgets/calendar/model/constants";
import { EventType } from "@/widgets/calendar/model/types";

interface EventFilterProps {
  value: EventType | "ALL";
  onChange: (value: EventType | "ALL") => void;
}

export function EventFilter({ value, onChange }: EventFilterProps) {
  return (
    <div className="w-56 rounded-2xl border bg-background p-2 shadow-xl">
      <p className="px-2 py-1 text-xs font-medium text-muted-foreground">Фильтр событий</p>

      <button
        type="button"
        onClick={() => onChange("ALL")}
        className={cn(
          "mt-1 flex w-full rounded-xl px-3 py-2 text-left text-sm",
          value === "ALL" ? "bg-muted font-medium" : "hover:bg-muted/60",
        )}
      >
        Все события
      </button>

      {Object.values(EventType).map((type) => (
        <button
          key={type}
          type="button"
          onClick={() => onChange(type)}
          className={cn(
            "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm",
            value === type ? "bg-muted font-medium" : "hover:bg-muted/60",
          )}
        >
          <span
            className="h-2 w-2 rounded-full"
            style={{
              backgroundColor: typeMeta[type].border,
            }}
          />

          {typeMeta[type].label}
        </button>
      ))}
    </div>
  );
}
