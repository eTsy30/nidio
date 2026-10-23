import { Input, Select } from "@/shared/ui";

import { currencies, tones } from "../model/constants";
import type { Currency, Tone } from "../model/types";
export function AmountField({
  value,
  onChange,
  label = "Сумма",
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  disabled?: boolean;
}) {
  return (
    <Input
      label={label}
      disabled={disabled}
      inputMode="decimal"
      required
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="0,00"
      maxLength={12}
    />
  );
}

import { IconSelect } from "@/shared/ui/select/IconSelect";

const currencyOptions = [
  { value: "BYN", label: "Бел. рубль", symbol: "Br" },
  { value: "EUR", label: "Евро", symbol: "€" },
  { value: "USD", label: "Доллар США", symbol: "$" },
  { value: "RUB", label: "Рос. рубль", symbol: "₽" },
] satisfies {
  value: Currency;
  label: string;
  symbol: string;
}[];

export function CurrencyField({
  value,
  onChange,
}: {
  value: Currency;
  onChange?: (value: Currency) => void;
  disabled?: boolean;
}) {
  return (
    <IconSelect
      label="Валюта"
      value={value}
      onChange={(nextValue) => onChange?.(nextValue as Currency)}
      options={currencyOptions.map(({ value, label, symbol }) => ({
        value,
        label: `${label}`,
        icon: (
          <span className="flex size-4 items-center justify-center text-sm font-semibold">
            {symbol}
          </span>
        ),
      }))}
    />
  );
}

export function ToneField({ value, onChange }: { value: Tone; onChange: (value: Tone) => void }) {
  return (
    <Select label="Цвет" value={value} onChange={(e) => onChange(e.target.value as Tone)}>
      {Object.entries(tones).map(([key, tone]) => (
        <option key={key} value={key}>
          {tone.label}
        </option>
      ))}
    </Select>
  );
}
