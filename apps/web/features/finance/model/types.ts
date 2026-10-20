export type Currency = "BYN" | "EUR" | "USD" | "RUB";
export type Tone = "primary" | "success" | "warning" | "accent";
export interface SavingsEntry {
  id: string;
  amountMinor: number;
  type: "DEPOSIT" | "WITHDRAWAL";
  createdBy: string;
  description: string;
  createdAt: string;
}
export interface GoalInput {
  title: string;
  description: string;
  targetMinor: number;
  currency: Currency;
  icon: string;
  color: Tone;
  targetDate: string | null;
}
export interface Goal extends GoalInput {
  id: string;
  currentMinor: number;
  transactions: SavingsEntry[];
}
export interface CardInput {
  storeName: string;
  cardNumber: string;
  barcodeFormat: "NONE" | "QR" | "EAN13";
  category: string;
  comment: string;
  color: Tone;
  isFavorite: boolean;
}
export interface LoyaltyCard extends CardInput {
  id: string;
  hasImage: boolean;
  lastUsedAt: string | null;
  updatedAt: string;
}
export interface EntryInput {
  amountMinor: number;
  currency: Currency;
  type: "INCOME" | "EXPENSE";
  category: string;
  date: string;
  description: string;
  requestId: string;
}
export interface FinancialEntry extends EntryInput {
  id: string;
  createdBy: string;
}
export interface BudgetLimit {
  id: string;
  currency: Currency;
  category: string;
  month: string;
  amountMinor: number;
}
export interface FinanceData {
  coupleId: string;
  goals: Goal[];
  cards: LoyaltyCard[];
  transactions: FinancialEntry[];
  limits: BudgetLimit[];
  members: { id: string; firstName: string }[];
}
