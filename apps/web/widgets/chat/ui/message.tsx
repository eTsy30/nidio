import * as React from "react";

import { cn } from "@/shared/lib/cn";

function MessageGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="message-group"
      className={cn("flex min-w-0 flex-col gap-2", className)}
      {...props}
    />
  );
}

function Message({
  className,
  align = "start",
  ...props
}: React.ComponentProps<"div"> & { align?: "start" | "end" }) {
  return (
    <div
      data-slot="message"
      data-align={align}
      className={cn(
        "group/message relative flex w-full min-w-0 gap-2.5 py-0.5 transition-all duration-200",
        align === "end" ? "justify-end" : "flex-row",
        className,
      )}
      {...props}
    />
  );
}

function MessageAvatar({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="message-avatar"
      className={cn(
        "flex size-9 shrink-0 items-center justify-center self-end overflow-hidden rounded-full border-2 border-card bg-muted shadow-soft transition-all duration-200",
        className,
      )}
      {...props}
    />
  );
}

function MessageContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="message-content"
      className={cn(
        "flex min-w-0 flex-col gap-0.5 break-words transition-all duration-200",
        "w-fit max-w-[80%] md:max-w-[70%]",
        "group-data-[align=end]/message:items-end",
        className,
      )}
      {...props}
    />
  );
}

function MessageHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="message-header"
      className={cn(
        "body-sm flex max-w-full min-w-0 items-center px-1 text-muted-foreground/80",
        className,
      )}
      {...props}
    />
  );
}

function MessageFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="message-footer"
      className={cn(
        "body-sm flex max-w-full min-w-0 items-center px-1 text-muted-foreground/60 group-data-[align=end]/message:justify-end",
        className,
      )}
      {...props}
    />
  );
}

export { Message, MessageAvatar, MessageContent, MessageFooter, MessageGroup, MessageHeader };
