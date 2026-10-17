"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

import { Button } from "@/shared/ui";

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}

export function ProfileThemeToggle() {
  const dark = useSyncExternalStore(
    subscribe,
    () => document.documentElement.classList.contains("dark"),
    () => false,
  );
  return (
    <Button
      variant="ghost"
      className="w-full justify-start px-5"
      aria-label={dark ? "Включить светлую тему" : "Включить тёмную тему"}
      aria-pressed={dark}
      onClick={() => document.documentElement.classList.toggle("dark", !dark)}
      leftIcon={dark ? <Sun className="size-5" /> : <Moon className="size-5" />}
    >
      {dark ? "Тёмная тема" : "Светлая тема"}
    </Button>
  );
}
