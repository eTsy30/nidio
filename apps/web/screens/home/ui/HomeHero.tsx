"use client";

import Link from "next/link";
import { differenceInCalendarDays, format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import { ArrowUpRight, Heart, MessageCircle } from "lucide-react";

import { useMe } from "@/features/auth";
import { useCurrentCouple } from "@/features/relationship/hook/use-relationship";
import { Button } from "@/shared/ui/button/Button";

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
    <section className="home-hero relative isolate overflow-hidden rounded-[2rem] border border-primary/10 px-6 py-8 sm:px-9 sm:py-10">
      <div className="relative z-10 max-w-xl">
        <p className="eyebrow text-primary" suppressHydrationWarning>
          {format(now, "EEEE, d MMMM", { locale: ru })}
        </p>
        <h1
          className="mt-4 max-w-lg text-3xl font-semibold leading-tight tracking-tight sm:text-4xl"
          suppressHydrationWarning
        >
          {greeting}
          {user?.firstName ? `, ${user.firstName}` : ""}.
        </h1>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground sm:text-base">
          Пусть сегодня найдётся время для важного.
          <br className="hidden sm:block" /> И друг для друга.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button asChild>
            <Link href="/chat">
              <MessageCircle aria-hidden="true" />
              Написать партнёру
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
      <div
        className="home-orbits pointer-events-none absolute hidden sm:block -right-24 -top-10 size-80 opacity-40 sm:right-0 sm:top-0 sm:opacity-80"
        aria-hidden="true"
      >
        <div className="absolute inset-5 rounded-full border border-primary/15" />
        <div className="absolute inset-14 rounded-full border border-primary/20" />
        <div className="absolute right-14 top-20 flex size-24 rotate-12 items-center justify-center rounded-[2rem] border border-white/60 bg-card/80 text-primary shadow-soft">
          <Heart className="size-12 fill-primary/10" strokeWidth={1} />
        </div>
        <div className="absolute bottom-12 left-12 flex size-20 -rotate-12 items-center justify-center rounded-[1.75rem] bg-primary text-primary-foreground shadow-floating">
          <Heart className="size-10" strokeWidth={1} />
        </div>
      </div>
    </section>
  );
}
