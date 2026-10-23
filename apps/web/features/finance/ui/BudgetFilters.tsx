import {
  CalendarClock,
  CalendarDays,
  CalendarRange,
  ChartNoAxesCombined,
  CircleUserRound,
  Grid2X2,
} from "lucide-react";

import { Input } from "@/shared/ui";
import { IconSelect } from "@/shared/ui/select/IconSelect";

import { useFinance } from "../api/FinanceProvider";
import { expenseCategories, incomeCategories } from "../model/constants";
import type { Currency } from "../model/types";

import { CurrencyField } from "./FinanceFields";

export interface BudgetFilterState {
  period: string;
  start: string;
  end: string;
  category: string;
  author: string;
  search: string;
}

export function BudgetFilters({
  value,
  change,
  currency,
  onCurrency,
}: {
  value: BudgetFilterState;
  change: (next: Partial<BudgetFilterState>) => void;
  currency: Currency;
  onCurrency?: (currency: Currency) => void;
}) {
  const { data } = useFinance();

  const periodOptions = [
    {
      value: "week",
      label: "Эта неделя",
      icon: <CalendarDays className="size-4" />,
    },
    {
      value: "month",
      label: "Этот месяц",
      icon: <CalendarRange className="size-4" />,
    },
    {
      value: "year",
      label: "Этот год",
      icon: <ChartNoAxesCombined className="size-4" />,
    },
    {
      value: "custom",
      label: "Выбрать даты",
      icon: <CalendarClock className="size-4" />,
    },
  ];

  const categoryOptions = [
    {
      value: "ALL",
      label: "Все категории",
      icon: <Grid2X2 className="size-4" />,
    },
    ...Object.entries({
      ...expenseCategories,
      ...incomeCategories,
    }).map(([key, label]) => ({
      value: key,
      label,
      icon: <Grid2X2 className="size-4" />,
    })),
  ];

  const authorOptions = [
    {
      value: "ALL",
      label: "Оба участника",
      icon: <CircleUserRound className="size-4" />,
    },
    ...data.members.map((member) => ({
      value: member.id,
      label: member.firstName,
      icon: <CircleUserRound className="size-4" />,
    })),
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <IconSelect
        label="Период"
        value={value.period}
        onChange={(period) => change({ period })}
        options={periodOptions}
      />

      <IconSelect
        label="Категория"
        value={value.category}
        onChange={(category) => change({ category })}
        options={categoryOptions}
      />

      <IconSelect
        label="Кто добавил"
        value={value.author}
        onChange={(author) => change({ author })}
        options={authorOptions}
      />
      <CurrencyField value={currency} {...(onCurrency ? { onChange: onCurrency } : {})} />

      {value.period === "custom" && (
        <>
          <Input
            label="С даты"
            type="date"
            required
            value={value.start}
            onChange={(e) => change({ start: e.target.value })}
          />

          <Input
            label="По дату включительно"
            type="date"
            required
            min={value.start}
            value={value.end}
            onChange={(e) => change({ end: e.target.value })}
          />
        </>
      )}
    </div>
  );
}
