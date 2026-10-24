"use client";
import { lazy, Suspense, useState } from "react";

import { FinanceProvider, useFinanceData } from "@/features/finance/api/FinanceProvider";
import type { Currency } from "@/features/finance/model/types";
import { useCurrentCouple } from "@/features/relationship/hook/use-relationship";
import { Button, Card, Link } from "@/shared/ui";
import { LoadingState } from "@/shared/ui/loading/LoadingState";

const BudgetTab = lazy(() =>
  import("@/features/finance/ui/BudgetTab").then((module) => ({ default: module.BudgetTab })),
);
const CardsTab = lazy(() =>
  import("@/features/finance/ui/CardsTab").then((module) => ({ default: module.CardsTab })),
);
const SavingsGoalPage = lazy(() =>
  import("@/features/finance/ui/SavingsGoalPage").then((module) => ({
    default: module.SavingsGoalPage,
  })),
);
const SavingsTab = lazy(() =>
  import("@/features/finance/ui/SavingsTab").then((module) => ({ default: module.SavingsTab })),
);
type Section = "savings" | "cards" | "budget";

function FinanceContent({
  coupleId,
  tab,
  goalId,
}: {
  coupleId: string;
  tab: Section;
  goalId?: string | undefined;
}) {
  const query = useFinanceData(coupleId);
  const [currency, setCurrency] = useState<Currency>("BYN");
  if (query.isPending) return <LoadingState label="Загрузка финансов" />;
  if (!query.data || query.isError)
    return (
      <Card className="space-y-3">
        <h2 className="font-semibold">Не удалось загрузить финансы</h2>
        <p className="text-sm text-muted-foreground">
          Нужно подключение к серверу. Ваши сохранённые данные остаются на сервере.
        </p>
        <Button onClick={() => void query.refetch()} loading={query.isFetching}>
          Повторить
        </Button>
      </Card>
    );
  if (goalId)
    return (
      <FinanceProvider data={query.data}>
        <Suspense fallback={<LoadingState label="Загрузка копилки" />}>
          <SavingsGoalPage id={goalId} />
        </Suspense>
      </FinanceProvider>
    );
  return (
    <FinanceProvider data={query.data}>
      <Suspense fallback={<LoadingState label="Загрузка раздела" />}>
        {tab === "savings" ? (
          <SavingsTab currency={currency} onCurrency={setCurrency} />
        ) : tab === "cards" ? (
          <CardsTab />
        ) : (
          <BudgetTab currency={currency} onCurrency={setCurrency} />
        )}
      </Suspense>
    </FinanceProvider>
  );
}
export function FinancePage({
  section = "budget",
  goalId,
}: {
  section?: Section;
  goalId?: string | undefined;
}) {
  const couple = useCurrentCouple();
  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 sm:px-8 sm:py-10">
        {couple.isPending ? (
          <LoadingState label="Загрузка финансов" />
        ) : couple.isError ? (
          <Card>
            <p>Не удалось проверить связь пары.</p>
            <Button className="mt-3" onClick={() => void couple.refetch()}>
              Повторить
            </Button>
          </Card>
        ) : !couple.data ? (
          <Card className="space-y-3">
            <h2 className="text-xl font-semibold">Финансы для двоих</h2>
            <p className="text-sm text-muted-foreground">
              Пригласите партнёра, чтобы вести общие копилки, карты и бюджет.
            </p>
            <Link href="/invite">Пригласить партнёра</Link>
          </Card>
        ) : (
          <FinanceContent
            key={`${couple.data.id}:${section}`}
            coupleId={couple.data.id}
            tab={section}
            goalId={goalId}
          />
        )}
      </div>
    </div>
  );
}
