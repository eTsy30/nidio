"use client";
import { useEffect, useState } from "react";

import { Button, Link } from "@/shared/ui";

import { ButtonExamples } from "./ButtonExamples";
import { FieldExamples } from "./FieldExamples";
import { InteractiveExamples } from "./InteractiveExamples";
import { SurfaceExamples } from "./SurfaceExamples";

export function UiKitPage() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const root = document.documentElement;
    const previous = root.classList.contains("dark");
    root.classList.toggle("dark", dark);
    return () => {
      root.classList.toggle("dark", previous);
    };
  }, [dark]);
  return (
    <main className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-3 py-6 sm:px-6 sm:py-10">
        <header className="flex flex-col items-start gap-4">
          <Link href="/" variant="muted">
            ← В приложение
          </Link>
          <div className="flex w-full flex-wrap items-center justify-between gap-4">
            <h1 className="text-3xl font-bold">Компоненты интерфейса</h1>
            <Button variant="secondary" aria-pressed={dark} onClick={() => setDark(!dark)}>
              {dark ? "Светлая тема" : "Тёмная тема"}
            </Button>
          </div>
          <p className="max-w-2xl text-muted-foreground">
            Живые примеры компонентов Nidio. Можно нажимать, вводить текст и сравнивать состояния.
            Изменения здесь не сохраняются.
          </p>
          <nav aria-label="Разделы компонентов" className="flex flex-wrap gap-x-5 gap-y-2">
            {[
              ["buttons", "Кнопки"],
              ["fields", "Поля"],
              ["surfaces", "Карточки и статусы"],
              ["interactive", "Интерактивные примеры"],
            ].map(([id, label]) => (
              <Link
                key={id}
                href={`#${id}`}
                className="inline-flex min-h-11 items-center"
                variant="primary"
              >
                {label}
              </Link>
            ))}
          </nav>
        </header>
        <ButtonExamples />
        <FieldExamples />
        <SurfaceExamples />
        <InteractiveExamples />
      </div>
    </main>
  );
}
