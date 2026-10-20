import type { Metadata } from "next";

import { FinancePage } from "@/screens/finance/ui/FinancePage";
export const metadata: Metadata = { title: "Финансы — Nidio" };
export default function Page() {
  return <FinancePage />;
}
