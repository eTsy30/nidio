"use client";

import { Layers, Repeat, User, UserRound, Users } from "lucide-react";

import { IconSelect } from "@/shared/ui/select/IconSelect";

import { TaskFilter } from "../model/task.types";
const filters = [
  { value: "all", label: "Все задачи", icon: <Layers className="size-4" /> },
  { value: "me", label: "Мои", icon: <User className="size-4" /> },
  { value: "partner", label: "Партнёра", icon: <UserRound className="size-4" /> },
  { value: "together", label: "Вместе", icon: <Users className="size-4" /> },
  { value: "rotate", label: "По очереди", icon: <Repeat className="size-4" /> },
];

interface TaskFiltersProps {
  active: TaskFilter;
  onChange: (filter: TaskFilter) => void;
}

export function TaskFilters({ active, onChange }: TaskFiltersProps) {
  return (
    <IconSelect
      label="Показать задачи"
      value={active}
      onChange={(value) => onChange(value as TaskFilter)}
      options={filters}
    />
  );
}
