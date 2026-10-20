"use client";

import { createContext, type ReactNode, useContext, useEffect, useSyncExternalStore } from "react";

import { useAuth } from "@/shared/api/provider/auth-context";

export const themes = [
  { id: "light", label: "Светлая" },
  { id: "dark", label: "Тёмная" },
  { id: "sea", label: "Морская" },
  { id: "berry", label: "Ягодная" },
] as const;
type Theme = (typeof themes)[number]["id"];
const ThemeContext = createContext({ theme: "light" as Theme, setTheme: (_theme: Theme) => {} });
export const useTheme = () => useContext(ThemeContext);

const sessionThemes = new Map<string, Theme>();
function subscribe(notify: () => void) {
  window.addEventListener("storage", notify);
  window.addEventListener("nidio:theme", notify);
  return () => {
    window.removeEventListener("storage", notify);
    window.removeEventListener("nidio:theme", notify);
  };
}
function readTheme(key: string): Theme {
  try {
    const saved = localStorage.getItem(key);
    return themes.find((item) => item.id === saved)?.id ?? sessionThemes.get(key) ?? "light";
  } catch {
    return sessionThemes.get(key) ?? "light";
  }
}
export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const key = `nidio:theme:${user?.id ?? "guest"}`;
  const theme = useSyncExternalStore(
    subscribe,
    () => (isLoading ? "light" : readTheme(key)),
    () => "light" as Theme,
  );
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.classList.toggle("dark", theme === "dark");
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute(
        "content",
        getComputedStyle(document.documentElement).getPropertyValue("--background").trim(),
      );
  }, [theme]);
  function setTheme(next: Theme) {
    sessionThemes.set(key, next);
    try {
      localStorage.setItem(key, next);
    } catch {
      /* Keep the session preference. */
    }
    window.dispatchEvent(new Event("nidio:theme"));
  }
  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}
