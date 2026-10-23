"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";

import { Button, Link } from "@/shared/ui";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/shared/ui/dialog/dialog";

import { useFinance } from "../api/FinanceProvider";
import { strategyOf } from "../model/savings-strategy";

import { SavingsScheduled } from "./savings/SavingsScheduled";
import { ArchiveSavings } from "./ArchiveSavings";
import { ConfirmDelete } from "./FinanceDialog";
import { GoalForm } from "./GoalForm";
import { SavingsEntryForm } from "./SavingsEntryForm";
import { SavingsGoalHeader } from "./SavingsGoalHeader";
import { SavingsHistory } from "./SavingsHistory";
import { SavingsPlan } from "./SavingsPlan";

export function SavingsGoalPage({ id }: { id: string }) {
  const { data, write } = useFinance();
  const router = useRouter();
  const [modal, setModal] = useState<string | null>(null);
  const [suggested, setSuggested] = useState(0);
  const goal = data.goals.find((item) => item.id === id);
  const close = () => setModal(null);
  const deposit = (amount = 0) => {
    setSuggested(amount);
    setModal("deposit");
  };
  if (!goal)
    return (
      <div className="space-y-4">
        <h1>Копилка недоступна</h1>
        <p>Возможно, она удалена или принадлежит другому пользователю.</p>
        <Link href="/savings">Все копилки</Link>
      </div>
    );
  const strategy = strategyOf(goal);
  return (
    <div className="mx-auto max-w-xl space-y-8 pb-6">
      <SavingsGoalHeader
        goal={goal}
        onEdit={() => setModal("edit")}
        onMore={() => setModal("actions")}
      />
      {strategy === "GRID" && <SavingsPlan goal={goal} />}
      {strategy === "SCHEDULE" && <SavingsScheduled goal={goal} onDeposit={deposit} />}
      {strategy === "FREE" && (
        <Button
          fullWidth
          leftIcon={<Plus className="size-4" />}
          disabled={goal.archived}
          onClick={() => deposit()}
          className="shadow-none"
        >
          Пополнить копилку
        </Button>
      )}
      <SavingsHistory goal={goal} />
      {modal === "edit" && <GoalForm goal={goal} currency={goal.currency} onClose={close} />}
      {(modal === "deposit" || modal === "withdrawal") && (
        <SavingsEntryForm
          goal={goal}
          withdrawal={modal === "withdrawal"}
          suggestedMinor={suggested}
          onClose={close}
        />
      )}
      {modal === "actions" && (
        <Dialog open onOpenChange={(open) => !open && close()}>
          <DialogContent>
            <DialogTitle className="min-h-11 pr-12">Действия с копилкой</DialogTitle>
            <DialogDescription>{goal.title}</DialogDescription>
            <Button
              variant="secondary"
              disabled={!goal.currentMinor || goal.archived}
              onClick={() => {
                setSuggested(0);
                setModal("withdrawal");
              }}
            >
              Снять деньги
            </Button>
            <ArchiveSavings goal={goal} />
            <Button variant="destructive" leftIcon={<Trash2 />} onClick={() => setModal("delete")}>
              Удалить копилку
            </Button>
          </DialogContent>
        </Dialog>
      )}
      {modal === "delete" && (
        <ConfirmDelete
          title={`Удалить «${goal.title}» и историю?`}
          onClose={close}
          onDelete={async () => {
            await write(`/goals/${id}`, "delete");
            router.replace("/savings");
          }}
        />
      )}
    </div>
  );
}
