"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Heart, House, ListTodo, MessageCircle, UserRound } from "lucide-react";

const navigation = [
  { href: "/", label: "Главная", icon: House },
  { href: "/chat", label: "Чат", icon: MessageCircle },
  { href: "/calendar", label: "Календарь", icon: CalendarDays },
  { href: "/together", label: "Задачи", icon: ListTodo },
  { href: "/profile", label: "Профиль", icon: UserRound },
];

export function BottomNavigation() {
  const pathname = usePathname();
  return (
    <nav aria-label="Основная навигация" className="app-navigation">
      <Link
        href="/"
        className="mb-12 hidden items-center gap-3 px-3 text-foreground hover:no-underline lg:flex"
        aria-label="Nidio — главная"
      >
        <span className="flex size-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <Heart className="size-5" aria-hidden="true" />
        </span>
        <span className="text-2xl font-semibold tracking-tight">
          nidio<span className="text-primary">.</span>
        </span>
      </Link>
      <div className="mx-auto flex w-full max-w-lg items-center justify-between gap-1 lg:max-w-none lg:flex-col lg:items-stretch lg:gap-2">
        {navigation.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`nav-item group ${active ? "nav-item-active" : ""}`}
            >
              <span className="nav-icon">
                <Icon className="size-5" strokeWidth={active ? 2.2 : 1.7} aria-hidden="true" />
              </span>
              <span className="text-[10px] font-medium sm:text-xs lg:text-sm">{label}</span>
              {active && (
                <span
                  className="hidden size-1.5 rounded-full bg-primary lg:ml-auto lg:block"
                  aria-hidden="true"
                />
              )}
            </Link>
          );
        })}
      </div>
      <div className="mt-auto hidden rounded-2xl border border-primary/10 bg-primary/5 p-4 lg:block">
        <Heart className="mb-3 size-5 text-primary" aria-hidden="true" />
        <p className="text-sm font-medium">Ближе каждый день</p>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          Ваши планы, разговоры и маленькие традиции.
        </p>
      </div>
    </nav>
  );
}
