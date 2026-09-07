import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

interface ProfileRowProps {
  label: string;
  description?: string;
  icon?: ReactNode;
  value?: string;
  disabled?: boolean;
  destructive?: boolean;
  onClick?: () => void;
}

export function ProfileRow({
  label,
  description,
  icon,
  value,
  disabled = false,
  destructive = false,
  onClick,
}: ProfileRowProps) {
  const interactive = Boolean(onClick) && !disabled;

  return (
    <button
      type="button"
      disabled={!interactive}
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 px-5 py-4 text-left transition-colors",
        interactive && "hover:bg-muted/50 active:bg-muted",
        disabled && "cursor-default opacity-60",
      )}
    >
      {icon ? (
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          {icon}
        </div>
      ) : null}

      <div className="min-w-0 flex-1">
        <p className={cn("text-sm font-medium", destructive && "text-destructive")}>{label}</p>

        {description ? <p className="mt-0.5 text-xs text-muted-foreground">{description}</p> : null}
      </div>

      {value ? (
        <span className="max-w-[45%] truncate text-sm text-muted-foreground">{value}</span>
      ) : null}

      {interactive ? <ChevronRight className="size-4 shrink-0 text-muted-foreground" /> : null}
    </button>
  );
}
