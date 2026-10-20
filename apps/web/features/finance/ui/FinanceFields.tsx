import { Input, Select } from "@/shared/ui";

import { currencies, tones } from "../model/constants";
import type { Currency, Tone } from "../model/types";
export function AmountField({
  value,
  onChange,
  label = "Сумма",
}: {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}) {
  return (
    <Input
      label={label}
      inputMode="decimal"
      required
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="0,00"
      maxLength={12}
    />
  );
}
export function CurrencyField({
  value,
  onChange,
  disabled,
}: {
  value: Currency;
  onChange?: (value: Currency) => void;
  disabled?: boolean;
}) {
  return (
    <Select
      label="Валюта"
      value={value}
      disabled={disabled}
      onChange={(e) => onChange?.(e.target.value as Currency)}
    >
      {currencies.map((c) => (
        <option key={c}>{c}</option>
      ))}
    </Select>
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
