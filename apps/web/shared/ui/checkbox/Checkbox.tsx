"use client";

import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox";
import { cva, type VariantProps } from "class-variance-authority";
import { CheckIcon } from "lucide-react";

import { cn } from "@/shared/lib/cn";

const checkboxVariants = cva(
  [
    "peer relative flex shrink-0 items-center justify-center",
    "rounded-[var(--radius-sm)]",
    "border border-input",
    "bg-background",
    "shadow-[var(--shadow-soft)]",
    "transition-[background-color,border-color,color,box-shadow,transform]",
    "duration-150 ease-out",
    "outline-none",

    "hover:shadow-[var(--shadow-floating)]",

    "focus-visible:ring-2",
    "focus-visible:ring-ring/40",
    "focus-visible:ring-offset-2",
    "focus-visible:ring-offset-background",

    "disabled:pointer-events-none",
    "disabled:opacity-50",

    "data-checked:text-primary-foreground",
  ].join(" "),
  {
    variants: {
      size: {
        sm: "size-4",
        md: "size-[18px]",
        lg: "size-5",
      },

      state: {
        default: ["data-checked:border-primary", "data-checked:bg-primary"].join(" "),

        success: [
          "data-checked:border-success",
          "data-checked:bg-success",
          "focus-visible:ring-success/30",
        ].join(" "),

        warning: [
          "data-checked:border-warning",
          "data-checked:bg-warning",
          "focus-visible:ring-warning/30",
        ].join(" "),

        error: [
          "border-destructive",
          "focus-visible:ring-destructive/30",
          "data-checked:border-destructive",
          "data-checked:bg-destructive",
        ].join(" "),
      },
    },

    defaultVariants: {
      size: "md",
      state: "default",
    },
  },
);

export interface CheckboxProps
  extends CheckboxPrimitive.Root.Props, VariantProps<typeof checkboxVariants> {
  children?: React.ReactNode;
}

export function Checkbox({
  className,

  size,

  state,

  children,

  ...props
}: CheckboxProps) {
  return (
    <label className="inline-flex w-full items-start justify-start gap-3 cursor-pointer select-none">
      <CheckboxPrimitive.Root
        data-slot="checkbox"

        className={cn(
          checkboxVariants({ size, state }),

          "shrink-0 self-start",

          className,
        )}

        {...props}
      >
        <CheckboxPrimitive.Indicator
          data-slot="checkbox-indicator"

          className="flex items-center justify-center text-current"
        >
          <CheckIcon className="size-4" strokeWidth={3} />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>

      {children && <span className="description text-foreground">{children}</span>}
    </label>
  );
}
