"use client";
import { useState } from "react";

import { Input } from "@/shared/ui";

import { useFinance } from "../api/FinanceProvider";
import { money, parseMoney } from "../model/money";
import type { Goal } from "../model/types";

import { FinanceDialog } from "./FinanceDialog";
import { AmountField } from "./FinanceFields";
export function SavingsEntryForm({
  goal,
  withdrawal,
  onClose,
}: {
  goal: Goal;
  withdrawal: boolean;
  onClose: () => void;
}) {
  const { write } = useFinance();
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [requestId] = useState(() => crypto.randomUUID());
  return (
    <FinanceDialog
      title={withdrawal ? "Снять из копилки" : "Пополнить копилку"}
      description={`${goal.title} · доступно ${money(goal.currentMinor, goal.currency)}`}
      onClose={onClose}
      submitLabel={withdrawal ? "Подтвердить снятие" : "Пополнить"}
      onSubmit={() => {
        const amountMinor = parseMoney(amount);
        if (withdrawal && amountMinor > goal.currentMinor)
          throw new Error("В копилке недостаточно средств");
        return write(`/goals/${goal.id}/entries`, "post", {
          requestId,
          amountMinor,
          type: withdrawal ? "WITHDRAWAL" : "DEPOSIT",
          description,
        });
      }}
    >
      <AmountField value={amount} onChange={setAmount} />
      <Input
        label="Комментарий · необязательно"
        value={description}
        maxLength={1000}
        onChange={(e) => setDescription(e.target.value)}
      />
      {withdrawal && (
        <p className="text-sm text-muted-foreground">
          Вы подтверждаете снятие этой суммы. Операция останется в истории.
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        Это запись накоплений, а не банковский перевод. Баланс бюджета не изменится.
      </p>
    </FinanceDialog>
  );
}
