"use client";
import { useState } from "react";
import { Download, Pencil, Plus, Search, Trash2 } from "lucide-react";

import { Button, Card, Input } from "@/shared/ui";

import { useFinance } from "../api/FinanceProvider";
import { categoryName } from "../model/constants";
import { downloadCsv, entriesCsv } from "../model/csv";
import { money, totals } from "../model/money";
import { periodRange, previousMonth } from "../model/period";
import type { Currency } from "../model/types";

import { BudgetFilters, type BudgetFilterState } from "./BudgetFilters";
import { BudgetLimits } from "./BudgetLimits";
import { EntryForm } from "./EntryForm";
import { ExpenseChart } from "./ExpenseChart";
import { ConfirmDelete } from "./FinanceDialog";
import { FinanceEmpty } from "./FinanceEmpty";
export function BudgetTab({
  currency,
  onCurrency,
}: {
  currency: Currency;
  onCurrency?: (currency: Currency) => void;
}) {
  const { data, write, name } = useFinance();
  const [filter, setFilter] = useState<BudgetFilterState>({
    period: "month",
    ...periodRange("month"),
    category: "ALL",
    author: "ALL",
    search: "",
  });
  const [modal, setModal] = useState<{ kind: string; id?: string } | null>(null);
  const entry = data.transactions.find((e) => e.id === modal?.id);
  const close = () => setModal(null);
  const all = data.transactions.filter((e) => e.currency === currency);
  const range = filter.period === "custom" ? filter : periodRange(filter.period);
  const validRange = Boolean(range.start && range.end && range.start <= range.end);
  const entries = all.filter(
    (e) =>
      validRange &&
      e.date >= range.start &&
      e.date <= range.end &&
      (filter.category === "ALL" || e.category === filter.category) &&
      (filter.author === "ALL" || e.createdBy === filter.author) &&
      e.description.toLocaleLowerCase().includes(filter.search.toLocaleLowerCase()),
  );
  const sum = totals(entries);
  const total = totals(all);
  const current = periodRange("month");
  const previous = previousMonth();
  const thisMonth = totals(
    all.filter((e) => e.date >= current.start && e.date <= current.end),
  ).expense;
  const lastMonth = totals(
    all.filter((e) => e.date >= previous.start && e.date <= previous.end),
  ).expense;
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Бюджет</h1>
          <p className="text-sm text-muted-foreground">Ручной учёт общих денег · {currency}</p>
        </div>
        <Button leftIcon={<Plus />} onClick={() => setModal({ kind: "create" })}>
          Добавить операцию
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ["Общий баланс · всё время", total.balance],
          ["Доходы · по фильтрам", sum.income],
          ["Расходы · по фильтрам", sum.expense],
        ].map(([label, value]) => (
          <Card key={label} padding="sm">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-2 break-words text-2xl font-semibold tabular-nums">
              {money(Number(value), currency)}
            </p>
          </Card>
        ))}
      </div>
      <div className="flex items-end gap-3">
        <div className="min-w-0 flex-1">
          <BudgetFilters
            value={filter}
            change={(next) => setFilter((old) => ({ ...old, ...next }))}
            currency={currency}
            {...(onCurrency ? { onCurrency } : {})}
          />
        </div>
      </div>
      <div className="grid gap-3">
        <Input
          leftIcon={<Search />}
          label="Поиск по описанию"
          value={filter.search}
          onChange={(e) => setFilter((old) => ({ ...old, search: e.target.value }))}
          placeholder="Например, ужин"
        />
      </div>
      {!validRange && (
        <p role="alert" className="text-sm text-destructive">
          Выберите обе даты. Конец периода должен быть не раньше начала.
        </p>
      )}
      <p className="text-sm text-muted-foreground">
        Баланс выбранного периода с учётом фильтров: {money(sum.balance, currency)}
      </p>
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <ExpenseChart entries={entries} currency={currency} />
        <BudgetLimits currency={currency} />
      </div>
      <Card padding="sm">
        <h3 className="font-semibold">Этот месяц и предыдущий</h3>
        <p className="mt-2 text-sm">
          Расходы: {money(thisMonth, currency)} против {money(lastMonth, currency)}.
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {lastMonth
            ? `${thisMonth > lastMonth ? "Больше" : "Меньше"} на ${money(Math.abs(thisMonth - lastMonth), currency)} (${Math.round((Math.abs(thisMonth - lastMonth) / lastMonth) * 100)}%)`
            : "В прошлом месяце расходов не было."}{" "}
          Сравнение всех расходов в {currency}, без фильтров.
        </p>
      </Card>
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold">Операции · {entries.length}</h3>
        <Button
          variant="ghost"
          leftIcon={<Download />}
          disabled={!entries.length}
          onClick={() => downloadCsv(entriesCsv(entries, name))}
        >
          CSV
        </Button>
      </div>
      {!entries.length ? (
        <FinanceEmpty title="Здесь появится история">
          Добавьте доход или расход либо измените фильтры.
        </FinanceEmpty>
      ) : (
        <ul className="space-y-2">
          {entries.map((e) => (
            <li key={e.id}>
              <Card padding="sm" className="flex flex-wrap items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="break-words text-sm font-semibold">
                    {e.description || categoryName(e.category)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {categoryName(e.category)} · {e.date.split("-").reverse().join(".")} ·{" "}
                    {name(e.createdBy)}
                  </p>
                </div>
                <span
                  className={`font-semibold tabular-nums ${e.type === "INCOME" ? "text-success" : "text-foreground"}`}
                >
                  {e.type === "INCOME" ? "+" : "−"}
                  {money(e.amountMinor, currency)}
                </span>
                <div className="flex">
                  <Button
                    variant="icon"
                    iconOnly
                    aria-label={`Изменить операцию: ${e.description || categoryName(e.category)}`}
                    onClick={() => setModal({ kind: "edit", id: e.id })}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    variant="icon"
                    iconOnly
                    aria-label="Удалить операцию"
                    onClick={() => setModal({ kind: "delete", id: e.id })}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
      {modal?.kind === "create" && <EntryForm currency={currency} onClose={close} />}
      {entry && modal?.kind === "edit" && (
        <EntryForm entry={entry} currency={currency} onClose={close} />
      )}
      {entry && modal?.kind === "delete" && (
        <ConfirmDelete
          title={`${entry.type === "INCOME" ? "Доход" : "Расход"} ${money(entry.amountMinor, entry.currency)} будет удалён.`}
          onClose={close}
          onDelete={() => write(`/transactions/${entry.id}`, "delete")}
        />
      )}
    </div>
  );
}
