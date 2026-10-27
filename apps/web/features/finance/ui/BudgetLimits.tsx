"use client";
import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";

import { Button, Card, Input, Select } from "@/shared/ui";
import { LoadingState } from "@/shared/ui/loading/LoadingState";

import { isFinanceAccessError, useFinanceResource } from "../api/finance-query";
import { useFinance } from "../api/FinanceProvider";
import { categoryName, expenseCategories } from "../model/constants";
import { money, moneyInput, parseMoney, progress } from "../model/money";
import { dateKey } from "../model/period";
import type { BudgetLimit, Currency } from "../model/types";

import { ConfirmDelete, FinanceDialog } from "./FinanceDialog";
import { AmountField } from "./FinanceFields";
function LimitForm({
  currency,
  month,
  limit,
  onClose,
}: {
  currency: Currency;
  month: string;
  limit?: BudgetLimit | undefined;
  onClose: () => void;
}) {
  const { write } = useFinance();
  const [category, setCategory] = useState(limit?.category ?? "ALL");
  const [amount, setAmount] = useState(limit ? moneyInput(limit.amountMinor) : "");
  return (
    <FinanceDialog
      title="Месячный лимит"
      description={`${month} · ${currency}. Общий лимит и категории считаются отдельно.`}
      onClose={onClose}
      onSubmit={() =>
        write("/limits", "put", { currency, month, category, amountMinor: parseMoney(amount) })
      }
    >
      <Select
        label="Для чего"
        value={category}
        disabled={Boolean(limit)}
        onChange={(e) => setCategory(e.target.value)}
      >
        {Object.entries({ ALL: "Весь бюджет", ...expenseCategories }).map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </Select>
      <AmountField value={amount} onChange={setAmount} />
      <p className="text-xs text-muted-foreground">
        Если такой лимит уже есть, его сумма обновится.
      </p>
    </FinanceDialog>
  );
}
export function BudgetLimits({ currency }: { currency: Currency }) {
  const { write } = useFinance();
  const [month, setMonth] = useState(dateKey().slice(0, 7));
  const [form, setForm] = useState<BudgetLimit | "new" | null>(null);
  const [remove, setRemove] = useState<BudgetLimit | null>(null);
  const query = useFinanceResource<(BudgetLimit & { spentMinor: number })[]>(
    "/budget-limits",
    { currency, month },
    /^\d{4}-(0[1-9]|1[0-2])$/.test(month),
  );
  const limits = isFinanceAccessError(query.error) ? [] : (query.data ?? []);
  return (
    <Card padding="sm" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold">Лимиты на месяц</h3>
        <Button
          variant="ghost"
          onClick={() => setForm("new")}
          disabled={!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)}
        >
          Добавить
        </Button>
      </div>
      <Input
        label="Месяц лимитов"
        type="month"
        required
        value={month}
        onChange={(e) => setMonth(e.target.value)}
      />
      {query.isPending && <LoadingState compact />}
      {query.isError && (
        <p role="status">
          Лимиты не обновлены.{" "}
          <Button variant="link" onClick={() => void query.refetch()}>
            Повторить
          </Button>
        </p>
      )}
      {!limits.length && !query.isPending && !query.isError && (
        <p className="text-sm text-muted-foreground">
          Задайте общий бюджет или лимит на отдельную категорию.
        </p>
      )}
      <ul className="space-y-4">
        {limits.map((limit) => {
          const spent = limit.spentMinor;
          const remaining = limit.amountMinor - spent;
          const near = spent >= limit.amountMinor * 0.8;
          return (
            <li key={limit.id}>
              <div className="flex items-center justify-between gap-1">
                <span className="text-sm font-medium">{categoryName(limit.category)}</span>
                <div className="flex">
                  <Button
                    variant="icon"
                    iconOnly
                    aria-label={`Изменить лимит: ${categoryName(limit.category)}`}
                    onClick={() => setForm(limit)}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    variant="icon"
                    iconOnly
                    aria-label={`Удалить лимит: ${categoryName(limit.category)}`}
                    onClick={() => setRemove(limit)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </div>
              <p className="text-xs">
                {money(spent, currency)} из {money(limit.amountMinor, currency)}
              </p>
              <div aria-hidden="true" className="my-2 h-2 rounded-full bg-muted">
                <div
                  className={`h-full rounded-full ${remaining < 0 ? "bg-destructive" : near ? "bg-warning" : "bg-success"}`}
                  style={{ width: `${progress(spent, limit.amountMinor)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {remaining < 0
                  ? `Превышен на ${money(-remaining, currency)}`
                  : `${near ? "Близко к лимиту · " : ""}Осталось ${money(remaining, currency)}`}
              </p>
            </li>
          );
        })}
      </ul>
      {form && (
        <LimitForm
          currency={currency}
          month={month}
          limit={form === "new" ? undefined : form}
          onClose={() => setForm(null)}
        />
      )}
      {remove && (
        <ConfirmDelete
          title={`Лимит «${categoryName(remove.category)}»`}
          onClose={() => setRemove(null)}
          onDelete={() => write(`/limits/${remove.id}`, "delete")}
        />
      )}
    </Card>
  );
}
