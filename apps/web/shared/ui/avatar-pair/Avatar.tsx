"use client";

import * as React from "react";
import { Avatar as AvatarPrimitive } from "@base-ui/react/avatar";

import { cn } from "@/shared/lib/cn";

type AvatarProps = AvatarPrimitive.Root.Props & {
  size?: "sm" | "default" | "lg";
  className?: string;
};

function Avatar({ className, size = "default", ...props }: AvatarProps) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      data-size={size}
      className={cn(
        "group/avatar relative inline-flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-card shadow-xs transition-all duration-200 select-none ring-2 ring-background after:absolute after:inset-0 after:rounded-full after:border after:border-border/40 data-[size=sm]:size-8 data-[size=default]:size-10 data-[size=lg]:size-14",
        className,
      )}
      {...props}
    />
  );
}

function AvatarImage({ className, ...props }: AvatarPrimitive.Image.Props) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn("size-full object-cover transition-opacity duration-200", className)}
      {...props}
    />
  );
}

function AvatarFallback({ className, ...props }: AvatarPrimitive.Fallback.Props) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        "flex size-full items-center justify-center bg-muted text-foreground font-medium group-data-[size=sm]/avatar:text-xs group-data-[size=default]/avatar:text-sm group-data-[size=lg]/avatar:text-base",
        className,
      )}
      {...props}
    />
  );
}

function AvatarBadge({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="avatar-badge"
      className={cn(
        "absolute -bottom-0.5 -right-0.5 z-10 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground ring-2 ring-background shadow-xs group-data-[size=sm]/avatar:size-3 group-data-[size=default]/avatar:size-4 group-data-[size=lg]/avatar:size-5 group-data-[size=sm]/avatar:[&>svg]:size-1.5 group-data-[size=default]/avatar:[&>svg]:size-2 group-data-[size=lg]/avatar:[&>svg]:size-2.5",
        className,
      )}
      {...props}
    />
  );
}

function AvatarGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="avatar-group"
      className={cn(
        "group/avatar-group flex -space-x-3 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-background",
        className,
      )}
      {...props}
    />
  );
}

function AvatarGroupCount({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="avatar-group-count"
      className={cn(
        "relative flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground ring-2 ring-background group-has-data-[size=lg]/avatar-group:size-14 group-has-data-[size=sm]/avatar-group:size-8",
        className,
      )}
      {...props}
    />
  );
}

export { Avatar, AvatarBadge, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarImage };
