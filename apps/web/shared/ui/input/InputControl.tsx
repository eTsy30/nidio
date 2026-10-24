import { forwardRef, type InputHTMLAttributes } from "react";

import { cn } from "@/shared/lib/cn";

export const fieldClassName =
  "min-w-0 w-full rounded-[var(--radius-md)] border border-input bg-background text-base text-foreground shadow-soft placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive";

export const InputControl = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        type === "checkbox" || type === "radio"
          ? "size-5 shrink-0 accent-primary focus-visible:ring-2 focus-visible:ring-ring/40 disabled:opacity-50"
          : `${fieldClassName} h-[var(--control-md)] px-3`,
        (type === "date" || type === "time" || type === "datetime-local") && "temporal-input",
        className,
      )}
      {...props}
    />
  ),
);
InputControl.displayName = "InputControl";
