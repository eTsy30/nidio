"use client";

import type { LucideIcon } from "lucide-react";
import {
  BriefcaseBusiness,
  Car,
  CreditCard,
  Gift,
  Grid2X2,
  HeartPulse,
  House,
  Laptop,
  Popcorn,
  RotateCcw,
  ShoppingBag,
  ShoppingBasket,
  Utensils,
  Wallet,
} from "lucide-react";

import { IconSelect } from "@/shared/ui/select/IconSelect";

const categoryIcons: Record<string, LucideIcon> = {
  groceries: ShoppingBasket,
  cafes: Utensils,
  transport: Car,
  housing: House,
  shopping: ShoppingBag,
  entertainment: Popcorn,
  health: HeartPulse,
  subscriptions: CreditCard,
  gifts: Gift,
  salary: BriefcaseBusiness,
  freelance: Laptop,
  refund: RotateCcw,
  other: Wallet,
};

export function CategorySelect({
  value,
  onChange,
  type,
  incomeCategories,
  expenseCategories,
}: {
  value: string;
  onChange: (value: string) => void;
  type: "INCOME" | "EXPENSE";
  incomeCategories: Record<string, string>;
  expenseCategories: Record<string, string>;
}) {
  const categories = type === "INCOME" ? incomeCategories : expenseCategories;

  const options = [
    {
      value: "all",
      label: "Все категории",
      icon: <Grid2X2 className="size-4" />,
    },
    ...Object.entries(categories).map(([categoryValue, label]) => {
      const Icon = categoryIcons[categoryValue] ?? Wallet;

      return {
        value: categoryValue,
        label,
        icon: <Icon className="size-4" />,
      };
    }),
  ];

  return <IconSelect label="Категория" value={value} onChange={onChange} options={options} />;
}
