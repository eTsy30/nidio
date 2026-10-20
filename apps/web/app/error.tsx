"use client";

import { Button, Card } from "@/shared/ui";

export default function ErrorBoundary({
  reset,
}: Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>) {
  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <Card asChild className="max-w-sm space-y-3 text-center">
        <section>
          <h1 className="text-lg font-semibold">Не удалось открыть страницу</h1>
          <p className="text-sm text-muted-foreground">Попробуйте загрузить её ещё раз.</p>
          <Button onClick={reset}>Повторить</Button>
        </section>
      </Card>
    </main>
  );
}
