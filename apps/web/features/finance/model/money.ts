import type { FinancialEntry } from "./types";
export function parseMoney(value: string) {
  const normalized = value.trim().replace(",", ".");
  if (!/^\d{1,8}(\.\d{1,2})?$/.test(normalized))
    throw new Error("Введите положительную сумму с точностью до копеек");
  const [whole, fraction = ""] = normalized.split(".");
  const amount = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (amount <= 0 || amount > 2000000000)
    throw new Error("Сумма должна быть от 0,01 до 20 000 000");
  return amount;
}
export const moneyInput = (minor: number) => (minor / 100).toFixed(2);
export const money = (minor: number, currency: string) =>
  new Intl.NumberFormat("ru-RU", { style: "currency", currency }).format(minor / 100);
export const progress = (current: number, target: number) =>
  target > 0 ? Math.min(100, Math.max(0, (current / target) * 100)) : 0;
export function totals(entries: FinancialEntry[]) {
  const income = entries
    .filter((e) => e.type === "INCOME")
    .reduce((sum, e) => sum + e.amountMinor, 0);
  const expense = entries
    .filter((e) => e.type === "EXPENSE")
    .reduce((sum, e) => sum + e.amountMinor, 0);
  return { income, expense, balance: income - expense };
}
