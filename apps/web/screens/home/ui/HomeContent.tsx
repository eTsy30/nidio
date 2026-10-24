"use client";

import Link from "next/link";
import { format, isBefore, startOfDay } from "date-fns";
import { ru } from "date-fns/locale";
import {
  ArrowUpRight,
  CalendarDays,
  ChevronRight,
  CreditCard,
  ListTodo,
  PiggyBank,
  Wallet,
} from "lucide-react";

import { Button } from "@/shared/ui/button/Button";
import { Card } from "@/shared/ui/card/Card";

import { useHomeOverview } from "../model/use-home-overview";

function LoadingRows() {
  return (
    <div role="status" className="space-y-2 py-3">
      <span className="sr-only">Загрузка</span>
      {[0, 1].map((item) => (
        <div key={item} className="h-11 animate-pulse rounded-md bg-muted/70" />
      ))}
    </div>
  );
}

export function HomeContent() {
  const { now, tasks, calendar, upcoming } = useHomeOverview();
  const pending = tasks.data?.filter((task) => !task.completed) ?? [];
  return (
    <div className="space-y-3">
      <p className="text-sm capitalize text-muted-foreground" suppressHydrationWarning>
        {format(now, "EEEE, d MMMM", { locale: ru })}
      </p>
      <div className="grid items-start gap-3 lg:grid-cols-2">
        <Card
          variant="outline"
          className="min-w-0 rounded-[var(--radius-md)] border-border p-4 sm:p-5"
        >
          <div className="flex items-center justify-between gap-2">
            <h2 className="flex min-w-0 items-center gap-2 text-base font-semibold">
              <ListTodo className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              Задачи
              {tasks.isSuccess && (
                <span className="text-sm font-normal tabular-nums text-muted-foreground">
                  {pending.length}
                </span>
              )}
            </h2>
            <Button asChild variant="ghost" size="sm">
              <Link href="/together">
                Все <ArrowUpRight aria-hidden="true" />
              </Link>
            </Button>
          </div>
          {tasks.isPending ? (
            <LoadingRows />
          ) : tasks.isError ? (
            <div className="space-y-2 py-3">
              <p className="text-sm text-muted-foreground" role="status">
                Не удалось загрузить задачи.
              </p>
              <Button variant="secondary" size="sm" onClick={() => void tasks.refetch()}>
                Повторить
              </Button>
            </div>
          ) : pending.length ? (
            <ul className="mt-1 divide-y divide-border/70">
              {pending.slice(0, 3).map((task) => {
                const overdue = task.dueAt && isBefore(new Date(task.dueAt), startOfDay(now));
                return (
                  <li key={task.id}>
                    <Link
                      href="/together"
                      className="flex min-h-14 items-center gap-3 rounded-md py-2 text-foreground hover:bg-muted/40 hover:no-underline"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{task.title}</span>
                        <span
                          className={`mt-0.5 block text-xs ${overdue ? "text-destructive" : "text-muted-foreground"}`}
                        >
                          {overdue ? "Срок прошёл · " : ""}
                          {task.dueAt
                            ? format(new Date(task.dueAt), "d MMM", { locale: ru })
                            : "Регулярная задача"}
                          {task.priority ? " · Важное" : ""}
                        </span>
                      </span>
                      <ChevronRight
                        className="size-4 shrink-0 text-muted-foreground"
                        aria-hidden="true"
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="py-3 text-sm text-muted-foreground">На сегодня дел нет.</p>
          )}
        </Card>
        <Card
          variant="outline"
          className="min-w-0 rounded-[var(--radius-md)] border-border p-4 sm:p-5"
        >
          <div className="flex items-center justify-between gap-2">
            <h2 className="flex min-w-0 items-center gap-2 text-base font-semibold">
              <CalendarDays className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              Ближайшие события
            </h2>
            <Button asChild variant="ghost" size="sm">
              <Link href="/calendar?scope=couple" aria-label="Все события общего календаря">
                Все <ArrowUpRight aria-hidden="true" />
              </Link>
            </Button>
          </div>
          {calendar.loading && !calendar.data ? (
            <LoadingRows />
          ) : calendar.error ? (
            <div className="space-y-2 py-3">
              <p className="text-sm text-muted-foreground" role="status">
                Не удалось загрузить события.
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => void calendar.refetch().catch(() => {})}
              >
                Повторить
              </Button>
            </div>
          ) : upcoming.length ? (
            <ul className="mt-1 divide-y divide-border/70">
              {upcoming.slice(0, 3).map((event) => (
                <li key={`${event.id}:${event.startAt}`}>
                  <Link
                    href={`/calendar?scope=couple&date=${format(new Date(event.startAt), "yyyy-MM-dd")}`}
                    className="flex min-h-14 items-center gap-3 rounded-md py-2 text-foreground hover:bg-muted/40 hover:no-underline"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{event.title}</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {format(new Date(event.startAt), "d MMM", { locale: ru })} ·{" "}
                        {event.allDay ? "Весь день" : format(new Date(event.startAt), "HH:mm")}
                      </span>
                    </span>
                    <ChevronRight
                      className="size-4 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-3 text-sm text-muted-foreground">На ближайшую неделю событий нет.</p>
          )}
        </Card>
      </div>
      <section className="space-y-2" aria-label="Быстрый доступ">
        <h2 className="text-sm font-semibold text-muted-foreground">Под рукой</h2>
        <div className="grid grid-cols-3 gap-2">
          <Button
            asChild
            variant="secondary"
            className="h-auto min-h-16 flex-col gap-1 px-1 py-3 text-xs"
          >
            <Link href="/savings">
              <PiggyBank aria-hidden="true" />
              Копилки
            </Link>
          </Button>
          <Button
            asChild
            variant="secondary"
            className="h-auto min-h-16 flex-col gap-1 px-1 py-3 text-xs"
          >
            <Link href="/cards">
              <CreditCard aria-hidden="true" />
              Карты
            </Link>
          </Button>
          <Button
            asChild
            variant="secondary"
            className="h-auto min-h-16 flex-col gap-1 px-1 py-3 text-xs"
          >
            <Link href="/budget">
              <Wallet aria-hidden="true" />
              Бюджет
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
