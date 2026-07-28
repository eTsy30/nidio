import * as React from "react";
import { Slot, Slottable } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/shared/lib/cn";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2",
    "whitespace-nowrap",
    "rounded-[var(--radius-md)]",
    "text-primary-foreground",
    "transition-[background-color,border-color,color,box-shadow,transform]",
    "duration-150 ease-out",
    "select-none",
    "font-semibold",
    "text-sm",
    "leading-5",
    "text-foreground",
    "cursor-pointer",
    "outline-none",
    "shrink-0",
    "focus-visible:ring-2",
    "focus-visible:ring-ring/40",
    "focus-visible:ring-offset-2",
    "focus-visible:ring-offset-background",
    "hover:-translate-y-px",
    "active:translate-y-0",
    "active:scale-[0.98]",
    "disabled:pointer-events-none",
    "disabled:opacity-50",
    "[&_svg]:pointer-events-none",
    "[&_svg]:size-5",
    "[&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        primary: [
          "bg-primary",
          "text-primary-foreground",
          "shadow-[0_10px_30px_rgb(175_75_43_/_0.28)]",

          "hover:brightness-[1.03]",

          "hover:shadow-[0_18px_40px_rgb(175_75_43_/_0.36)]",
        ].join(" "),

        secondary: [
          "bg-card",
          "text-secondary-foreground",
          "border",
          "border-border",
          "shadow-[0_6px_20px_rgb(0_0_0_/_0.05)]",
          "hover:bg-surface",
          "hover:shadow-[0_14px_36px_rgb(0_0_0_/_0.08)]",
        ].join(" "),

        ghost: ["bg-transparent", "hover:bg-surface"].join(" "),

        icon: ["bg-transparent", "hover:bg-surface", "p-0"].join(" "),
      },

      size: {
        sm: "h-[var(--control-sm)] px-2",
        md: "h-[var(--control-md)] px-4",
        lg: "h-[var(--control-lg)] px-6",
      },

      fullWidth: {
        true: "w-full",
        false: "",
      },

      iconOnly: {
        true: "aspect-square px-0",
        false: "",
      },
    },

    compoundVariants: [
      {
        variant: "icon",
        iconOnly: true,
        className: "aspect-square",
      },
    ],

    defaultVariants: {
      variant: "primary",
      size: "md",
      fullWidth: false,
      iconOnly: false,
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  loading?: boolean;
  iconOnly?: boolean;
}

export function Button({
  className,
  variant,
  size,
  fullWidth,
  iconOnly = false,
  asChild = false,
  leftIcon,
  rightIcon,
  loading = false,
  children,
  disabled,
  type,
  ...props
}: ButtonProps) {
  const Component = asChild ? Slot : "button";

  return (
    <Component
      className={cn(
        buttonVariants({
          variant,
          size,
          fullWidth,
          iconOnly,
        }),
        className,
      )}
      type={asChild ? undefined : (type ?? "button")}
      disabled={disabled || loading}
      aria-disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {loading ? (
        <svg className="size-5 animate-spin " viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity=".2" strokeWidth="4" />
          <path
            d="M22 12a10 10 0 0 0-10-10"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </svg>
      ) : (
        leftIcon
      )}

      {!iconOnly && <Slottable>{children}</Slottable>}

      {!loading && !iconOnly && rightIcon}
    </Component>
  );
}

export { buttonVariants };
