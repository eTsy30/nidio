export function CalendarLoading() {
  return (
    <div
      className="min-h-0 flex-1 overflow-y-auto"
      role="status"
      aria-label="Загрузка календаря"
      aria-busy="true"
    >
      <span className="sr-only">Загружаем календарь…</span>
      <div
        aria-hidden="true"
        className="mx-auto w-full max-w-5xl space-y-4 px-4 py-6 sm:px-8 sm:py-10 motion-safe:animate-pulse"
      >
        <div className="h-9 w-48 rounded-md bg-muted" />
        <div className="h-4 w-60 max-w-full rounded-md bg-muted" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-16 rounded-md bg-muted" />
          <div className="h-16 rounded-md bg-muted" />
        </div>
        <div className="h-11 rounded-md bg-muted" />
        <div className="grid grid-cols-7 gap-2 rounded-md border border-border bg-card p-3">
          {Array.from({ length: 42 }, (_, index) => (
            <div key={index} className="h-12 rounded-sm bg-muted sm:h-16" />
          ))}
        </div>
        <div className="h-20 rounded-md border border-border bg-card" />
      </div>
    </div>
  );
}
