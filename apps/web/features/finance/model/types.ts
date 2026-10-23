export type Currency = "BYN" | "EUR" | "USD" | "RUB";
export type Tone = "primary" | "success" | "warning" | "accent";
export type CardTone = "blue" | "sky" | "teal" | "violet" | "pink" | "red" | "orange" | "slate";
export type SavingsStrategy = "FREE" | "GRID" | "SCHEDULE";
export type SavingsPeriod = "WEEK" | "MONTH";
export interface SavingsEntry {
  stepId?: string | null;
  cancelledAt?: string | null;
  id: string;
  amountMinor: number;
  type: "DEPOSIT" | "WITHDRAWAL";
  createdBy: string;
  description: string;
  createdAt: string;
}
export interface GoalInput {
  strategy?: SavingsStrategy;
  gridOrder?: "ASC" | "SHUFFLE";
  scheduleEvery?: SavingsPeriod | null;
  scheduleAmountMinor?: number | null;
  scheduleStartDate?: string | null;
  planAmounts?: number[];
  scope?: "COUPLE" | "PERSONAL";
  archived?: boolean;
  title: string;
  description: string;
  targetMinor: number;
  currency: Currency;
  icon: string;
  color: Tone;
  targetDate: string | null;
}
export interface Goal extends GoalInput {
  ownerId?: string | null;
  createdAt?: string;
  plan?: { id: string; amountMinor: number }[];
  achievements?: {
    percent: number;
    date: string;
    amountMinor: number;
    title?: string;
    currency?: string;
    contributions?: { userId: string; amountMinor: number }[];
  }[];
  id: string;
  currentMinor: number;
  transactions: SavingsEntry[];
}
export interface CardInput {
  storeName: string;
  cardNumber: string;
  barcodeFormat: "NONE" | "QR" | "EAN13" | "EAN8" | "CODE128";
  category: string;
  comment: string;
  color: CardTone;
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
  members: { id: string; firstName: string; savingsColor?: Tone }[];
}
