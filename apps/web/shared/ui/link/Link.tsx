import { type ReactNode } from "react";
import NextLink, { type LinkProps } from "next/link";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/shared/lib/cn";

const linkVariants = cva(
  [
    "inline-flex items-center gap-1",
    "transition-colors duration-150 ease-out",
    "outline-none",
    "rounded-[var(--radius-sm)]",

    "focus-visible:ring-2",
    "focus-visible:ring-ring/40",
    "focus-visible:ring-offset-2",
    "focus-visible:ring-offset-background",
  ].join(" "),
  {
    variants: {
      variant: {
        default: "text-foreground hover:text-primary",
        primary: "text-primary hover:opacity-80",
        muted: "text-muted-foreground hover:text-foreground",
        destructive: "text-destructive hover:opacity-80",
      },

      size: {
        sm: "text-sm",
        md: "text-base",
        lg: "text-lg",
      },

      underline: {
        true: "underline underline-offset-4",
        false: "no-underline",
      },
    },

    defaultVariants: {
      variant: "default",
      size: "md",
      underline: false,
    },
  },
);

export interface AppLinkProps extends LinkProps, VariantProps<typeof linkVariants> {
  children?: ReactNode;
  className?: string;
  newWindow?: boolean;
}

export function Link({
  children,
  className,
  variant,
  size,
  underline,
  newWindow = false,
  ...props
}: AppLinkProps) {
  return (
    <NextLink
      className={cn(linkVariants({ variant, size, underline }), className)}
      rel={newWindow ? "noopener noreferrer" : undefined}
      target={newWindow ? "_blank" : undefined}
      {...props}
    >
      {children}
    </NextLink>
  );
}
