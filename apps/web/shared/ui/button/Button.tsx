import * as React from "react";
import { Slot, Slottable } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";

import { cn } from "@/shared/lib/cn";

const appearance =
  "inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] text-sm font-semibold whitespace-nowrap [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0";
export const buttonVariants = cva(
  "cursor-pointer outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: `${appearance} bg-primary text-primary-foreground shadow-soft hover:brightness-105`,
        secondary: `${appearance} border border-border bg-card text-foreground shadow-soft hover:bg-muted`,
        ghost: `${appearance} bg-transparent text-foreground hover:bg-muted`,
        icon: `${appearance} bg-transparent text-foreground hover:bg-muted`,
        destructive: `${appearance} bg-destructive/10 text-destructive hover:bg-destructive/20`,
        link: `${appearance} text-primary underline-offset-4 hover:underline`,
        plain: "",
      },
      size: {
        none: "",
        sm: "min-h-11 shrink-0 px-3",
        md: "h-[var(--control-md)] min-h-[var(--control-md)] shrink-0 px-4",
        lg: "h-[var(--control-lg)] min-h-[var(--control-lg)] shrink-0 px-6",
      },
      fullWidth: { true: "w-full", false: "" },
      iconOnly: { true: "aspect-square p-0", false: "" },
    },
    defaultVariants: { variant: "primary", size: "md", fullWidth: false, iconOnly: false },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  ref?: React.Ref<HTMLButtonElement>;
  asChild?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  loading?: boolean;
}

export function Button({
  className,
  variant,
  size,
  fullWidth,
  iconOnly,
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
      className={cn(buttonVariants({ variant, size, fullWidth, iconOnly }), className)}
      type={asChild ? undefined : (type ?? "button")}
      disabled={disabled || loading}
      aria-disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <Loader2 className="size-5 motion-safe:animate-spin" aria-hidden="true" />
      ) : (
        leftIcon
      )}
      <Slottable>{children}</Slottable>
      {!loading && !iconOnly && rightIcon}
    </Component>
  );
}
