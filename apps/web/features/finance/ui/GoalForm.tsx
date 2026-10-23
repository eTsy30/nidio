"use client";
import { useState } from "react";
import { ChevronRight } from "lucide-react";

import { Button, ChoiceButton, Input } from "@/shared/ui";

import { useFinance } from "../api/FinanceProvider";
import { moneyInput, parseMoney } from "../model/money";
import {
  automaticGrid,
  scheduledContribution,
  strategyLabels,
  strategyOf,
  todayDate,
} from "../model/savings-strategy";
import type { Currency, Goal } from "../model/types";

import { SavingsDialog } from "./savings/SavingsDialog";
import { SavingsGoalIdentity } from "./savings/SavingsGoalIdentity";
import { SavingsStrategyPicker, type StrategyDraft } from "./savings/SavingsStrategyPicker";

import styles from "./savings/savings.module.css";

export function GoalForm({
  goal,
  currency: initialCurrency,
  onClose,
  onCreated,
}: {
  goal?: Goal;
  currency: Currency;
  onClose: () => void;
  onCreated?: (id: string) => void;
}) {
  const { write } = useFinance();
  const [scope, setScope] = useState(goal?.scope ?? "COUPLE");
  const [title, setTitle] = useState(goal?.title ?? "");
  const [amount, setAmount] = useState(goal ? moneyInput(goal.targetMinor) : "");
  const [currency, setCurrency] = useState(goal?.currency ?? initialCurrency);
  const [date, setDate] = useState(goal?.targetDate ?? "");
  const [choosing, setChoosing] = useState(false);
  const [changedPlan, setChangedPlan] = useState(false);
  const [draft, setDraft] = useState<StrategyDraft>({
    kind: goal ? strategyOf(goal) : "FREE",
    order: goal?.gridOrder ?? "ASC",
    count: 24,
    equal: false,
    every: goal?.scheduleEvery ?? "MONTH",
    amount: goal?.scheduleAmountMinor ? moneyInput(goal.scheduleAmountMinor) : "",
  });
  let targetMinor = 0;
  try {
    targetMinor = parseMoney(amount);
  } catch {
    /* Keep empty input editable. */
  }
  const remaining = Math.max(0, targetMinor - (goal?.currentMinor ?? 0));
  const completed = new Set(
    goal?.transactions.filter((entry) => !entry.cancelledAt).map((entry) => entry.stepId),
  );
  const completedCount = goal?.plan?.filter((step) => completed.has(step.id)).length ?? 0;
  const count = Math.max(1, Math.min(draft.count, 120 - completedCount));
  const amounts = automaticGrid(remaining, count, draft.equal, draft.order === "SHUFFLE");
  const replacePlan =
    draft.kind === "GRID" &&
    (!goal || strategyOf(goal) !== "GRID" || changedPlan || targetMinor !== goal.targetMinor);
  const preview = replacePlan
    ? amounts
    : (goal?.plan ?? [])
        .filter(
          (step) =>
            !goal?.transactions.some((entry) => entry.stepId === step.id && !entry.cancelledAt),
        )
        .map((step) => step.amountMinor);
  const scheduled = scheduledContribution({
    ...goal,
    targetMinor,
    currentMinor: goal?.currentMinor ?? 0,
    transactions: goal?.transactions ?? [],
    targetDate: date || null,
    scheduleEvery: draft.every,
    scheduleStartDate: goal?.scheduleStartDate ?? todayDate(),
  } as Goal);
  async function save() {
    if (choosing) {
      if (draft.kind === "SCHEDULE" && !date) parseMoney(draft.amount);
      setChoosing(false);
      return;
    }
    const result = await write(`/goals${goal ? `/${goal.id}` : ""}`, goal ? "patch" : "post", {
      title: title.trim(),
      targetMinor: parseMoney(amount),
      currency,
      scope,
      targetDate: date || null,
      description: goal?.description ?? "",
      icon: goal?.icon ?? "🎯",
      color: goal?.color ?? "primary",
      strategy: draft.kind,
      gridOrder: draft.order,
      scheduleEvery: draft.kind === "SCHEDULE" ? draft.every : null,
      scheduleAmountMinor: draft.kind === "SCHEDULE" && !date ? parseMoney(draft.amount) : null,
      scheduleStartDate:
        draft.kind === "SCHEDULE" ? (goal?.scheduleStartDate ?? todayDate()) : null,
      ...(replacePlan ? { planAmounts: amounts } : {}),
    });
    if (!goal && result && typeof result === "object" && "id" in result)
      onCreated?.(String(result.id));
  }
  return (
    <SavingsDialog
      title={choosing ? "Стратегия" : goal ? "Изменить копилку" : "Новая копилка"}
      description="Название, сумма и удобный способ накопления"
      onClose={onClose}
      onBack={choosing ? () => setChoosing(false) : undefined}
      onSubmit={save}
      closeOnSubmit={!choosing}
      submitLabel={
        choosing ? "Использовать стратегию" : goal ? "Сохранить изменения" : "Создать копилку"
      }
      disabled={!choosing && (!title.trim() || !targetMinor)}
    >
      {choosing ? (
        <SavingsStrategyPicker
          value={draft}
          onChange={(value) => {
            setDraft(value);
            setChangedPlan(true);
          }}
          amounts={preview}
          currency={currency}
          hasDeadline={Boolean(date)}
          scheduledAmount={scheduled.amountMinor}
        />
      ) : (
        <>
          <SavingsGoalIdentity
            title={title}
            amount={amount}
            currency={currency}
            locked={Boolean(goal?.transactions.length)}
            onTitleChange={setTitle}
            onAmountChange={setAmount}
            onCurrencyChange={setCurrency}
          />
          <div className="flex gap-2" role="group" aria-label="Кому доступна копилка">
            {(
              [
                ["PERSONAL", "Личная"],
                ["COUPLE", "Общая"],
              ] as const
            ).map(([value, label]) => (
              <ChoiceButton
                key={value}
                selected={scope === value}
                disabled={Boolean(goal)}
                onClick={() => setScope(value)}
                className="flex-1 shadow-none"
              >
                {label}
              </ChoiceButton>
            ))}
          </div>
          <div className={`${styles.group} space-y-4`}>
            <Input
              type="date"
              label="Срок · необязательно"
              value={date}
              min={goal ? (goal.scheduleStartDate ?? goal.targetDate ?? undefined) : todayDate()}
              onChange={(e) => setDate(e.target.value)}
              className="shadow-none"
            />
            <Button
              variant="plain"
              size="none"
              className="flex min-h-14 w-full items-center justify-between gap-3 text-left"
              onClick={() => setChoosing(true)}
            >
              <span>
                <span className="block text-sm text-muted-foreground">Стратегия</span>
                <span className="mt-1 block font-semibold">{strategyLabels[draft.kind]}</span>
              </span>
              <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
            </Button>
          </div>
          {draft.kind === "GRID" && (
            <p className="text-sm text-muted-foreground">
              {preview.length} новых клеточек ·{" "}
              {draft.order === "ASC" ? "по возрастанию" : "вперемешку"}
              {goal ? ". Уже отмеченные сохранятся." : ""}
            </p>
          )}
          {draft.kind === "SCHEDULE" && (
            <p className="text-sm text-muted-foreground">
              {draft.every === "WEEK" ? "Еженедельные" : "Ежемесячные"} взносы
              {date ? " с расчётом по сроку цели" : " с вашей суммой"}.
            </p>
          )}
        </>
      )}
    </SavingsDialog>
  );
}
