"use client";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/shared/ui";

import { useFinance } from "../api/FinanceProvider";
import { money } from "../model/money";
import { amountLabel } from "../model/savings-strategy";
import type { Goal, SavingsEntry } from "../model/types";

import { savingsError } from "./savings/SavingsDialog";

import styles from "./savings/savings.module.css";

export function SavingsPlan({ goal }: { goal: Goal }) {
  const { write, name } = useFinance();
  const locks = useRef(new Set<string>());
  const requests = useRef(new Map<string, string>());
  const [pending, setPending] = useState<string[]>([]);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [undoEntry, setUndoEntry] = useState<SavingsEntry | null>(null);
  const [undoing, setUndoing] = useState(false);
  const steps = [...(goal.plan ?? [])];
  if (goal.gridOrder !== "SHUFFLE") steps.sort((a, b) => a.amountMinor - b.amountMinor);
  const entries = new Map(
    goal.transactions
      .filter((entry) => entry.stepId && !entry.cancelledAt)
      .map((entry) => [entry.stepId, entry]),
  );
  async function undo(entry: SavingsEntry) {
    setUndoing(true);
    setError("");
    try {
      await write(`/goals/${goal.id}/entries/${entry.id}/cancel`, "post", undefined, {
        silent: true,
      });
      setUndoEntry(null);
      toast.success("Взнос отменён");
    } catch (error) {
      setError(savingsError(error));
    } finally {
      setUndoing(false);
    }
  }
  async function deposit(step: { id: string; amountMinor: number }) {
    if (locks.current.has(step.id) || entries.has(step.id) || goal.archived) return;
    locks.current.add(step.id);
    setPending((ids) => [...ids, step.id]);
    setError("");
    const requestId = requests.current.get(step.id) ?? crypto.randomUUID();
    requests.current.set(step.id, requestId);
    try {
      const result = (await write(
        `/goals/${goal.id}/entries`,
        "post",
        {
          requestId,
          stepId: step.id,
          amountMinor: step.amountMinor,
          type: "DEPOSIT",
          description: "",
        },
        { silent: true },
      )) as SavingsEntry;
      requests.current.delete(step.id);
      setLastSaved(step.id);
      setUndoEntry(result);
      toast.success(`Отложено ${money(step.amountMinor, goal.currency)}`, {
        action: {
          label: "Отменить",
          onClick: () => {
            void undo(result);
          },
        },
      });
    } catch (error) {
      setError(savingsError(error));
    } finally {
      locks.current.delete(step.id);
      setPending((ids) => ids.filter((id) => id !== step.id));
    }
  }
  return (
    <section className="space-y-3" aria-labelledby="savings-grid-title">
      <div className="flex items-baseline justify-between gap-2">
        <h2 id="savings-grid-title" className="text-lg font-semibold">
          Ваша копилка
        </h2>
        <span className="text-xs text-muted-foreground">
          {entries.size} из {steps.length} · {goal.currency}
        </span>
      </div>
      <p className="text-sm text-muted-foreground">Нажмите на сумму, которую отложили.</p>
      <div
        className="grid grid-cols-4 gap-2 sm:grid-cols-6 sm:gap-3"
        aria-busy={pending.length > 0}
      >
        {steps.map((step) => {
          const entry = entries.get(step.id);
          return (
            <Button
              key={step.id}
              variant="plain"
              size="none"
              disabled={Boolean(entry) || goal.archived || pending.includes(step.id)}
              className={`${styles.tile} text-sm sm:text-base`}
              data-complete={Boolean(entry)}
              data-pending={pending.includes(step.id)}
              data-recent={lastSaved === step.id}
              aria-label={`${money(step.amountMinor, goal.currency)}, ${entry ? `внесено: ${name(entry.createdBy)}` : "отложить"}`}
              title={entry ? `Внесено: ${name(entry.createdBy)}` : undefined}
              onClick={() => {
                void deposit(step);
              }}
            >
              <span className={entry ? "line-through decoration-primary-foreground/40" : ""}>
                {amountLabel(step.amountMinor)}
              </span>
            </Button>
          );
        })}
      </div>
      {undoEntry && (
        <div role="status" className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span>Отложено {money(undoEntry.amountMinor, goal.currency)}</span>
          <Button variant="link" size="sm" loading={undoing} onClick={() => void undo(undoEntry)}>
            Отменить
          </Button>
        </div>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </section>
  );
}
