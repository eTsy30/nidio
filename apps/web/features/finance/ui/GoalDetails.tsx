import { Pencil, Trash2 } from "lucide-react";

import { Button } from "@/shared/ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog/dialog";

import { useFinance } from "../api/FinanceProvider";
import { money } from "../model/money";
import type { Goal } from "../model/types";

import { ArchiveSavings } from "./ArchiveSavings";
import { CancelSavingsEntry } from "./CancelSavingsEntry";
import { SavingsContributions } from "./SavingsContributions";
import { SavingsForecast } from "./SavingsForecast";
import { SavingsMemory } from "./SavingsMemory";
import { SavingsPlan } from "./SavingsPlan";
export function GoalDetails({
  goal,
  onClose,
  action,
}: {
  goal: Goal;
  onClose: () => void;
  action: (kind: "edit" | "delete" | "deposit" | "withdrawal") => void;
}) {
  const { name } = useFinance();
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {goal.icon} {goal.title}
          </DialogTitle>
          <DialogDescription>
            {money(goal.currentMinor, goal.currency)} из {money(goal.targetMinor, goal.currency)}
          </DialogDescription>
        </DialogHeader>
        {goal.description && (
          <p className="whitespace-pre-wrap break-words text-sm">{goal.description}</p>
        )}
        {goal.targetDate && (
          <p className="text-sm text-muted-foreground">
            Цель к {goal.targetDate.split("-").reverse().join(".")}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <Button disabled={goal.archived} onClick={() => action("deposit")}>
            Пополнить
          </Button>
          <Button
            variant="secondary"
            disabled={!goal.currentMinor || goal.archived}
            onClick={() => action("withdrawal")}
          >
            Снять
          </Button>
          <Button
            variant="icon"
            iconOnly
            aria-label="Изменить копилку"
            onClick={() => action("edit")}
          >
            <Pencil />
          </Button>
          <Button
            variant="icon"
            iconOnly
            aria-label="Удалить копилку"
            onClick={() => action("delete")}
          >
            <Trash2 />
          </Button>
        </div>
        <ArchiveSavings goal={goal} />
        <SavingsContributions goal={goal} />
        <SavingsPlan goal={goal} />
        <SavingsMemory goal={goal} />
        <h3 className="font-semibold">Маленькие победы</h3>
        <div className="flex flex-wrap gap-2">
          {(goal.achievements ?? []).map((item) => (
            <span key={item.percent} className="rounded-md bg-success/10 p-2 text-sm">
              ✓ {item.percent}% · {new Date(item.date).toLocaleDateString("ru-RU")}
            </span>
          ))}
        </div>
        <SavingsForecast goal={goal} />
        <h3 className="font-semibold">История</h3>
        {goal.transactions.length ? (
          <ul className="divide-y divide-border">
            {goal.transactions.map((entry) => (
              <li key={entry.id} className="flex gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">
                    {entry.cancelledAt
                      ? "Отменено"
                      : entry.type === "DEPOSIT"
                        ? "Пополнение"
                        : "Снятие"}{" "}
                    · {name(entry.createdBy)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(entry.createdAt).toLocaleString("ru-RU")}
                  </p>
                  <p className="break-words text-sm">{entry.description}</p>
                  <CancelSavingsEntry entry={entry} goalId={goal.id} />
                </div>
                <span className="text-sm font-semibold">
                  {entry.type === "DEPOSIT" ? "+" : "−"}
                  {money(entry.amountMinor, goal.currency)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            Пополните копилку — здесь появится первая запись.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
