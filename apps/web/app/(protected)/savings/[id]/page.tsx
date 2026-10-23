import { FinancePage } from "@/screens/finance/ui/FinancePage";
export const metadata = { title: "Копилка — Nidio" };
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <FinancePage section="savings" goalId={id} />;
}
