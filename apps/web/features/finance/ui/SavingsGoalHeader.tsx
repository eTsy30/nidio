import Link from "next/link";
import { ArrowLeft, MoreHorizontal, Pencil } from "lucide-react";

import { Button } from "@/shared/ui";

import { money, progress } from "../model/money";
import type { Goal } from "../model/types";

export function SavingsGoalHeader({
  goal,
  onEdit,
  onMore,
}: {
  goal: Goal;
  onEdit: () => void;
  onMore: () => void;
}) {
  const percent = progress(goal.currentMinor, goal.targetMinor);
  return (
    <header className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/savings"
          className="inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground"
        >
          <ArrowLeft className="size-4" />
          Копилки
        </Link>
        <div className="flex gap-1">
          <Button variant="icon" iconOnly aria-label="Изменить копилку" onClick={onEdit}>
            <Pencil className="size-4" />
          </Button>
          <Button variant="icon" iconOnly aria-label="Действия с копилкой" onClick={onMore}>
            <MoreHorizontal />
          </Button>
        </div>
      </div>
      <div>
        <p className="mb-1 text-xs text-muted-foreground">
          {goal.scope === "PERSONAL" ? "Личная копилка" : "Общая копилка"}
          {goal.archived ? " · В архиве" : ""}
        </p>
        <h1 className="break-words text-2xl font-semibold">{goal.title}</h1>
      </div>
      <div className="space-y-3">
        <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <strong className="text-3xl tracking-tight tabular-nums">
            {money(goal.currentMinor, goal.currency)}
          </strong>
          <span className="text-sm text-muted-foreground">
            из {money(goal.targetMinor, goal.currency)}
          </span>
        </p>
        <div
          role="progressbar"
          aria-label="Накоплено"
          aria-valuenow={Math.round(percent)}
          aria-valuemin={0}
          aria-valuemax={100}
          className="h-2 overflow-hidden rounded-full bg-muted"
        >
          <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
        </div>
        <div className="flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
          <span>
            {goal.currentMinor >= goal.targetMinor
              ? "Цель достигнута"
              : `Осталось ${money(goal.targetMinor - goal.currentMinor, goal.currency)}`}
          </span>
          <span>{Math.round(percent)}%</span>
        </div>
        {goal.targetDate && (
          <p className="text-xs text-muted-foreground">
            К {goal.targetDate.split("-").reverse().join(".")}
          </p>
        )}
      </div>
    </header>
  );
}
