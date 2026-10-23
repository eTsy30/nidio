"use client";
import { useState } from "react";
import { RefreshCw } from "lucide-react";

import { Button, Input, Select } from "@/shared/ui";

import { useFinance } from "../api/FinanceProvider";
import { money, moneyInput, parseMoney } from "../model/money";
import { createAmounts, type PlanMode } from "../model/savings-plan";
import type { Goal } from "../model/types";

import { FinanceDialog } from "./FinanceDialog";

export function SavingsPlanEditor({ goal, onClose }: { goal: Goal; onClose: () => void }) {
  const { write } = useFinance();
  const completed = (goal.plan ?? []).filter((step) =>
    goal.transactions.some((entry) => entry.stepId === step.id && !entry.cancelledAt),
  );
  const fixed = completed.reduce((sum, step) => sum + step.amountMinor, 0);
  const [mode, setMode] = useState<PlanMode>("equal");
  const [target, setTarget] = useState(moneyInput(goal.targetMinor));
  const [count, setCount] = useState("30");
  const [denominations, setDenominations] = useState("100, 200, 300");
  const [amounts, setAmounts] = useState<string[] | null>(null);
  const [error, setError] = useState("");
  let targetMinor = 0;
  let total = fixed;
  let valid = true;
  try {
    targetMinor = parseMoney(target);
    total += (amounts ?? []).reduce((sum, n) => sum + parseMoney(n), 0);
  } catch {
    valid = false;
  }
  const matches =
    valid && amounts !== null && total === targetMinor && completed.length + amounts.length <= 120;
  function generate() {
    try {
      const remaining = parseMoney(target) - fixed;
      if (remaining < 0) throw new Error("Цель не может быть меньше суммы выполненных этапов");
      const next =
        remaining === 0
          ? []
          : createAmounts(
              remaining,
              mode,
              Number(count),
              mode === "denominations"
                ? denominations
                    .split(/[,;\s]+/)
                    .filter(Boolean)
                    .map(parseMoney)
                : [],
            );
      if (completed.length + next.length > 120)
        throw new Error(
          `Доступно ещё ${120 - completed.length} кнопок. Уменьшите количество или увеличьте номиналы`,
        );
      setAmounts(next.map(moneyInput));
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Проверьте настройки плана");
    }
  }
  return (
    <FinanceDialog
      title={goal.plan?.length ? "Изменить будущие взносы" : "Соберите свой план"}
      description="Сумма всех кнопок точно совпадает с целью. Выполненные этапы сохраняются."
      onClose={onClose}
      submitLabel="Сохранить план"
      submitDisabled={!matches}
      onSubmit={() =>
        write(`/goals/${goal.id}/plan`, "post", {
          count: Math.max(1, amounts?.length ?? 1),
          varied: mode === "random",
          targetMinor,
          amounts: amounts!.map(parseMoney),
        })
      }
    >
      <Input
        label={`Цель, ${goal.currency}`}
        inputMode="decimal"
        value={target}
        onChange={(e) => {
          setTarget(e.target.value);
          setAmounts(null);
        }}
      />
      <Select
        label="Какими суммами удобно откладывать?"
        value={mode}
        onChange={(e) => {
          setMode(e.target.value as PlanMode);
          setAmounts(null);
        }}
      >
        <option value="equal">Одинаковые суммы</option>
        <option value="denominations">Мои номиналы — 100, 200, 300…</option>
        <option value="random">Случайные суммы</option>
      </Select>
      {mode === "denominations" ? (
        <Input
          label={`Номиналы, ${goal.currency} · через запятую`}
          value={denominations}
          onChange={(e) => {
            setDenominations(e.target.value);
            setAmounts(null);
          }}
          description="Например: 100, 200, 300. Последняя кнопка может быть меньше — для точного итога."
        />
      ) : (
        <Input
          label="Количество новых кнопок"
          type="number"
          min={1}
          max={120 - completed.length}
          value={count}
          onChange={(e) => {
            setCount(e.target.value);
            setAmounts(null);
          }}
        />
      )}
      <Button
        variant="secondary"
        fullWidth
        leftIcon={<RefreshCw className="size-4" />}
        onClick={generate}
      >
        {amounts ? "Предложить другой вариант" : "Показать суммы"}
      </Button>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {amounts !== null && (
        <section className="space-y-3">
          <p className="text-sm font-semibold">
            {amounts.length} новых кнопок · каждую сумму можно изменить
          </p>
          <div className="grid max-h-60 grid-cols-2 gap-2 overflow-y-auto p-1 sm:grid-cols-3">
            {amounts.map((value, index) => (
              <Input
                key={index}
                aria-label={`Сумма кнопки ${index + 1}, ${goal.currency}`}
                inputMode="decimal"
                value={value}
                onChange={(e) =>
                  setAmounts(amounts.map((n, i) => (i === index ? e.target.value : n)))
                }
              />
            ))}
          </div>
          <p
            aria-live="polite"
            className={`text-sm ${matches ? "text-muted-foreground" : "text-destructive"}`}
          >
            {valid
              ? `Итого: ${money(total, goal.currency)} из ${money(targetMinor, goal.currency)}${total !== targetMinor ? ` · разница ${money(targetMinor - total, goal.currency)}` : " · суммы совпадают"}`
              : "Укажите положительные суммы с точностью до копеек"}
          </p>
          {fixed > 0 && (
            <p className="text-xs text-muted-foreground">
              В итог включены выполненные этапы: {money(fixed, goal.currency)}.
            </p>
          )}
        </section>
      )}
    </FinanceDialog>
  );
}
