"use client";
import { useState } from "react";
import { addDays, addMonths } from "date-fns";

import { Input, Select } from "@/shared/ui";

import { money, parseMoney } from "../model/money";
import type { Goal } from "../model/types";

export function SavingsForecast({ goal }: { goal: Goal }) {
  const [amount, setAmount] = useState("50");
  const [period, setPeriod] = useState("week");
  let minor = 0;
  try {
    minor = parseMoney(amount);
  } catch {
    /* Show an actionable empty forecast. */
  }
  const remaining = Math.max(0, goal.targetMinor - goal.currentMinor);
  const periods = minor > 0 ? Math.ceil(remaining / minor) : 0;
  const date =
    period === "month"
      ? addMonths(new Date(), periods)
      : addDays(new Date(), periods * (period === "week" ? 7 : 1));
  return (
    <section className="space-y-3 rounded-xl bg-muted/50 p-4">
      <h3 className="text-lg">А если откладывать…</h3>
      <div className="grid grid-cols-2 gap-3">
        <Input
          label={`Сумма, ${goal.currency}`}
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <Select label="Период" value={period} onChange={(e) => setPeriod(e.target.value)}>
          <option value="day">Каждый день</option>
          <option value="week">Каждую неделю</option>
          <option value="month">Каждый месяц</option>
        </Select>
      </div>
      <p aria-live="polite" className="text-sm">
        {!remaining
          ? "Цель уже достигнута"
          : minor <= 0
            ? "Укажите положительную сумму"
            : Number.isFinite(date.getTime()) && date.getFullYear() < 10000
              ? `Плановый прогноз: ${date.toLocaleDateString("ru-RU")}`
              : "При этой сумме срок слишком большой"}
      </p>
      <p className="text-xs text-muted-foreground">
        Осталось {money(remaining, goal.currency)}. Это сценарий, он не меняет цель и историю.
      </p>
    </section>
  );
}
