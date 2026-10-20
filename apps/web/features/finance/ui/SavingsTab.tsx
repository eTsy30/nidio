"use client";
import { useState } from "react";
import { Plus } from "lucide-react";

import { Button, Card } from "@/shared/ui";

import { useFinance } from "../api/FinanceProvider";
import { tones } from "../model/constants";
import { money, progress } from "../model/money";
import type { Currency } from "../model/types";

import { ConfirmDelete } from "./FinanceDialog";
import { FinanceEmpty } from "./FinanceEmpty";
import { GoalDetails } from "./GoalDetails";
import { GoalForm } from "./GoalForm";
import { SavingsEntryForm } from "./SavingsEntryForm";
export function SavingsTab({ currency }: { currency: Currency }) {
  const { data, write } = useFinance();
  const [modal, setModal] = useState<{ kind: string; id?: string } | null>(null);
  const goals = data.goals.filter((goal) => goal.currency === currency);
  const goal = data.goals.find((g) => g.id === modal?.id);
  const total = goals.reduce((sum, g) => sum + g.currentMinor, 0);
  const active = goals.filter((g) => g.currentMinor < g.targetMinor).length;
  const close = () => setModal(null);
  return (
    <div className="space-y-5">
      <Card className="flex flex-wrap items-center justify-between gap-4 bg-primary/5">
        <div>
          <p className="text-sm text-muted-foreground">Накоплено вместе</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums">{money(total, currency)}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Активных целей: {active} · Всего: {goals.length}
          </p>
        </div>
        <Button onClick={() => setModal({ kind: "create" })} leftIcon={<Plus />}>
          Новая копилка
        </Button>
      </Card>
      {!goals.length ? (
        <FinanceEmpty title="С чего начнём мечтать?">
          Создайте первую общую цель — на отпуск, дом или маленькую радость для двоих.
        </FinanceEmpty>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {goals.map((g) => (
            <Card key={g.id} padding="sm" className="flex min-w-0 flex-col gap-4">
              <Button
                variant="plain"
                size="none"
                className="w-full text-left"
                onClick={() => setModal({ kind: "detail", id: g.id })}
              >
                <span
                  className={`mb-3 inline-flex size-12 items-center justify-center rounded-2xl text-2xl ${tones[g.color].surface}`}
                >
                  {g.icon}
                </span>
                <h3 className="break-words text-lg font-semibold">{g.title}</h3>
                <p className="mt-2 text-sm">
                  {money(g.currentMinor, currency)}{" "}
                  <span className="text-muted-foreground">из {money(g.targetMinor, currency)}</span>
                </p>
                <div
                  role="progressbar"
                  aria-label={g.title}
                  aria-valuenow={Math.round(progress(g.currentMinor, g.targetMinor))}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  className="mt-3 h-2 overflow-hidden rounded-full bg-muted"
                >
                  <div
                    className={`h-full rounded-full motion-safe:transition-[width] motion-safe:duration-500 ${tones[g.color].bar}`}
                    style={{ width: `${progress(g.currentMinor, g.targetMinor)}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {g.currentMinor >= g.targetMinor
                    ? "✓ Цель достигнута"
                    : `Осталось ${money(g.targetMinor - g.currentMinor, currency)}`}{" "}
                  · {Math.round(progress(g.currentMinor, g.targetMinor))}%
                </p>
              </Button>
              <Button
                variant="secondary"
                fullWidth
                onClick={() => setModal({ kind: "deposit", id: g.id })}
              >
                Пополнить
              </Button>
            </Card>
          ))}
        </div>
      )}
      {modal?.kind === "create" && <GoalForm currency={currency} onClose={close} />}
      {goal && modal?.kind === "detail" && (
        <GoalDetails
          goal={goal}
          onClose={close}
          action={(kind) => setModal({ kind, id: goal.id })}
        />
      )}
      {goal && modal?.kind === "edit" && (
        <GoalForm goal={goal} currency={currency} onClose={close} />
      )}
      {goal && ["deposit", "withdrawal"].includes(modal?.kind ?? "") && (
        <SavingsEntryForm goal={goal} withdrawal={modal?.kind === "withdrawal"} onClose={close} />
      )}
      {goal && modal?.kind === "delete" && (
        <ConfirmDelete
          title={`Копилка «${goal.title}» и вся её история будут удалены.`}
          onClose={close}
          onDelete={() => write(`/goals/${goal.id}`, "delete")}
        />
      )}
    </div>
  );
}
