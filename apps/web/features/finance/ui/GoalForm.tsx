"use client";
import { useState } from "react";

import { Input, Select, Textarea } from "@/shared/ui";

import { useFinance } from "../api/FinanceProvider";
import { icons } from "../model/constants";
import { moneyInput, parseMoney } from "../model/money";
import type { Currency, Goal, Tone } from "../model/types";

import { FinanceDialog } from "./FinanceDialog";
import { AmountField, CurrencyField, ToneField } from "./FinanceFields";
export function GoalForm({
  goal,
  currency: initialCurrency,
  onClose,
}: {
  goal?: Goal;
  currency: Currency;
  onClose: () => void;
}) {
  const { write } = useFinance();
  const [title, setTitle] = useState(goal?.title ?? "");
  const [description, setDescription] = useState(goal?.description ?? "");
  const [amount, setAmount] = useState(goal ? moneyInput(goal.targetMinor) : "");
  const currency = goal?.currency ?? initialCurrency;
  const [icon, setIcon] = useState(goal?.icon ?? "🎯");
  const [color, setColor] = useState<Tone>(goal?.color ?? "primary");
  const [date, setDate] = useState(goal?.targetDate ?? "");
  return (
    <FinanceDialog
      title={goal ? "Изменить копилку" : "Новая копилка"}
      onClose={onClose}
      onSubmit={() =>
        write(`/goals${goal ? `/${goal.id}` : ""}`, goal ? "patch" : "post", {
          title: title.trim(),
          description,
          targetMinor: parseMoney(amount),
          currency,
          icon,
          color,
          targetDate: date || null,
        })
      }
    >
      <Input
        label="На что копим?"
        required
        maxLength={100}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Наш отпуск"
      />
      <div className="grid grid-cols-2 gap-3">
        <AmountField label="Цель" value={amount} onChange={setAmount} />
        <CurrencyField value={currency} disabled />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Select label="Значок" value={icon} onChange={(e) => setIcon(e.target.value)}>
          {icons.map((i) => (
            <option key={i}>{i}</option>
          ))}
        </Select>
        <ToneField value={color} onChange={setColor} />
      </div>
      <Input
        label="Дата цели · необязательно"
        type="date"
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
