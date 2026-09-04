"use client";

import { cn } from "@/shared/lib/cn";

import { AssigneeType } from "../model/task.types";

interface AssigneeSelectorProps {
  value: AssigneeType;
  onChange: (value: AssigneeType) => void;
  disabled?: boolean;
}

const options: { value: AssigneeType; label: string }[] = [
  { value: "ME", label: "Я" },
  { value: "PARTNER", label: "Партнёр" },
  { value: "BOTH", label: "Вместе" },
];

export function AssigneeSelector({ value, onChange, disabled }: AssigneeSelectorProps) {
  return (
    <div className="flex gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          disabled={disabled}
          onClick={() => onChange(opt.value)}
          className={cn(
            "flex-1 h-[var(--control-md)] rounded-[var(--radius-md)] text-sm font-semibold",
            "border transition-[background-color,color,border-color,box-shadow,transform]",
            "duration-150 ease-out select-none",
            "active:scale-[0.98]",
            "disabled:opacity-50 disabled:pointer-events-none",
            value === opt.value
              ? "bg-primary text-primary-foreground border-primary shadow-[0_10px_30px_rgb(175_75_43_/_0.28)]"
              : "bg-card text-foreground border-border hover:bg-muted",
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
