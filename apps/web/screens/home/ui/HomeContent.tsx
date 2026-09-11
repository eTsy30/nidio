"use client";

import Link from "next/link";
import { format, isBefore, startOfDay } from "date-fns";
import { ru } from "date-fns/locale";
import {
  ArrowUpRight,
  CalendarDays,
  CheckCheck,
  ChevronRight,
  Circle,
  Coffee,
  ListTodo,
  Plus,
} from "lucide-react";

import { Button } from "@/shared/ui/button/Button";

import { useHomeOverview } from "../model/use-home-overview";

import { HomeHero } from "./HomeHero";
import { HomeIdea } from "./HomeIdea";

function LoadingRows() {
  return (
    <div role="status" className="space-y-3 py-5">
      <span className="sr-only">Загрузка</span>
      {[0, 1, 2].map((item) => (
        <div key={item} className="h-14 animate-pulse rounded-2xl bg-muted/70" />
      ))}
    </div>
  );
}

export function HomeContent() {
  const { now, tasks, calendar, upcoming } = useHomeOverview();
  const pending = tasks.data?.filter((task) => !task.completed) ?? [];
  return (
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
      <div className="home-grid mx-auto w-full max-w-6xl space-y-6 px-4 py-5 sm:px-8 sm:py-8">
        <HomeHero now={now} />
        <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
          <section className="dashboard-panel min-w-0">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="eyebrow">Шаг за шагом</p>
                <h2 className="mt-2 flex items-center gap-2 text-xl">
                  К выполнению
                  {tasks.isSuccess && (
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs tabular-nums text-primary">
                      {pending.length}
                    </span>
                  )}
                </h2>
              </div>
              <Link href="/together" className="icon-link" aria-label="Открыть все задачи">
                <ArrowUpRight className="size-5" />
              </Link>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Сегодня, просроченное и регулярные дела.
            </p>
            {tasks.isPending ? (
              <LoadingRows />
            ) : tasks.isError ? (
              <div className="py-8">
                <p className="text-sm text-muted-foreground" role="status">
                  Не удалось загрузить задачи.
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-3"
                  onClick={() => void tasks.refetch()}
                >
                  Попробовать снова
                </Button>
              </div>
            ) : pending.length ? (
              <ul className="mt-5 divide-y divide-border/70">
                {pending.slice(0, 4).map((task) => {
                  const overdue = task.dueAt && isBefore(new Date(task.dueAt), startOfDay(now));
                  return (
                    <li key={task.id}>
                      <Link
                        href="/together"
                        className="group flex min-h-18 items-center gap-3 rounded-xl py-3 text-foreground hover:bg-muted/40 hover:no-underline"
                      >
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-muted/70 text-muted-foreground">
                          <Circle className="size-4" aria-hidden="true" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">{task.title}</span>
                          <span
                            className={`mt-1 block text-xs ${overdue ? "text-destructive" : "text-muted-foreground"}`}
                          >
                            {overdue ? "Срок прошёл · " : ""}
                            {task.dueAt
                              ? format(new Date(task.dueAt), "d MMM", { locale: ru })
                              : "Регулярная задача"}
                            {task.priority ? " · Важное" : ""}
                          </span>
                        </span>
                        <ChevronRight
                          className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1"
                          aria-hidden="true"
                        />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="flex flex-col items-start py-8">
                <span className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-success/10 text-success">
                  <CheckCheck aria-hidden="true" />
                </span>
                <h3 className="text-base">Можно выдохнуть</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  На сегодня нет запланированных дел. Оставьте немного времени для себя и друг
                  друга.
                </p>
              </div>
            )}
            <Link
              href="/together"
              className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-semibold hover:no-underline"
            >
              <Plus className="size-4" aria-hidden="true" />
              Открыть доску задач
            </Link>
          </section>
          <section className="dashboard-panel min-w-0">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="eyebrow">Есть чего ждать</p>
                <h2 className="mt-2 text-xl">Ближайшие планы</h2>
              </div>
              <Link
                href="/calendar?scope=couple"
                className="icon-link"
                aria-label="Открыть общий календарь"
              >
                <CalendarDays className="size-5" />
              </Link>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Общий календарь на ближайшие 7 дней.
            </p>
            {calendar.loading && !calendar.data ? (
              <LoadingRows />
            ) : calendar.error ? (
              <div className="py-8">
                <p className="text-sm text-muted-foreground" role="status">
                  Не удалось загрузить события.
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-3"
                  onClick={() => void calendar.refetch().catch(() => {})}
                >
                  Попробовать снова
                </Button>
              </div>
            ) : upcoming.length ? (
              <ul className="mt-5 space-y-2">
                {upcoming.slice(0, 3).map((event) => (
                  <li key={`${event.id}:${event.startAt}`}>
                    <Link
                      href={`/calendar?scope=couple&date=${format(new Date(event.startAt), "yyyy-MM-dd")}`}
                      className="group flex items-center gap-4 rounded-2xl p-3 text-foreground transition-colors hover:bg-muted/50 hover:no-underline"
                    >
                      <span className="flex w-13 shrink-0 flex-col items-center rounded-2xl bg-primary/7 px-2 py-2 text-primary">
                        <span className="text-xl font-semibold tabular-nums">
                          {format(new Date(event.startAt), "d")}
                        </span>
                        <span className="text-[10px] uppercase tracking-wide">
                          {format(new Date(event.startAt), "MMM", { locale: ru })}
                        </span>
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">{event.title}</span>
                        <span className="mt-1 block text-xs text-muted-foreground">
                          {event.allDay
                            ? "Весь день"
                            : format(new Date(event.startAt), "EEEE · HH:mm", { locale: ru })}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="py-8">
                <span className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Coffee aria-hidden="true" />
                </span>
                <h3 className="text-base">Время для новых планов</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  На ближайшую неделю пока ничего нет. Как насчёт ужина или прогулки вдвоём?
                </p>
              </div>
            )}
            <Link
              href="/calendar?scope=couple"
              className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-semibold hover:no-underline"
            >
              <Plus className="size-4" aria-hidden="true" />
              Запланировать в календаре
            </Link>
          </section>
        </div>
        <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
          <HomeIdea />
          <section className="dashboard-panel flex flex-col justify-center">
            <p className="eyebrow">Делить заботы — проще</p>
            <h2 className="mt-3 text-xl">Не начинать с нуля</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Поездка, уборка или свидание — готовые шаблоны помогут ничего не забыть. Выберите
              подходящий на доске задач.
            </p>
            <Link
              href="/together"
              className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold hover:no-underline"
            >
              <ListTodo className="size-4" aria-hidden="true" />К совместным задачам
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </Link>
          </section>
        </div>
        <p className="pb-2 text-center text-xs text-muted-foreground">
          Не обязательно успеть всё. Главное — быть рядом.
        </p>
      </div>
    </div>
  );
}
