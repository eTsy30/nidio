"use client";

import { typeMeta } from "@/features/calendar/model/constants";
import { EventType } from "@/features/calendar/types";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button/Button";

interface EventFilterProps {
  value: EventType | "ALL";
  onChange: (value: EventType | "ALL") => void;
}

export function EventFilter({ value, onChange }: EventFilterProps) {
  return (
    <div className="w-56 rounded-2xl border bg-background p-2 shadow-floating">
      <p className="px-2 py-1 text-xs font-medium text-muted-foreground">Фильтр событий</p>

      <Button
        variant="ghost"
        size="sm"
        type="button"
        aria-pressed={value === "ALL"}
        onClick={() => onChange("ALL")}
        className={cn(
          "mt-1 flex w-full justify-start rounded-xl px-3 py-2 text-left text-sm",
          value === "ALL" ? "bg-muted font-medium" : "hover:bg-muted/60",
        )}
      >
        Все события
      </Button>

      {Object.values(EventType).map((type) => (
        <Button
          variant="ghost"
          size="sm"
          key={type}
          type="button"
          aria-pressed={value === type}
          onClick={() => onChange(type)}
          className={cn(
            "flex w-full justify-start items-center gap-2 rounded-xl px-3 py-2 text-left text-sm",
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
        </Button>
      ))}
    </div>
  );
}
