"use client";
import { type SelectHTMLAttributes, useId } from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/shared/lib/cn";

type Props = SelectHTMLAttributes<HTMLSelectElement> & { label: string };

/** Native picker keeps touch and keyboard selection familiar on mobile. */
export function Select({ label, id, className, children, ...props }: Props) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  return (
    <div className="min-w-0 space-y-2">
      <label htmlFor={selectId} className="block text-sm font-semibold">
        {label}
      </label>
      <div className="relative">
        <select
          id={selectId}
          className={cn(
            "h-11 w-full min-w-0 appearance-none rounded-2xl border border-input bg-background py-2 pl-3 pr-9 text-base text-foreground shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:opacity-50",
            className,
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        />
      </div>
    </div>
  );
}
