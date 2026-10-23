import { CalendarDays, Grid2X2, Wallet } from "lucide-react";

import { Button, ChoiceButton, Input, Select } from "@/shared/ui";

import { money } from "../../model/money";
import { amountLabel, strategyLabels } from "../../model/savings-strategy";
import type { Currency, SavingsPeriod, SavingsStrategy } from "../../model/types";

import styles from "./savings.module.css";

export interface StrategyDraft {
  kind: SavingsStrategy;
  order: "ASC" | "SHUFFLE";
  count: number;
  equal: boolean;
  every: SavingsPeriod;
  amount: string;
}
export function SavingsStrategyPicker({
  value,
  onChange,
  amounts,
  currency,
  hasDeadline,
  scheduledAmount,
}: {
  value: StrategyDraft;
  onChange: (value: StrategyDraft) => void;
  amounts: number[];
  currency: Currency;
  hasDeadline: boolean;
  scheduledAmount: number;
}) {
  const set = (patch: Partial<StrategyDraft>) => onChange({ ...value, ...patch });
  return (
    <>
      <div className="space-y-2" role="group" aria-label="Способ накопления">
        {(
          [
            ["GRID", Grid2X2, "Отмечайте суммы на клеточках"],
            ["SCHEDULE", CalendarDays, "Взнос каждую неделю или месяц"],
            ["FREE", Wallet, "Любая сумма, когда удобно"],
          ] as const
        ).map(([kind, Icon, description]) => (
          <Button
            key={kind}
            variant="plain"
            size="none"
            aria-pressed={value.kind === kind}
            onClick={() => set({ kind })}
            className={`flex w-full items-center gap-3 rounded-[var(--radius-md)] border p-4 text-left ${value.kind === kind ? "border-primary bg-primary/5" : "border-border bg-card"}`}
          >
            <Icon className="size-5 shrink-0 text-primary" />
            <span>
              <span className="block font-semibold">{strategyLabels[kind]}</span>
              <span className="mt-1 block text-sm text-muted-foreground">{description}</span>
            </span>
          </Button>
        ))}
      </div>
      {value.kind === "GRID" && (
        <>
          <div className="flex gap-2" role="group" aria-label="Порядок сумм">
            <ChoiceButton
              selected={value.order === "ASC"}
              onClick={() => set({ order: "ASC" })}
              className="flex-1 px-2 text-xs shadow-none"
            >
              По возрастанию
            </ChoiceButton>
            <ChoiceButton
              selected={value.order === "SHUFFLE"}
              onClick={() => set({ order: "SHUFFLE" })}
              className="flex-1 px-2 text-xs shadow-none"
            >
              Вперемешку
            </ChoiceButton>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Количество"
              value={value.count}
              onChange={(e) => set({ count: Number(e.target.value) })}
            >
              {[16, 24, 32, 48, 64].map((count) => (
                <option key={count} value={count}>
                  {count} клеточки
                </option>
              ))}
            </Select>
            <Select
              label="Суммы"
              value={value.equal ? "equal" : "varied"}
              onChange={(e) => set({ equal: e.target.value === "equal" })}
            >
              <option value="varied">Разные</option>
              <option value="equal">Одинаковые</option>
            </Select>
          </div>
          <div>
            <p className="mb-3 text-sm text-muted-foreground">
              {amounts.length} клеточек ·{" "}
              {money(
                amounts.reduce((sum, n) => sum + n, 0),
                currency,
              )}
            </p>
            <div
              className="grid grid-cols-4 gap-2 sm:grid-cols-6"
              aria-label="Предпросмотр клеточек"
            >
              {amounts.map((amount, i) => (
                <div key={i} className={`${styles.tile} flex items-center justify-center text-sm`}>
                  {amountLabel(amount)}
                </div>
              ))}
            </div>
            {!amounts.length && (
              <p className="text-sm text-muted-foreground">
                Введите сумму цели, чтобы увидеть клеточки.
              </p>
            )}
          </div>
        </>
      )}
      {value.kind === "SCHEDULE" && (
        <div className={`${styles.group} space-y-4`}>
          <Select
            label="Как часто"
            value={value.every}
            onChange={(e) => set({ every: e.target.value as SavingsPeriod })}
          >
            <option value="WEEK">Каждую неделю</option>
            <option value="MONTH">Каждый месяц</option>
          </Select>
          {hasDeadline ? (
            <p className="text-sm">
              Предлагаемый взнос: <strong>{money(scheduledAmount, currency)}</strong>. Рассчитан по
              сроку цели.
            </p>
          ) : (
            <Input
              label={`Сумма взноса · ${currency}`}
              inputMode="decimal"
              value={value.amount}
              onChange={(e) => set({ amount: e.target.value })}
              placeholder="Например, 100"
              maxLength={12}
            />
          )}
          <p className="text-xs text-muted-foreground">
            Первый взнос сегодня. Следующие учитываются только после вашей отметки.
          </p>
        </div>
      )}
      {value.kind === "FREE" && (
        <p className="text-sm text-muted-foreground">
          Пополняйте копилку в удобном темпе. Готовые суммы и ввод своей суммы будут под рукой.
        </p>
      )}
    </>
  );
}
