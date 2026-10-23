"use client";
import { useRef, useState } from "react";

import { Button, ChoiceButton, Input } from "@/shared/ui";

import { useFinance } from "../api/FinanceProvider";
import { money, moneyInput, parseMoney } from "../model/money";
import { amountLabel } from "../model/savings-strategy";
import type { Goal } from "../model/types";

import { SavingsDialog } from "./savings/SavingsDialog";

export function SavingsEntryForm({
  goal,
  withdrawal,
  onClose,
  suggestedMinor = 0,
}: {
  goal: Goal;
  withdrawal: boolean;
  onClose: () => void;
  suggestedMinor?: number;
}) {
  const { write } = useFinance();
  const [taking, setTaking] = useState(withdrawal);
  const [amount, setAmount] = useState(suggestedMinor ? moneyInput(suggestedMinor) : "");
  const request = useRef({ fingerprint: "", id: crypto.randomUUID() });
  const remaining = Math.max(0, goal.targetMinor - goal.currentMinor);
  const base =
    suggestedMinor || Math.max(100, 10 ** Math.floor(Math.log10(Math.max(100, remaining / 10))));
  const quick = [
    ...new Set(
      [base, base * 2, base * 5].map((value) =>
        taking ? Math.min(value, goal.currentMinor) : value,
      ),
    ),
  ].filter((value) => value > 0 && value <= 2000000000);
  let validAmount = 0;
  try {
    validAmount = parseMoney(amount);
  } catch {
    /* Validate before submitting. */
  }
  return (
    <SavingsDialog
      title={taking ? "Снять из копилки" : "Пополнить"}
      description={goal.title}
      onClose={onClose}
      submitLabel={taking ? "Снять" : "Отложить"}
      disabled={!validAmount || (taking && validAmount > goal.currentMinor)}
      onSubmit={() => {
        const body = {
          amountMinor: parseMoney(amount),
          type: taking ? "WITHDRAWAL" : "DEPOSIT",
          description: "",
        };
        const fingerprint = JSON.stringify(body);
        if (fingerprint !== request.current.fingerprint)
          request.current = { fingerprint, id: crypto.randomUUID() };
        return write(`/goals/${goal.id}/entries`, "post", {
          ...body,
          requestId: request.current.id,
        });
      }}
    >
      <p className="truncate text-center text-sm text-muted-foreground">{goal.title}</p>
      <div className="flex gap-2" role="group" aria-label="Операция">
        <ChoiceButton
          selected={!taking}
          onClick={() => setTaking(false)}
          className="flex-1 shadow-none"
        >
          Пополнить
        </ChoiceButton>
        <ChoiceButton
          selected={taking}
          onClick={() => setTaking(true)}
          className="flex-1 shadow-none"
          disabled={!goal.currentMinor}
        >
          Снять
        </ChoiceButton>
      </div>
      <div className="py-6">
        <Input
          aria-label={`Сумма в ${goal.currency}`}
          inputMode="decimal"
          autoFocus
          variant="ghost"
          className="h-20 text-center text-4xl font-semibold tabular-nums shadow-none"
          placeholder="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          maxLength={12}
        />
        <p className="mt-2 text-center text-sm text-muted-foreground">{goal.currency}</p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {quick.map((minor) => (
          <Button
            key={minor}
            variant="secondary"
            size="sm"
            className="shadow-none"
            onClick={() => setAmount(moneyInput(minor))}
          >
            {amountLabel(minor)}
          </Button>
        ))}
      </div>
      <p className="text-center text-sm text-muted-foreground">
        В копилке {money(goal.currentMinor, goal.currency)}
      </p>
      {taking && validAmount > goal.currentMinor && (
        <p role="alert" className="text-sm text-destructive">
          В копилке недостаточно средств
        </p>
      )}
      <p className="text-center text-xs text-muted-foreground">
        Вы отмечаете отложенные деньги. Переводить их приложение не будет.
      </p>
    </SavingsDialog>
  );
}
