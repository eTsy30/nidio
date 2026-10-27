"use client";
import { useState } from "react";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";

import { Button } from "@/shared/ui";
import { LoadingState } from "@/shared/ui/loading/LoadingState";

import { isFinanceAccessError, useFinancePages } from "../api/finance-query";
import { useFinance } from "../api/FinanceProvider";
import { money } from "../model/money";
import type { Goal, SavingsEntry } from "../model/types";

import { CancelSavingsEntry } from "./CancelSavingsEntry";

export function SavingsHistory({ goal }: { goal: Goal }) {
  const { name } = useFinance();
  const [all, setAll] = useState(false);
  const query = useFinancePages<SavingsEntry>(`/goal/${encodeURIComponent(goal.id)}/history`, {});
  const entries = isFinanceAccessError(query.error)
    ? []
    : (query.data?.pages.flatMap((p) => p.items) ?? []);
  return (
    <section aria-labelledby="savings-history-title" className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 id="savings-history-title" className="text-lg font-semibold">
          История
        </h2>
        {!all && entries.length > 5 && (
          <Button variant="link" size="sm" onClick={() => setAll(true)}>
            Вся история
          </Button>
        )}
      </div>
      {query.isPending && <LoadingState compact label="Загрузка истории" />}
      {query.isError && (
        <p role="status">
          История не обновлена.{" "}
          <Button variant="link" onClick={() => void query.refetch()}>
            Повторить
          </Button>
        </p>
      )}
      {entries.length ? (
        <ul className="divide-y divide-border">
          {(all ? entries : entries.slice(0, 5)).map((entry) => {
            const Icon = entry.type === "DEPOSIT" ? ArrowDownLeft : ArrowUpRight;
            return (
              <li key={entry.id} className="flex items-start gap-3 py-4">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {entry.cancelledAt
                      ? "Отменено"
                      : entry.type === "DEPOSIT"
                        ? "Пополнение"
                        : "Снятие"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {name(entry.createdBy)} ·{" "}
                    {new Date(entry.createdAt).toLocaleDateString("ru-RU", {
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                  {entry.description && (
                    <p className="mt-1 break-words text-sm text-muted-foreground">
                      {entry.description}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 flex-col items-end">
                  <span
                    className={`text-sm font-semibold tabular-nums ${entry.cancelledAt ? "text-muted-foreground line-through" : ""}`}
                  >
                    {entry.type === "DEPOSIT" ? "+" : "−"}
                    {money(entry.amountMinor, goal.currency)}
                  </span>
                  <CancelSavingsEntry entry={entry} goalId={goal.id} />
                </div>
              </li>
            );
          })}
        </ul>
      ) : !query.isPending && !query.isError ? (
        <p className="py-4 text-sm text-muted-foreground">
          Пока нет взносов. Здесь будут видны суммы, даты и участники.
        </p>
      ) : null}
      {all && query.hasNextPage && !isFinanceAccessError(query.error) && (
        <Button
          fullWidth
          variant="secondary"
          loading={query.isFetchingNextPage}
          onClick={() => void query.fetchNextPage()}
        >
          Показать ещё
        </Button>
      )}
    </section>
  );
}
