export function HomeContent() {
  return (
    <section className="flex flex-1 flex-col px-6 py-6">
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6">
        <div className="rounded-[var(--radius-xl)] border border-border bg-card p-6 shadow-sm">
          <p className="text-sm text-muted-foreground">Ваше пространство</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">
            Здесь скоро появится ваш чат ❤️
          </h2>
          <p className="mt-3 max-w-xl text-sm text-muted-foreground">
            Общение станет центром приложения. Календарь, воспоминания, заметки и другие разделы
            будут доступны через нижнюю навигацию.
          </p>
        </div>

        <div className="flex-1 rounded-[var(--radius-xl)] border border-dashed border-border bg-card/40" />
      </div>
    </section>
  );
}
