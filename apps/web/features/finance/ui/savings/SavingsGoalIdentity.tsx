import { Input, Select } from "@/shared/ui";

import { currencies } from "../../model/constants";
import type { Currency } from "../../model/types";

import styles from "./savings.module.css";

export function SavingsGoalIdentity({
  title,
  amount,
  currency,
  locked,
  onTitleChange,
  onAmountChange,
  onCurrencyChange,
}: {
  title: string;
  amount: string;
  currency: Currency;
  locked: boolean;
  onTitleChange: (value: string) => void;
  onAmountChange: (value: string) => void;
  onCurrencyChange: (value: Currency) => void;
}) {
  return (
    <>
      <div className={styles.group}>
        <Input
          label="Название"
          variant="ghost"
          className="px-0 shadow-none"
          placeholder="Например, на отпуск"
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
          maxLength={100}
          required
        />
      </div>
      <div className={styles.group}>
        <div className="grid grid-cols-[minmax(0,1fr)_5.5rem] items-end gap-3">
          <Input
            label="Сколько копим"
            inputMode="decimal"
            variant="ghost"
            className="px-0 text-3xl font-semibold tabular-nums shadow-none"
            placeholder="0"
            value={amount}
            onChange={(event) => onAmountChange(event.target.value)}
            required
            maxLength={12}
          />
          <Select
            aria-label="Валюта цели"
            className="border-0 bg-muted shadow-none"
            value={currency}
            onChange={(event) => onCurrencyChange(event.target.value as Currency)}
            disabled={locked}
          >
            {currencies.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </Select>
        </div>
      </div>
    </>
  );
}
