import { Loader2 } from "lucide-react";

export function LoadingState({
  label = "Загрузка",
  compact = false,
}: {
  label?: string;
  compact?: boolean;
}) {
  return (
    <div
      role="status"
      aria-busy="true"
      className={
        compact ? "flex min-h-11 items-center justify-center py-3" : "w-full min-w-0 space-y-3"
      }
    >
      <span className="sr-only">{label}</span>
      {compact ? (
        <Loader2
          aria-hidden="true"
          className="size-5 text-muted-foreground motion-safe:animate-spin"
        />
      ) : (
        <div aria-hidden="true" className="space-y-3 motion-safe:animate-pulse">
          <div className="h-8 w-40 max-w-full rounded-md bg-muted" />
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="h-24 rounded-[var(--radius-md)] border border-border bg-muted/60"
            />
          ))}
        </div>
      )}
    </div>
  );
}
