import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";

import { cn } from "@/shared/lib/cn";

import {
  type CardContentProps,
  type CardDescriptionProps,
  type CardFooterProps,
  type CardHeaderProps,
  type CardProps,
  type CardTitleProps,
} from "./card.types";

export const cardVariants = cva(
  "rounded-3xl border border-border/60 bg-card text-card-foreground shadow-soft transition-[border-color,box-shadow] duration-200",
  {
    variants: {
      padding: {
        sm: "p-4",
        md: "p-6",
        lg: "p-8",
      },
      variant: {
        default: "",
        outline: "shadow-none",
        glass: "bg-card/70 backdrop-blur-xl",
      },
    },
    defaultVariants: {
      padding: "md",
      variant: "default",
    },
  },
);

export function Card({ className, padding, variant, asChild = false, ...props }: CardProps) {
  const Component = asChild ? Slot : "div";
  return <Component className={cn(cardVariants({ padding, variant }), className)} {...props} />;
}

export function CardHeader({ className, ...props }: CardHeaderProps) {
  return <div className={cn("flex flex-col gap-2", className)} {...props} />;
}

export function CardTitle({ className, ...props }: CardTitleProps) {
  return <h3 className={cn("text-xl font-semibold tracking-tight", className)} {...props} />;
}

export function CardDescription({ className, ...props }: CardDescriptionProps) {
  return <p className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

export function CardContent({ className, ...props }: CardContentProps) {
  return <div className={cn("pt-3", className)} {...props} />;
}

export function CardFooter({ className, ...props }: CardFooterProps) {
  return <div className={cn("flex items-center justify-between pt-6", className)} {...props} />;
}
