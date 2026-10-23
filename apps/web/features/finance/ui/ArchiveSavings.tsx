"use client";
import { useState } from "react";

import { Button } from "@/shared/ui";

import { useFinance } from "../api/FinanceProvider";
import type { Goal } from "../model/types";

import { FinanceDialog } from "./FinanceDialog";
export function ArchiveSavings({ goal }: { goal: Goal }) {
  const { write } = useFinance();
  const [open, setOpen] = useState(false);
  const label = goal.archived ? "Продолжить копить" : "В архив";
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        {label}
      </Button>
      {open && (
        <FinanceDialog
          title={label}
          onClose={() => setOpen(false)}
          onSubmit={() =>
            write(`/goals/${goal.id}`, "patch", {
              title: goal.title,
              description: goal.description,
              targetMinor: goal.targetMinor,
              currency: goal.currency,
              icon: goal.icon,
              color: goal.color,
              targetDate: goal.targetDate,
              archived: !goal.archived,
            })
          }
        >
          <p>История операций и полученные достижения сохранятся.</p>
        </FinanceDialog>
      )}
    </>
  );
}
