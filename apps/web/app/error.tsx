"use client";

import { Button } from "@/shared/ui";

export default function ErrorBoundary({
  reset,
}: Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>) {
  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <section className="max-w-sm space-y-3 rounded-2xl border bg-card p-6 text-center shadow-soft">
        <h1 className="text-lg font-semibold">Не удалось открыть страницу</h1>
        <p className="text-sm text-muted-foreground">Попробуйте загрузить её ещё раз.</p>
        <Button onClick={reset}>Повторить</Button>
      </section>
    </main>
  );
}
