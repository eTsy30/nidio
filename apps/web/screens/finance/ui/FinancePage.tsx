"use client";
import { useState } from "react";
import { Wallet } from "lucide-react";

import { FinanceProvider, useFinanceData } from "@/features/finance/api/FinanceProvider";
import type { Currency } from "@/features/finance/model/types";
import { BudgetTab } from "@/features/finance/ui/BudgetTab";
import { CardsTab } from "@/features/finance/ui/CardsTab";
import { CurrencyField } from "@/features/finance/ui/FinanceFields";
import { SavingsTab } from "@/features/finance/ui/SavingsTab";
import { useCurrentCouple } from "@/features/relationship/hook/use-relationship";
import { Button, Card, Link } from "@/shared/ui";
type Section = "savings" | "cards" | "budget";
const titles = { savings: "Копилки", cards: "Карты", budget: "Бюджет" };
function FinanceContent({ coupleId, tab }: { coupleId: string; tab: Section }) {
  const query = useFinanceData(coupleId);
  const [currency, setCurrency] = useState<Currency>("BYN");
  if (query.isPending)
    return (
      <div role="status" className="space-y-4">
        <p>Загружаем ваши финансы…</p>
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 rounded-3xl bg-muted motion-safe:animate-pulse" />
        ))}
      </div>
    );
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
  return (
    <FinanceProvider data={query.data}>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        {tab !== "cards" && (
          <div className="w-28">
            <CurrencyField value={currency} onChange={setCurrency} />
          </div>
        )}
      </div>
      <section id="finance-savings" aria-label="Копилки" hidden={tab !== "savings"}>
        <SavingsTab currency={currency} />
      </section>
      <section id="finance-cards" aria-label="Карты" hidden={tab !== "cards"}>
        <CardsTab />
      </section>
      <section id="finance-budget" aria-label="Бюджет" hidden={tab !== "budget"}>
        <BudgetTab currency={currency} />
      </section>
    </FinanceProvider>
  );
}
export function FinancePage({ section = "budget" }: { section?: Section }) {
  const couple = useCurrentCouple();
  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 sm:px-8 sm:py-10">
        <header>
          <p className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Wallet className="size-4" />
            Ваши планы на двоих
          </p>
          <h1 className="text-3xl font-semibold">{titles[section]}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Копите на важное, храните скидки и следите за общими расходами.
          </p>
        </header>
        {couple.isPending ? (
          <p role="status">Загрузка…</p>
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
          />
        )}
      </div>
    </div>
  );
}
