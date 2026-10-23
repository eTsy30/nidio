"use client";
import { type ReactNode, useId } from "react";
import { Select } from "@base-ui/react/select";
import { Check, ChevronDown } from "lucide-react";

import { fieldClassName } from "../input/InputControl";

export function IconSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string; icon: ReactNode }[];
}) {
  const id = useId();
  const selected = options.find((option) => option.value === value);
  return (
    <div className="min-w-0 space-y-2">
      <label id={`${id}-label`} htmlFor={id} className="block text-sm font-semibold">
        {label}
      </label>
      <Select.Root
        value={value}
        onValueChange={(next) => {
          if (next !== null) onChange(next);
        }}
        items={options}
      >
        <Select.Trigger
          id={id}
          aria-labelledby={`${id}-label`}
          className={`${fieldClassName} flex h-[var(--control-md)] items-center gap-2 px-3 text-left`}
        >
          <span aria-hidden="true" className="shrink-0">
            {selected?.icon}
          </span>
          <Select.Value className="min-w-0 flex-1 truncate" />
          <Select.Icon>
            <ChevronDown className="size-4" />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner sideOffset={6} alignItemWithTrigger={false} className="z-[60]">
            <Select.Popup className="max-h-[var(--available-height)] w-[var(--anchor-width)] min-w-52 overflow-y-auto rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-lg">
              <Select.List>
                {options.map((option) => (
                  <Select.Item
                    key={option.value}
                    value={option.value}
                    className="flex min-h-11 cursor-default items-center gap-3 rounded-sm px-3 py-2 text-sm outline-none data-highlighted:bg-muted"
                  >
                    <span aria-hidden="true" className="shrink-0">
                      {option.icon}
                    </span>
                    <Select.ItemText className="flex-1">{option.label}</Select.ItemText>
                    <Select.ItemIndicator>
                      <Check className="size-4" />
                    </Select.ItemIndicator>
                  </Select.Item>
                ))}
              </Select.List>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    </div>
  );
}
