"use client";

import { ChoiceButton } from "@/shared/ui/button/ChoiceButton";

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
        <ChoiceButton
          selected={active === f.key}
          key={f.key}
          type="button"
          onClick={() => onChange(f.key)}
          className="shrink-0 rounded-full"
        >
          {f.label}
        </ChoiceButton>
      ))}
    </div>
  );
}
