"use client";
import { useState } from "react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, PiggyBank, Plus } from "lucide-react";

import { Button, ChoiceButton } from "@/shared/ui";

import { useFinance } from "../api/FinanceProvider";
import { money, progress } from "../model/money";
import { strategyLabels, strategyOf } from "../model/savings-strategy";
import type { Currency } from "../model/types";

import { PiggyBankScopeSelect } from "./cards/PiggyBankScopeSelect";
import { CurrencyField } from "./FinanceFields";
import { GoalForm } from "./GoalForm";

export function SavingsTab({
  currency,
  onCurrency,
}: {
  currency: Currency;
  onCurrency?: (currency: Currency) => void;
}) {
  const router = useRouter();
  const { data } = useFinance();
  const [scope, setScope] = useState("all");
  const [creating, setCreating] = useState(false);
  const goals = data.goals.filter(
    (goal) => goal.currency === currency && (scope === "all" || (goal.scope ?? "COUPLE") === scope),
  );
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Копилки</h1>
          <p className="mt-2 text-sm text-muted-foreground">Маленькие шаги к большим планам</p>
        </div>
        <Button leftIcon={<Plus />} onClick={() => setCreating(true)} className="shadow-none">
          Создать копилку
        </Button>
      </div>
      <div className="flex w-full items-center justify-between gap-2">
        <div className="w-[200px] shrink-0">
          <CurrencyField value={currency} {...(onCurrency ? { onChange: onCurrency } : {})} />
        </div>

        <div className="w-[200px] shrink-0">
          <PiggyBankScopeSelect value={scope} onChange={setScope} />
        </div>
      </div>
      {!goals.length ? (
        <div className="flex flex-col items-center gap-4 py-10 text-center">
          <PiggyBank className="size-12 text-primary" />
          <h2 className="text-xl font-semibold">На что будем копить?</h2>
          <p className="max-w-xs text-sm text-muted-foreground">
            Назовите цель, укажите сумму и выберите удобный способ накопления.
          </p>
          <Button variant="secondary" onClick={() => setCreating(true)}>
            Создать первую копилку
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {goals.map((goal) => (
            <NextLink
              key={goal.id}
              href={`/savings/${goal.id}`}
              className="block min-w-0 rounded-[var(--radius-md)] border border-border bg-card p-5 text-foreground transition-colors hover:border-primary/40 hover:no-underline"
            >
              <div className="flex items-start gap-3">
                <span
                  className="flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-muted text-xl"
                  aria-hidden="true"
                >
                  {goal.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="break-words text-base font-semibold">{goal.title}</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {goal.archived
                      ? "В архиве"
                      : goal.currentMinor >= goal.targetMinor
                        ? "Цель достигнута"
                        : strategyLabels[strategyOf(goal)]}
                  </p>
                </div>
                <ChevronRight className="mt-2 size-4 shrink-0 text-muted-foreground" />
              </div>
              <p className="mt-5 flex flex-wrap items-baseline gap-x-2">
                <strong className="text-lg tabular-nums">
                  {money(goal.currentMinor, currency)}
                </strong>
                <span className="text-xs text-muted-foreground">
                  из {money(goal.targetMinor, currency)}
                </span>
              </p>
              <div
                role="progressbar"
                aria-label={goal.title}
                aria-valuenow={Math.round(progress(goal.currentMinor, goal.targetMinor))}
                aria-valuemin={0}
                aria-valuemax={100}
                className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted"
              >
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${progress(goal.currentMinor, goal.targetMinor)}%` }}
                />
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                {goal.scope === "PERSONAL" ? "Личная" : "Общая"} ·{" "}
                {Math.round(progress(goal.currentMinor, goal.targetMinor))}%
              </p>
            </NextLink>
          ))}
        </div>
      )}
      {creating && (
        <GoalForm
          currency={currency}
          onClose={() => setCreating(false)}
          onCreated={(id) => router.push(`/savings/${id}`)}
        />
      )}
    </div>
  );
}
