"use client";

import { Input } from "@/shared/ui";

interface BudgetSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export function BudgetSearch({ value, onChange }: BudgetSearchProps) {
  return (
    <Input
      label="Поиск по описанию"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Например, ужин"
    />
  );
}
