"use client";
import { useState } from "react";

import { ChoiceButton, Input, Select, Textarea } from "@/shared/ui";

import { useFinance } from "../api/FinanceProvider";
import { expenseCategories, incomeCategories } from "../model/constants";
import { moneyInput, parseMoney } from "../model/money";
import { dateKey } from "../model/period";
import type { Currency, FinancialEntry } from "../model/types";

import { FinanceDialog } from "./FinanceDialog";
import { AmountField, CurrencyField } from "./FinanceFields";
export function EntryForm({
  entry,
  currency: initialCurrency,
  onClose,
}: {
  entry?: FinancialEntry;
  currency: Currency;
  onClose: () => void;
}) {
  const { write } = useFinance();
  const [type, setType] = useState<"INCOME" | "EXPENSE">(entry?.type ?? "EXPENSE");
  const [amount, setAmount] = useState(entry ? moneyInput(entry.amountMinor) : "");
  const currency = entry?.currency ?? initialCurrency;
  const [category, setCategory] = useState(entry?.category ?? "groceries");
  const [date, setDate] = useState(entry?.date ?? dateKey());
  const [description, setDescription] = useState(entry?.description ?? "");
  const [requestId] = useState(() => entry?.requestId ?? crypto.randomUUID());
  return (
    <FinanceDialog
      title={entry ? "Изменить операцию" : "Новая операция"}
      onClose={onClose}
      onSubmit={() =>
        write(`/transactions${entry ? `/${entry.id}` : ""}`, entry ? "patch" : "post", {
          amountMinor: parseMoney(amount),
          currency,
          type,
          category,
          date,
          description,
          requestId,
        })
      }
    >
      <div className="grid grid-cols-2 gap-2">
        {(["EXPENSE", "INCOME"] as const).map((t) => (
          <ChoiceButton
            key={t}
            selected={type === t}
            onClick={() => {
              setType(t);
              setCategory(t === "INCOME" ? "salary" : "groceries");
            }}
          >
            {t === "INCOME" ? "+ Доход" : "− Расход"}
          </ChoiceButton>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <AmountField value={amount} onChange={setAmount} />
        <CurrencyField value={currency} disabled />
      </div>
      <Select label="Категория" value={category} onChange={(e) => setCategory(e.target.value)}>
        {Object.entries(type === "INCOME" ? incomeCategories : expenseCategories).map(
          ([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ),
        )}
      </Select>
      <Input
        label="Дата"
        type="date"
        required
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />
      <label className="block space-y-2 text-sm font-semibold">
        Описание
        <Textarea
          maxLength={2000}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </label>
    </FinanceDialog>
  );
}
