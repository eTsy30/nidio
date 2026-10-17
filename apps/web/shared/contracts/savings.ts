export type SavingsInput = {
  title: string;
  targetMinor: number;
  currency: string;
  periods: number;
  periodUnit: "DAY" | "WEEK";
  distribution: "EQUAL" | "INCREASING" | "RANDOM";
  photoId?: string;
};
export type SavingsGoal = SavingsInput & {
  id: string;
  createdAt: string;
  installments: { id: string; position: number; amountMinor: number; savedAt: string | null }[];
};
