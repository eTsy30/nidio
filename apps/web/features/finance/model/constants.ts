import type { CardTone, Currency, Tone } from "./types";
export const currencies: Currency[] = ["BYN", "EUR", "USD", "RUB"];
export const icons = ["🎯", "🏖️", "🏠", "🎁", "🚲", "🚗", "✨", "💍"];
export const tones: Record<Tone, { label: string; surface: string; bar: string }> = {
  primary: { label: "Основной", surface: "bg-primary/10 text-primary", bar: "bg-primary" },
  success: { label: "Зелёный", surface: "bg-success/10 text-success", bar: "bg-success" },
  warning: { label: "Золотистый", surface: "bg-warning/10 text-warning", bar: "bg-warning" },
  accent: { label: "Акцентный", surface: "bg-accent/10 text-foreground", bar: "bg-accent" },
};
export const cardTones: Record<CardTone, { label: string; surface: string; bar: string }> = {
  blue: {
    label: "Синий",
    surface: "bg-blue-500/90 text-foreground",
    bar: "bg-blue-500",
  },
  sky: {
    label: "Голубой",
    surface: "bg-sky-500/90 text-foreground",
    bar: "bg-sky-500",
  },
  teal: {
    label: "Бирюзовый",
    surface: "bg-teal-500/90 text-foreground",
    bar: "bg-teal-500",
  },
  violet: {
    label: "Фиолетовый",
    surface: "bg-violet-500/90 text-foreground",
    bar: "bg-violet-500",
  },
  pink: {
    label: "Розовый",
    surface: "bg-pink-500/90 text-foreground",
    bar: "bg-pink-500",
  },
  red: {
    label: "Красный",
    surface: "bg-red-500/90 text-foreground",
    bar: "bg-red-500",
  },
  orange: {
    label: "Оранжевый",
    surface: "bg-orange-500/90 text-foreground",
    bar: "bg-orange-500",
  },
  slate: {
    label: "Серый",
    surface: "bg-slate-500/90 text-foreground",
    bar: "bg-slate-500",
  },
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
  cafes: "Кафе и рестораны",
  fuel: "Заправки",
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
