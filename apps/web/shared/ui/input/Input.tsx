import React, { forwardRef, InputHTMLAttributes, ReactNode, useId } from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/shared/lib/cn";

const inputVariants = cva(
  [
    "inline-flex w-full items-center",
    "rounded-[var(--radius-md)]",
    "transition-[background-color,border-color,color,box-shadow,transform]",
    "duration-150 ease-out",
    "outline-none",
    "shrink-0",
    "placeholder:text-muted-foreground",
    "disabled:pointer-events-none",
    "disabled:opacity-50",
    "focus-visible:ring-2",
    "focus-visible:ring-ring/40",
    "focus-visible:ring-offset-2",
    "focus-visible:ring-offset-background",
  ].join(" "),
  {
    variants: {
      size: {
        sm: "h-[var(--control-sm)] px-3",
        md: "h-[var(--control-md)] px-4",
        lg: "h-[var(--control-lg)] px-6",
      },
      variant: {
        default:
          "bg-background border border-input shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-floating)] focus-visible:border-primary",
        filled: "bg-muted border border-transparent hover:bg-muted/80 shadow-[var(--shadow-soft)]",
        ghost: "bg-transparent border border-transparent hover:bg-card",
      },
      state: {
        default: "",
        success: "border-success focus-visible:ring-success",
        warning: "border-warning focus-visible:ring-warning",
        error: "border-destructive focus-visible:ring-destructive",
      },
      fullWidth: {
        true: "w-full",
        false: "",
      },
    },

    defaultVariants: {
      size: "md",
      variant: "default",
      state: "default",
      fullWidth: true,
    },
  },
);

export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> &
  VariantProps<typeof inputVariants> & {
    leftIcon?: ReactNode;
    rightIcon?: ReactNode;
    label?: ReactNode;
    description?: ReactNode;
    error?: ReactNode;
  };

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      size = "md",
      variant,
      fullWidth,
      leftIcon,
      rightIcon,
      label,
      required,
      description,
      error,
      state,
      id,
      ...props
    },
    ref,
  ) => {
    const hasError = state === "error";

    const generatedId = useId();
    const inputId = id ?? generatedId;

    const leftPad = leftIcon ? "pl-11" : "";
    const rightPad = rightIcon ? "pr-11" : "";

    return (
      <div className={cn("flex flex-col gap-2", fullWidth && "w-full")}>
        {label && (
          <label
            htmlFor={inputId}

            className="flex items-center gap-1 text-sm font-semibold leading-5 text-foreground"
          >
            <span>{label}</span>

            {required && (
              <span
                aria-hidden="true"

                className="text-destructive"
              >
                *
              </span>
            )}
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <span className="absolute left-4 flex items-center pointer-events-none text-muted-foreground">
              {leftIcon}
            </span>
          )}
          <input
            id={inputId}
            ref={ref}
            required={required}
            className={cn(
              inputVariants({ size, variant, fullWidth, state }),
              leftPad,
              rightPad,
              className,
            )}
            aria-invalid={hasError}
            {...props}
          />
          {rightIcon && <div className="absolute right-4 flex items-center">{rightIcon}</div>}
        </div>
        {error ? (
          <p className="text-sm leading-6 text-destructive">{error}</p>
        ) : description ? (
          <p className="text-sm leading-6 text-muted-foreground">{description}</p>
        ) : null}
      </div>
    );
  },
);
Input.displayName = "Input";
