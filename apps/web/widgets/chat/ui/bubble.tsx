import * as React from "react";
import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/shared/lib/cn";

function BubbleGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="bubble-group"
      className={cn("flex min-w-0 flex-col gap-0.5", className)}
      {...props}
    />
  );
}

const bubbleVariants = cva(
  "group/bubble relative flex w-fit min-w-0 flex-col gap-0.5 animate-fade-up transition-all duration-200",
  {
    variants: {
      variant: {
        default:
          "*:data-[slot=bubble-content]:bg-primary *:data-[slot=bubble-content]:text-primary-foreground *:data-[slot=bubble-content]:shadow-soft",
        secondary:
          "*:data-[slot=bubble-content]:bg-card *:data-[slot=bubble-content]:border-border *:data-[slot=bubble-content]:text-foreground *:data-[slot=bubble-content]:shadow-soft",
        muted: "*:data-[slot=bubble-content]:bg-muted",
        tinted:
          "*:data-[slot=bubble-content]:bg-[oklch(from_var(--primary)_0.93_calc(c*0.4)_h)] *:data-[slot=bubble-content]:text-foreground dark:*:data-[slot=bubble-content]:bg-[oklch(from_var(--primary)_0.3_calc(c*0.4)_h)]",
        outline:
          "*:data-[slot=bubble-content]:border-border *:data-[slot=bubble-content]:bg-background",
        ghost:
          "border-none *:data-[slot=bubble-content]:rounded-none *:data-[slot=bubble-content]:bg-transparent *:data-[slot=bubble-content]:p-0",
        destructive:
          "*:data-[slot=bubble-content]:bg-destructive/10 *:data-[slot=bubble-content]:text-destructive dark:*:data-[slot=bubble-content]:bg-destructive/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Bubble({
  variant = "default",
  align = "start",
  className,
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof bubbleVariants> & {
    align?: "start" | "end";
  }) {
  return (
    <div
      data-slot="bubble"
      data-variant={variant}
      data-align={align}
      className={cn(bubbleVariants({ variant }), className)}
      {...props}
    />
  );
}

function BubbleContent({ className, render, ...props }: useRender.ComponentProps<"div">) {
  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(
      {
        className: cn(
          "relative w-fit max-w-full min-w-[72px] rounded-[var(--radius-md)] border border-transparent px-3 py-2 text-[15px] leading-6 shadow-soft transition-all duration-200 wrap-break-word [button]:text-left [button,a]:transition-colors [button,a]:outline-none [button,a]:focus-visible:ring-2 [button,a]:focus-visible:ring-ring/50",
          className,
        ),
      },
      props,
    ),
    render,
    state: {
      slot: "bubble-content",
    },
  });
}

export function BubbleTail({ align, className }: { align: "start" | "end"; className?: string }) {
  if (align === "end") {
    return (
      <svg
        aria-hidden
        viewBox="0 0 16 16"
        className={cn("pointer-events-none absolute -right-[6px] bottom-0 h-4 w-4", className)}
      >
        <path d="M0 0v8c0 3 2 5 5 5h5l3 3v-5C13 5 8 0 0 0Z" />
      </svg>
    );
  }

  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      className={cn("pointer-events-none absolute bottom-0 -left-[6px] h-4 w-4", className)}
    >
      <path d="M16 0C8 0 3 5 3 11v5l3-3h5c3 0 5-2 5-5V0Z" strokeWidth="1" />
    </svg>
  );
}

const bubbleReactionsVariants = cva(
  "absolute z-10 flex w-fit shrink-0 items-center justify-center gap-1 rounded-full border border-border bg-card px-2 py-1 text-sm shadow-soft backdrop-blur-md ring-2 ring-card has-[button]:p-0",
  {
    variants: {
      side: {
        top: "top-0 -translate-y-3/4",
        bottom: "bottom-0 translate-y-3/4",
      },
      align: {
        start: "left-3",
        end: "right-3",
      },
    },
    defaultVariants: {
      side: "bottom",
      align: "end",
    },
  },
);

function BubbleReactions({
  side = "bottom",
  align = "end",
  className,
  ...props
}: React.ComponentProps<"div"> & {
  align?: "start" | "end";
  side?: "top" | "bottom";
}) {
  return (
    <div
      data-slot="bubble-reactions"
      data-align={align}
      data-side={side}
      className={cn(bubbleReactionsVariants({ side, align }), className)}
      {...props}
    />
  );
}

export { Bubble, BubbleContent, BubbleGroup, BubbleReactions };
