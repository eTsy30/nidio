"use client";

import { Check } from "lucide-react";

import { themes, useTheme } from "@/shared/theme/ThemeProvider";
import { Button } from "@/shared/ui";

export function ProfileThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <fieldset className="space-y-3 p-5">
      <legend className="px-1 font-semibold">Оформление</legend>
      <div className="grid grid-cols-2 gap-2">
        {themes.map(({ id, label }) => (
          <Button
            key={id}
            variant={theme === id ? "primary" : "secondary"}
            aria-pressed={theme === id}
            onClick={() => setTheme(id)}
          >
            {theme === id && <Check className="size-4" aria-hidden="true" />}
            {label}
          </Button>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">Ваш выбор сохраняется на этом устройстве.</p>
    </fieldset>
  );
}
