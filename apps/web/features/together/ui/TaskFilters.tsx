"use client";

import { cn } from "@/shared/lib/cn";

import { TaskFilter } from "../model/task.types";

const filters: { key: TaskFilter; label: string }[] = [
  { key: "all", label: "Все" },
  { key: "me", label: "Мои" },
  { key: "partner", label: "Партнёра" },
  { key: "together", label: "Вместе" },
  { key: "rotate", label: "По очереди" },
];

interface TaskFiltersProps {
  active: TaskFilter;
  onChange: (filter: TaskFilter) => void;
}

export function TaskFilters({ active, onChange }: TaskFiltersProps) {
  return (
    <div className="flex shrink-0 gap-2 overflow-x-auto pb-2">
      {filters.map((f) => (
        <button
          key={f.key}
          type="button"
          aria-pressed={active === f.key}
          onClick={() => onChange(f.key)}
          className={cn(
            "min-h-11 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap",
            "transition-[background-color,color,box-shadow,transform]",
            "duration-150 ease-out select-none",
            active === f.key
              ? "bg-primary text-primary-foreground shadow-soft"
              : "bg-muted text-muted-foreground hover:bg-muted/80",
          )}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
