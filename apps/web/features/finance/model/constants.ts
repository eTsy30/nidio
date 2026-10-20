import type { Currency, Tone } from "./types";
export const currencies: Currency[] = ["BYN", "EUR", "USD", "RUB"];
export const icons = ["🎯", "🏖️", "🏠", "🎁", "🚲", "🚗", "✨", "💍"];
export const tones: Record<Tone, { label: string; surface: string; bar: string }> = {
  primary: { label: "Терракотовый", surface: "bg-primary/10 text-primary", bar: "bg-primary" },
  success: { label: "Зелёный", surface: "bg-success/10 text-success", bar: "bg-success" },
  warning: { label: "Золотистый", surface: "bg-warning/10 text-warning", bar: "bg-warning" },
  accent: { label: "Коралловый", surface: "bg-accent/10 text-foreground", bar: "bg-accent" },
};
export const expenseCategories = {
  groceries: "Продукты",
  cafes: "Кафе и рестораны",
  transport: "Транспорт",
  housing: "Жильё",
  shopping: "Покупки",
  entertainment: "Развлечения",
  health: "Здоровье",
  subscriptions: "Подписки",
  gifts: "Подарки",
  other: "Другое",
};
export const incomeCategories = {
  salary: "Зарплата",
  freelance: "Подработка",
  gifts: "Подарки",
  refund: "Возврат средств",
  other: "Другое",
};
export const cardCategories = {
  groceries: "Продукты",
  clothes: "Одежда",
  home: "Дом",
  entertainment: "Развлечения",
  pharmacy: "Аптеки",
  other: "Другое",
};
export const categoryName = (key: string) =>
  (
    ({
      ALL: "Весь бюджет",
      ...expenseCategories,
      ...incomeCategories,
      ...cardCategories,
    }) as Record<string, string>
  )[key] ?? key;
