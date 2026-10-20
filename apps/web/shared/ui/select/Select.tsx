"use client";
import { forwardRef, type SelectHTMLAttributes, useId } from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/shared/lib/cn";

import { fieldClassName } from "../input/InputControl";

type Props = SelectHTMLAttributes<HTMLSelectElement> & { label?: string };

/** Omit label only when an enclosing label or aria-label names the control. */
export const Select = forwardRef<HTMLSelectElement, Props>(
  ({ label, id, className, children, ...props }, ref) => {
    const generatedId = useId();
    const selectId = id ?? generatedId;
    return (
      <div className="min-w-0 space-y-2">
        {label && (
          <label htmlFor={selectId} className="block text-sm font-semibold">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            {...props}
            ref={ref}
            id={selectId}
            className={cn(
              fieldClassName,
              "h-[var(--control-md)] appearance-none py-2 pl-3",
              className,
              "pr-10",
            )}
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
  },
);
Select.displayName = "Select";
