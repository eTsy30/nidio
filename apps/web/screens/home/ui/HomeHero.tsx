"use client";

import Link from "next/link";
import { differenceInCalendarDays, format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import { ArrowUpRight, Heart, ListTodo } from "lucide-react";

import { useMe } from "@/features/auth";
import { useCurrentCouple } from "@/features/relationship/hook/use-relationship";
import { Button } from "@/shared/ui/button/Button";
import { Card } from "@/shared/ui/card/Card";

export function HomeHero({ now }: { now: Date }) {
  const { data: user } = useMe();
  const { data: couple } = useCurrentCouple();
  const start = couple?.relationshipAt ? parseISO(couple.relationshipAt.slice(0, 10)) : null;
  const days =
    start && !Number.isNaN(start.getTime())
      ? Math.max(0, differenceInCalendarDays(now, start))
      : null;
  const dayLabel = days === null ? "" : new Intl.PluralRules("ru").select(days);
  const greeting =
    now.getHours() < 12 ? "Доброе утро" : now.getHours() < 18 ? "Добрый день" : "Добрый вечер";

  return (
    <Card variant="outline" className="min-w-0 rounded-[var(--radius-md)] border-border p-5">
      <div className="relative z-10 max-w-xl">
        <p className="eyebrow text-primary" suppressHydrationWarning>
          {format(now, "EEEE, d MMMM", { locale: ru })}
        </p>
        <h2
          className="mt-3 text-2xl font-semibold leading-tight tracking-tight break-words"
          suppressHydrationWarning
        >
          {greeting}
          {user?.firstName ? `, ${user.firstName}` : ""}.
        </h2>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground sm:text-base">
          Пусть сегодня найдётся время для важного.
          <br className="hidden sm:block" /> И друг для друга.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button asChild>
            <Link href="/together">
              <ListTodo aria-hidden="true" />
              Открыть задачи
            </Link>
          </Button>
          <Link
            href="/calendar?scope=couple"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-xl px-2 text-sm font-medium text-foreground hover:text-primary hover:no-underline"
          >
            Ваши планы
            <ArrowUpRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
        <Link
          href="/profile"
          className="mt-7 inline-flex max-w-full items-center gap-2 rounded-full border border-primary/15 bg-card/65 px-4 py-2 text-sm text-foreground hover:bg-card hover:no-underline"
        >
          <Heart className="size-4 shrink-0 text-primary" aria-hidden="true" />
          {days === null ? (
            "Укажите дату, с которой вы вместе"
          ) : (
            <span>
              <strong className="tabular-nums">{days}</strong>{" "}
              {dayLabel === "one" ? "день" : dayLabel === "few" ? "дня" : "дней"} вместе{" "}
              <span className="hidden sm:inline text-muted-foreground">
                · ваша история продолжается
              </span>
            </span>
          )}
        </Link>
      </div>
    </Card>
  );
}
